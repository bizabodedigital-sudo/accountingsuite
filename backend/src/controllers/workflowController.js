const Workflow = require('../models/Workflow');
const WorkflowService = require('../services/workflowService');
const logger = require('../config/logger');

/**
 * @desc    Get all workflows
 * @route   GET /api/workflows
 * @access  Private
 */
const getWorkflows = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, triggerType } = req.query;
    const query = req.tenantQuery();

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (triggerType) {
      query['trigger.type'] = triggerType;
    }

    const workflows = await Workflow.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Workflow.countDocuments(query);

    res.status(200).json({
      success: true,
      data: workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching workflows'
    });
  }
};

/**
 * @desc    Get single workflow
 * @route   GET /api/workflows/:id
 * @access  Private
 */
const getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('createdBy', 'firstName lastName email');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching workflow'
    });
  }
};

/**
 * @desc    Create workflow
 * @route   POST /api/workflows
 * @access  Private
 */
const createWorkflow = async (req, res) => {
  try {
    const workflowData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const workflow = await Workflow.create(workflowData);

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error creating workflow'
    });
  }
};

/**
 * @desc    Update workflow
 * @route   PUT /api/workflows/:id
 * @access  Private
 */
const updateWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantQuery()
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Update workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating workflow'
    });
  }
};

/**
 * @desc    Delete workflow
 * @route   DELETE /api/workflows/:id
 * @access  Private
 */
const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    logger.error('Delete workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting workflow'
    });
  }
};

/**
 * @desc    Test workflow
 * @route   POST /api/workflows/:id/test
 * @access  Private
 */
const testWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    // Use provided test context or create a mock context
    const testContext = req.body.context || {
      documentType: 'INVOICE',
      documentId: 'test',
      status: 'SENT',
      amount: 1000,
      customerId: 'test'
    };

    const result = await WorkflowService.executeWorkflow(workflow, testContext);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Test workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error testing workflow'
    });
  }
};

/**
 * @desc    Toggle workflow active status
 * @route   POST /api/workflows/:id/toggle
 * @access  Private
 */
const toggleWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    logger.error('Toggle workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error toggling workflow'
    });
  }
};

module.exports = {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  testWorkflow,
  toggleWorkflow
};




