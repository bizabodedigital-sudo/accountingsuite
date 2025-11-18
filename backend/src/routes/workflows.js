const express = require('express');
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  testWorkflow,
  toggleWorkflow
} = require('../controllers/workflowController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

router.route('/')
  .get(getWorkflows)
  .post(createWorkflow);

router.route('/:id')
  .get(getWorkflow)
  .put(updateWorkflow)
  .delete(deleteWorkflow);

router.route('/:id/test')
  .post(testWorkflow);

router.route('/:id/toggle')
  .post(toggleWorkflow);

module.exports = router;




