const multer = require('multer');
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types including bank statement formats
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/x-ofx', // OFX format
      'application/vnd.intu.qfx', // Quicken format
      'application/octet-stream' // Fallback for some file types
    ];
    
    // Also check file extension as fallback (some browsers don't send correct MIME types)
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.pdf', '.txt', '.ofx', '.qfx', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype || 'unknown'}. Allowed types: CSV, Excel, PDF, TXT, OFX, QFX`), false);
    }
  }
});

// Upload single file
const uploadFile = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { type = 'general' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Generate file key
    const fileKey = s3Service.generateFileKey(tenantId, type, req.file.originalname);
    
    // Upload to S3 - convert ObjectIds to strings for metadata
    const result = await s3Service.uploadFile(req.file, fileKey, {
      originalName: req.file.originalname,
      uploadedBy: req.user.id.toString(),
      tenantId: tenantId.toString()
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      file: {
        key: result.key,
        location: result.location,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });

  } catch (error) {
    logger.error(`File upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
};

// Upload multiple files
const uploadFiles = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { type = 'general' } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const uploadPromises = req.files.map(file => {
      const fileKey = s3Service.generateFileKey(tenantId, type, file.originalname);
      return s3Service.uploadFile(file, fileKey, {
        originalName: file.originalname,
        uploadedBy: req.user.id.toString(),
        tenantId: tenantId.toString()
      });
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    res.json({
      success: true,
      uploaded: successfulUploads.length,
      failed: failedUploads.length,
      files: successfulUploads.map((result, index) => ({
        key: result.key,
        location: result.location,
        originalName: req.files[index].originalname,
        size: req.files[index].size,
        type: req.files[index].mimetype
      })),
      errors: failedUploads.map(result => result.error)
    });

  } catch (error) {
    logger.error(`Multiple file upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
};

// Get file download URL
const getDownloadUrl = async (req, res) => {
  try {
    const { key } = req.params;
    const { expiresIn = 3600 } = req.query;

    const result = await s3Service.generatePresignedUrl(key, 'getObject', parseInt(expiresIn));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      downloadUrl: result.url,
      expiresIn: parseInt(expiresIn)
    });

  } catch (error) {
    logger.error(`Get download URL error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL'
    });
  }
};

// List files
const listFiles = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { prefix = '', type = '' } = req.query;
    
    let searchPrefix = `tenants/${tenantId}`;
    if (type) {
      searchPrefix += `/${type}`;
    }
    if (prefix) {
      searchPrefix += `/${prefix}`;
    }

    const result = await s3Service.listFiles(searchPrefix);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      files: result.files
    });

  } catch (error) {
    logger.error(`List files error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await s3Service.deleteFile(key);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error(`Delete file error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  uploadFiles,
  getDownloadUrl,
  listFiles,
  deleteFile
};
