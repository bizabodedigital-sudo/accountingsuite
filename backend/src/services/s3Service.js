const AWS = require('aws-sdk');
const config = require('../config/env');
const logger = require('../config/logger');

// Configure AWS S3 with MinIO
const s3Config = {
  endpoint: config.storage.s3.endpoint,
  accessKeyId: config.storage.s3.accessKey,
  secretAccessKey: config.storage.s3.secretKey,
  region: config.storage.s3.region,
  s3ForcePathStyle: config.storage.s3.forcePathStyle,
  signatureVersion: 'v4'
};

const s3 = new AWS.S3(s3Config);

class S3Service {
  constructor() {
    this.bucket = config.storage.s3.bucket;
    this.initializeBucket();
  }

  async initializeBucket() {
    try {
      // Check if bucket exists
      await s3.headBucket({ Bucket: this.bucket }).promise();
      logger.info(`S3 bucket '${this.bucket}' already exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        // Bucket doesn't exist, create it
        try {
          await s3.createBucket({ Bucket: this.bucket }).promise();
          logger.info(`Created S3 bucket '${this.bucket}'`);
        } catch (createError) {
          logger.error(`Failed to create S3 bucket: ${createError.message}`);
          throw createError;
        }
      } else {
        logger.error(`Failed to check S3 bucket: ${error.message}`);
        throw error;
      }
    }
  }

  async uploadFile(file, key, metadata = {}) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer || file,
        ContentType: file.mimetype || 'application/octet-stream',
        Metadata: metadata
      };

      const result = await s3.upload(params).promise();
      logger.info(`File uploaded successfully: ${result.Location}`);
      return {
        success: true,
        location: result.Location,
        key: result.Key,
        etag: result.ETag
      };
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error(`Failed to download file: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
      return {
        success: true
      };
    } catch (error) {
      logger.error(`Failed to delete file: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(prefix = '') {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix
      };

      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          etag: item.ETag
        }))
      };
    } catch (error) {
      logger.error(`Failed to list files: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generatePresignedUrl(key, operation = 'getObject', expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      };

      const url = await s3.getSignedUrlPromise(operation, params);
      return {
        success: true,
        url: url
      };
    } catch (error) {
      logger.error(`Failed to generate presigned URL: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to generate file keys
  generateFileKey(tenantId, type, filename) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `tenants/${tenantId}/${type}/${timestamp}/${filename}`;
  }
}

module.exports = new S3Service();
