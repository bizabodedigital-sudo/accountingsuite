const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  initializeCOA,
  deleteAccount
} = require('../controllers/chartOfAccountController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getAccounts)
  .post(authorize('OWNER', 'ACCOUNTANT'), createAccount);

router.route('/initialize')
  .post(authorize('OWNER'), initializeCOA);

router.route('/:id')
  .get(getAccount)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateAccount)
  .delete(authorize('OWNER'), deleteAccount);

module.exports = router;

