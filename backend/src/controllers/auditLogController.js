const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * @desc    Get audit logs
 * @route   GET /api/audit-logs
 * @access  Private
 */
const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entityType, 
      entityId,
      userId,
      startDate,
      endDate 
    } = req.query;
    
    const query = req.tenantQuery({
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && { userId })
    });

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('entityId')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting audit logs'
    });
  }
};

/**
 * @desc    Get audit log summary
 * @route   GET /api/audit-logs/summary
 * @access  Private
 */
const getAuditLogSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = req.tenantQuery();
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    const summary = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const entitySummary = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byAction: summary,
        byEntity: entitySummary,
        total: await AuditLog.countDocuments(matchQuery)
      }
    });
  } catch (error) {
    logger.error('Get audit log summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting audit log summary'
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogSummary
};

