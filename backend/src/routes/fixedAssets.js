const express = require('express');
const {
  getFixedAssets,
  getFixedAsset,
  createFixedAsset,
  updateFixedAsset,
  deleteFixedAsset,
  calculateDepreciation,
  postDepreciation,
  disposeAsset,
  getDepreciationSchedule
} = require('../controllers/fixedAssetController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

router.route('/')
  .get(getFixedAssets)
  .post(createFixedAsset);

router.route('/:id')
  .get(getFixedAsset)
  .put(updateFixedAsset)
  .delete(deleteFixedAsset);

router.route('/:id/calculate-depreciation')
  .post(calculateDepreciation);

router.route('/:id/post-depreciation')
  .post(postDepreciation);

router.route('/:id/dispose')
  .post(disposeAsset);

router.route('/:id/depreciation-schedule')
  .get(getDepreciationSchedule);

module.exports = router;

