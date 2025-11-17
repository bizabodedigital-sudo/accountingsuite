const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getEmployees)
  .post(authorize('OWNER', 'ACCOUNTANT'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('OWNER', 'ACCOUNTANT'), updateEmployee)
  .delete(authorize('OWNER'), deleteEmployee);

module.exports = router;

