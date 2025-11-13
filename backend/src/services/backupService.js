const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../config/logger');
const config = require('../config/env');
const s3Service = require('./s3Service');

const execAsync = promisify(exec);

/**
 * Backup and Recovery Service
 * Handles automatic backups and data recovery
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Create a full database backup
   * @param {String} tenantId - Optional tenant ID for tenant-specific backup
   * @returns {Object} Backup result
   */
  async createBackup(tenantId = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = tenantId 
        ? `backup-${tenantId}-${timestamp}`
        : `backup-full-${timestamp}`;
      
      const backupPath = path.join(this.backupDir, `${backupName}.json`);

      // Get all collections
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const backupData = {
        timestamp: new Date().toISOString(),
        tenantId: tenantId || 'all',
        version: '1.0',
        collections: {}
      };

      // Backup each collection
      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Skip system collections
        if (collectionName.startsWith('system.')) {
          continue;
        }

        const Model = mongoose.models[collectionName] || 
                     mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }));
        
        let query = {};
        if (tenantId) {
          // Filter by tenant if tenantId provided
          query = { tenantId: new mongoose.Types.ObjectId(tenantId) };
        }

        const documents = await Model.find(query).lean();
        backupData.collections[collectionName] = documents;
        
        logger.info(`Backed up ${documents.length} documents from ${collectionName}`);
      }

      // Save backup to file
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      
      // Upload to S3 if configured
      let s3Location = null;
      if (config.storage.s3.bucket) {
        try {
          const s3Key = `backups/${backupName}.json`;
          const fileBuffer = await fs.readFile(backupPath);
          const result = await s3Service.uploadFile(
            { buffer: fileBuffer, originalname: `${backupName}.json` },
            s3Key,
            { backupType: tenantId ? 'tenant' : 'full', timestamp }
          );
          
          if (result.success) {
            s3Location = result.location;
          }
        } catch (s3Error) {
          logger.warn('Failed to upload backup to S3:', s3Error);
        }
      }

      const backupInfo = {
        success: true,
        backupName,
        backupPath,
        s3Location,
        timestamp: backupData.timestamp,
        size: (await fs.stat(backupPath)).size,
        collections: Object.keys(backupData.collections),
        documentCount: Object.values(backupData.collections).reduce(
          (sum, docs) => sum + docs.length, 0
        )
      };

      logger.info(`Backup created successfully: ${backupName}`);
      return backupInfo;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {String} backupPath - Path to backup file
   * @param {String} tenantId - Optional tenant ID for tenant-specific restore
   * @param {Boolean} overwrite - Whether to overwrite existing data
   * @returns {Object} Restore result
   */
  async restoreBackup(backupPath, tenantId = null, overwrite = false) {
    try {
      // Read backup file
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

      if (!backupData.collections) {
        throw new Error('Invalid backup file format');
      }

      const restoredCollections = [];
      let totalDocuments = 0;

      // Restore each collection
      for (const [collectionName, documents] of Object.entries(backupData.collections)) {
        if (!documents || documents.length === 0) {
          continue;
        }

        try {
          const Model = mongoose.models[collectionName] || 
                       mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }));

          // Clear existing data if overwrite is true
          if (overwrite) {
            let deleteQuery = {};
            if (tenantId) {
              deleteQuery = { tenantId: new mongoose.Types.ObjectId(tenantId) };
            }
            await Model.deleteMany(deleteQuery);
          }

          // Filter by tenant if specified
          let documentsToRestore = documents;
          if (tenantId) {
            documentsToRestore = documents.filter(
              doc => doc.tenantId && doc.tenantId.toString() === tenantId
            );
          }

          // Restore documents
          if (documentsToRestore.length > 0) {
            await Model.insertMany(documentsToRestore, { ordered: false });
            restoredCollections.push(collectionName);
            totalDocuments += documentsToRestore.length;
            logger.info(`Restored ${documentsToRestore.length} documents to ${collectionName}`);
          }
        } catch (error) {
          logger.error(`Failed to restore collection ${collectionName}:`, error);
          // Continue with other collections
        }
      }

      return {
        success: true,
        restoredCollections,
        totalDocuments,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      logger.error('Backup restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   * @param {String} tenantId - Optional tenant ID to filter backups
   * @returns {Array} List of backups
   */
  async listBackups(tenantId = null) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        try {
          const backupData = JSON.parse(await fs.readFile(filePath, 'utf8'));
          
          // Filter by tenant if specified
          if (tenantId && backupData.tenantId !== tenantId && backupData.tenantId !== 'all') {
            continue;
          }

          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            timestamp: backupData.timestamp,
            tenantId: backupData.tenantId,
            collections: Object.keys(backupData.collections || {}),
            documentCount: Object.values(backupData.collections || {}).reduce(
              (sum, docs) => sum + docs.length, 0
            )
          });
        } catch (error) {
          logger.warn(`Failed to read backup file ${file}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Delete old backups (keep only last N backups)
   * @param {Number} keepCount - Number of backups to keep
   * @param {String} tenantId - Optional tenant ID
   * @returns {Object} Deletion result
   */
  async cleanupOldBackups(keepCount = 10, tenantId = null) {
    try {
      const backups = await this.listBackups(tenantId);
      
      if (backups.length <= keepCount) {
        return { success: true, deleted: 0, message: 'No backups to delete' };
      }

      const backupsToDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of backupsToDelete) {
        try {
          await fs.unlink(backup.path);
          deletedCount++;
          logger.info(`Deleted old backup: ${backup.name}`);
        } catch (error) {
          logger.error(`Failed to delete backup ${backup.name}:`, error);
        }
      }

      return {
        success: true,
        deleted: deletedCount,
        kept: keepCount
      };
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   * @param {String} schedule - Cron schedule (e.g., '0 2 * * *' for daily at 2 AM)
   * @param {String} tenantId - Optional tenant ID
   */
  scheduleBackup(schedule, tenantId = null) {
    // This would typically use a job scheduler like node-cron
    // For now, this is a placeholder
    logger.info(`Backup scheduled: ${schedule} for tenant ${tenantId || 'all'}`);
    return { success: true, schedule, tenantId };
  }
}

module.exports = new BackupService();

