const Employee = require('../models/Employee');
const logger = require('../config/logger');
const eventEmitter = require('../services/eventEmitter');

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private
 */
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, search } = req.query;
    
    const query = req.tenantQuery({
      ...(status && { status }),
      ...(department && { department })
    });

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting employees'
    });
  }
};

/**
 * @desc    Get single employee
 * @route   GET /api/employees/:id
 * @access  Private
 */
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('createdBy', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting employee'
    });
  }
};

/**
 * @desc    Create employee
 * @route   POST /api/employees
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createEmployee = async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const employee = await Employee.create(employeeData);

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('employee.created', populatedEmployee.toObject(), req.user.tenantId);

    res.status(201).json({
      success: true,
      data: populatedEmployee
    });
  } catch (error) {
    logger.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating employee'
    });
  }
};

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (OWNER, ACCOUNTANT)
 */
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery() },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    eventEmitter.emitEvent('employee.updated', employee.toObject(), req.user.tenantId);

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating employee'
    });
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (OWNER only)
 */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    eventEmitter.emitEvent('employee.deleted', { id: employee._id, employeeNumber: employee.employeeNumber }, req.user.tenantId);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting employee'
    });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
};

