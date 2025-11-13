const express = require('express');
const {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  cleanupBackups
} = require('../controllers/backupController');
const { protect, authorize, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Backup routes
router.route('/')
  .get(authorize('OWNER', 'ACCOUNTANT'), listBackups)
  .post(authorize('OWNER', 'ACCOUNTANT'), createBackup);

router.route('/restore/:backupName')
  .post(authorize('OWNER'), restoreBackup);

router.route('/:backupName')
  .delete(authorize('OWNER'), deleteBackup);

router.route('/cleanup')
  .post(authorize('OWNER'), cleanupBackups);

module.exports = router;

