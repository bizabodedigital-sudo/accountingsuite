const PaymentReminderService = require('../services/paymentReminderService');
const logger = require('../config/logger');

/**
 * @desc    Send payment reminder
 * @route   POST /api/payment-reminders/:invoiceId
 * @access  Private
 */
const sendReminder = async (req, res) => {
  try {
    const { reminderType } = req.body;
    
    const result = await PaymentReminderService.sendReminder(
      req.params.invoiceId,
      reminderType
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error sending reminder'
    });
  }
};

/**
 * @desc    Send overdue reminders
 * @route   POST /api/payment-reminders/overdue
 * @access  Private
 */
const sendOverdueReminders = async (req, res) => {
  try {
    const { daysOverdue } = req.body;
    
    const result = await PaymentReminderService.sendOverdueReminders(
      req.user.tenantId,
      daysOverdue || 0
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Send overdue reminders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error sending overdue reminders'
    });
  }
};

/**
 * @desc    Auto-send reminders
 * @route   POST /api/payment-reminders/auto
 * @access  Private
 */
const autoSendReminders = async (req, res) => {
  try {
    const result = await PaymentReminderService.autoSendReminders(
      req.user.tenantId
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Auto-send reminders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error auto-sending reminders'
    });
  }
};

module.exports = {
  sendReminder,
  sendOverdueReminders,
  autoSendReminders
};

