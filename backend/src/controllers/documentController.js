const Document = require('../models/Document');
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');

// @desc    Upload document
// @route   POST /api/documents
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, description, category, tags, relatedTo, isPublic, accessLevel } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Upload file to S3
    const fileKey = s3Service.generateFileKey(tenantId, 'documents', req.file.originalname);
    const uploadResult = await s3Service.uploadFile(req.file, fileKey, {
      originalName: req.file.originalname,
      uploadedBy: req.user._id.toString(),
      tenantId: tenantId.toString(),
      category: category || 'GENERAL'
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Failed to upload file'
      });
    }

    // Create document record
    const document = await Document.create({
      tenantId,
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      description,
      fileKey: uploadResult.key,
      fileUrl: uploadResult.location,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category: category || 'GENERAL',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      relatedTo: relatedTo ? {
        type: relatedTo.type,
        id: relatedTo.id
      } : { type: 'OTHER' },
      uploadedBy: req.user._id,
      isPublic: isPublic === true,
      accessLevel: accessLevel || 'TENANT'
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document'
    });
  }
};

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { category, relatedToType, relatedToId, tags, page = 1, limit = 20 } = req.query;

    const query = { tenantId };

    if (category) {
      query.category = category;
    }

    if (relatedToType && relatedToId) {
      query['relatedTo.type'] = relatedToType;
      query['relatedTo.id'] = relatedToId;
    }

    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : tags.split(',') };
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get documents'
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const document = await Document.findOne({
      _id: req.params.id,
      tenantId
    }).populate('uploadedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document'
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, description, category, tags, relatedTo } = req.body;

    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      {
        name,
        description,
        category,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
        relatedTo: relatedTo ? {
          type: relatedTo.type,
          id: relatedTo.id
        } : undefined
      },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update document'
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      tenantId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete file from storage
    try {
      const s3Service = require('../services/s3Service');
      await s3Service.deleteFile(document.fileKey);
    } catch (error) {
      logger.warn('Failed to delete file from storage:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document'
    });
  }
};

// @desc    Get document download URL
// @route   GET /api/documents/:id/download
// @access  Private
const getDownloadUrl = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const document = await Document.findOne({
      _id: req.params.id,
      tenantId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const s3Service = require('../services/s3Service');
    const result = await s3Service.generatePresignedUrl(document.fileKey, 'getObject', 3600);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      downloadUrl: result.url,
      expiresIn: 3600
    });
  } catch (error) {
    logger.error('Get download URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get download URL'
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDownloadUrl
};

