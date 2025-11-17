const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogSummary
} = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getAuditLogs);

router.route('/summary')
  .get(getAuditLogSummary);

module.exports = router;

