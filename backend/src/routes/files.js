const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  upload,
  uploadFile,
  uploadFiles,
  getDownloadUrl,
  listFiles,
  deleteFile
} = require('../controllers/fileController');

// Apply authentication middleware to all routes
router.use(protect);

// Upload single file
router.post('/upload', upload.single('file'), uploadFile);

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), uploadFiles);

// Get download URL for a file
router.get('/download/:key', getDownloadUrl);

// List files
router.get('/list', listFiles);

// Delete file
router.delete('/:key', deleteFile);

module.exports = router;
