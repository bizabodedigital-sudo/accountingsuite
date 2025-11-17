const Invoice = require('../models/Invoice');
const emailService = require('./emailService');
const logger = require('../config/logger');

/**
 * Payment Reminder Service
 * Handles automated payment reminders
 */
class PaymentReminderService {
  /**
   * Send payment reminder for invoice
   */
  static async sendReminder(invoiceId, reminderType = 'STANDARD') {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('customerId')
        .populate('tenantId');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'PAID') {
        return {
          success: false,
          message: 'Invoice is already paid'
        };
      }

      const daysOverdue = Math.floor((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24));
      
      let subject = '';
      let template = '';

      switch (reminderType) {
        case 'FIRST':
          subject = `Payment Reminder: Invoice ${invoice.number}`;
          template = 'first_reminder';
          break;
        case 'SECOND':
          subject = `Second Reminder: Invoice ${invoice.number}`;
          template = 'second_reminder';
          break;
        case 'FINAL':
          subject = `Final Notice: Invoice ${invoice.number}`;
          template = 'final_notice';
          break;
        case 'OVERDUE':
          subject = `Overdue Invoice: ${invoice.number} - ${daysOverdue} days overdue`;
          template = 'overdue_notice';
          break;
        default:
          subject = `Payment Reminder: Invoice ${invoice.number}`;
          template = 'standard_reminder';
      }

      await emailService.sendInvoiceReminderEmail({
        to: invoice.customerId.email,
        invoice: invoice.toObject(),
        customer: invoice.customerId.toObject(),
        tenant: invoice.tenantId.toObject(),
        daysOverdue,
        reminderType
      });

      logger.info(`Sent ${reminderType} reminder for invoice ${invoice.number}`);

      return {
        success: true,
        message: 'Reminder sent successfully',
        reminderType,
        daysOverdue
      };
    } catch (error) {
      logger.error('Send reminder error:', error);
      throw error;
    }
  }

  /**
   * Send reminders for all overdue invoices
   */
  static async sendOverdueReminders(tenantId, daysOverdue = 0) {
    try {
      const query = {
        tenantId,
        status: { $in: ['SENT', 'OVERDUE'] },
        dueDate: { $lt: new Date() }
      };

      const invoices = await Invoice.find(query)
        .populate('customerId')
        .populate('tenantId');

      const results = [];
      
      for (const invoice of invoices) {
        const days = Math.floor((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24));
        
        if (days >= daysOverdue) {
          try {
            const result = await this.sendReminder(invoice._id, 'OVERDUE');
            results.push({
              invoiceId: invoice._id,
              invoiceNumber: invoice.number,
              ...result
            });
          } catch (error) {
            results.push({
              invoiceId: invoice._id,
              invoiceNumber: invoice.number,
              success: false,
              error: error.message
            });
          }
        }
      }

      return {
        success: true,
        total: invoices.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      logger.error('Send overdue reminders error:', error);
      throw error;
    }
  }

  /**
   * Auto-send reminders based on settings
   */
  static async autoSendReminders(tenantId) {
    try {
      const Tenant = require('../models/Tenant');
      const tenant = await Tenant.findById(tenantId);

      if (!tenant?.settings?.autoSendReminderDaysBeforeDue) {
        return {
          success: true,
          message: 'Auto-reminder not configured'
        };
      }

      const daysBefore = tenant.settings.autoSendReminderDaysBeforeDue;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      const invoices = await Invoice.find({
        tenantId,
        status: 'SENT',
        dueDate: {
          $gte: new Date(),
          $lte: targetDate
        }
      }).populate('customerId');

      const results = [];
      
      for (const invoice of invoices) {
        try {
          const result = await this.sendReminder(invoice._id, 'FIRST');
          results.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.number,
            ...result
          });
        } catch (error) {
          results.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.number,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        total: invoices.length,
        sent: results.filter(r => r.success).length,
        results
      };
    } catch (error) {
      logger.error('Auto-send reminders error:', error);
      throw error;
    }
  }
}

module.exports = PaymentReminderService;

