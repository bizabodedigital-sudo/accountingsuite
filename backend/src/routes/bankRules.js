const express = require('express');
const {
  getBankRules,
  getBankRule,
  createBankRule,
  updateBankRule,
  deleteBankRule,
  testBankRule,
  applyBankRules
} = require('../controllers/bankRuleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getBankRules)
  .post(authorize('OWNER', 'ACCOUNTANT'), createBankRule);

router.route('/apply')
  .post(authorize('OWNER', 'ACCOUNTANT'), applyBankRules);

router.route('/:id')
  .get(getBankRule)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateBankRule)
  .delete(authorize('OWNER', 'ACCOUNTANT'), deleteBankRule);

router.route('/:id/test')
  .post(testBankRule);

module.exports = router;

