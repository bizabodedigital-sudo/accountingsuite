const express = require('express');
const {
  getMovements,
  adjustInventory,
  getLowStock,
  getInventorySummary,
  getStockHistory
} = require('../controllers/inventoryController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Inventory routes
router.route('/movements')
  .get(getMovements);

router.route('/adjust')
  .post(adjustInventory);

router.route('/low-stock')
  .get(getLowStock);

router.route('/summary')
  .get(getInventorySummary);

router.route('/history/:productId')
  .get(getStockHistory);

module.exports = router;

