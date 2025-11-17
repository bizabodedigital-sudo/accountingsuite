const express = require('express');
const {
  getPayrolls,
  getPayroll,
  createPayroll,
  approvePayroll,
  postPayroll,
  markPayrollPaid
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getPayrolls)
  .post(authorize('OWNER', 'ACCOUNTANT'), createPayroll);

router.route('/:id')
  .get(getPayroll);

router.route('/:id/approve')
  .post(authorize('OWNER', 'ACCOUNTANT'), approvePayroll);

router.route('/:id/post')
  .post(authorize('OWNER', 'ACCOUNTANT'), postPayroll);

router.route('/:id/pay')
  .post(authorize('OWNER', 'ACCOUNTANT'), markPayrollPaid);

module.exports = router;

