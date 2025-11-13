const backupService = require('../services/backupService');
const { authorize } = require('../middleware/auth');
const logger = require('../config/logger');

// @desc    Create backup
// @route   POST /api/backup/create
// @access  Private (OWNER, ACCOUNTANT)
const createBackup = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { fullBackup = false } = req.body;

    const backup = await backupService.createBackup(fullBackup ? null : tenantId.toString());

    res.status(201).json({
      success: true,
      data: backup,
      message: 'Backup created successfully'
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create backup'
    });
  }
};

// @desc    List backups
// @route   GET /api/backup
// @access  Private (OWNER, ACCOUNTANT)
const listBackups = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { fullBackup = false } = req.query;

    const backups = await backupService.listBackups(fullBackup ? null : tenantId.toString());

    res.status(200).json({
      success: true,
      data: backups,
      count: backups.length
    });
  } catch (error) {
    logger.error('List backups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list backups'
    });
  }
};

// @desc    Restore backup
// @route   POST /api/backup/restore/:backupName
// @access  Private (OWNER only)
const restoreBackup = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { backupName } = req.params;
    const { overwrite = false, fullRestore = false } = req.body;

    // Find backup file
    const backups = await backupService.listBackups(fullRestore ? null : tenantId.toString());
    const backup = backups.find(b => b.name === backupName);

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: 'Backup not found'
      });
    }

    const result = await backupService.restoreBackup(
      backup.path,
      fullRestore ? null : tenantId.toString(),
      overwrite
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Backup restored successfully'
    });
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore backup'
    });
  }
};

// @desc    Delete backup
// @route   DELETE /api/backup/:backupName
// @access  Private (OWNER only)
const deleteBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const fs = require('fs').promises;
    const path = require('path');
    const backupDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupDir, backupName);

    await fs.unlink(backupPath);

    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    logger.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete backup'
    });
  }
};

// @desc    Cleanup old backups
// @route   POST /api/backup/cleanup
// @access  Private (OWNER only)
const cleanupBackups = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { keepCount = 10, fullBackup = false } = req.body;

    const result = await backupService.cleanupOldBackups(
      keepCount,
      fullBackup ? null : tenantId.toString()
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Cleanup backups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup backups'
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  cleanupBackups
};

