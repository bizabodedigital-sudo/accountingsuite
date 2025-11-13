const express = require('express');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDownloadUrl
} = require('../controllers/documentController');
const { upload } = require('../controllers/fileController');
const { protect, tenantFilter } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Document routes
router.route('/')
  .get(getDocuments)
  .post(upload.single('file'), uploadDocument);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

router.route('/:id/download')
  .get(getDownloadUrl);

module.exports = router;

