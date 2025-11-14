const { Worker } = require('bullmq');
const emailService = require('../services/emailService');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const logger = require('../config/logger');

class EmailWorker {
  constructor(connection) {
    this.connection = connection;
    this.worker = null;
  }

  start() {
    this.worker = new Worker('email-queue', this.processEmailJob.bind(this), {
      connection: this.connection,
      concurrency: 5,
      removeOnComplete: 100,
      removeOnFail: 50
    });

    this.worker.on('completed', (job) => {
      logger.info(`Email job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Email job ${job.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      logger.error('Email worker error:', err);
    });

    logger.info('Email worker started');
  }

  async processEmailJob(job) {
    const { type, data } = job.data;

    try {
      switch (type) {
        case 'send_invoice':
          return await this.sendInvoiceEmail(data);
        case 'send_welcome':
          return await this.sendWelcomeEmail(data);
        case 'send_reminder':
          return await this.sendReminderEmail(data);
        default:
          throw new Error(`Unknown email job type: ${type}`);
      }
    } catch (error) {
      logger.error(`Email job processing failed:`, error);
      throw error;
    }
  }

  async sendInvoiceEmail(data) {
    const { invoiceId, customerId, pdfBuffer } = data;

    // Get invoice and customer data
    const invoice = await Invoice.findById(invoiceId)
      .populate('tenantId', 'name')
      .populate('customerId', 'name email');

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Send email
    const result = await emailService.sendInvoiceEmail(invoice, customer, pdfBuffer);
    
    if (result.success) {
      // Update invoice status if needed
      await Invoice.findByIdAndUpdate(invoiceId, { 
        status: 'SENT',
        sentAt: new Date()
      });
      
      logger.info(`Invoice ${invoice.number} sent to ${customer.email}`);
    }

    return result;
  }

  async sendWelcomeEmail(data) {
    const { userId, tenantId } = data;

    // Get user and tenant data
    const User = require('../models/User');
    const Tenant = require('../models/Tenant');
    
    const user = await User.findById(userId);
    const tenant = await Tenant.findById(tenantId);

    if (!user || !tenant) {
      throw new Error('User or tenant not found');
    }

    // Send welcome email
    const result = await emailService.sendWelcomeEmail(user, tenant);
    
    if (result.success) {
      logger.info(`Welcome email sent to ${user.email}`);
    }

    return result;
  }

  async sendReminderEmail(data) {
    const { invoiceId, reminderType } = data;

    // Get invoice data
    const invoice = await Invoice.findById(invoiceId)
      .populate('customerId', 'name email')
      .populate('tenantId', 'name');

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Generate reminder email content
    const reminderContent = this.generateReminderContent(invoice, reminderType);
    
    // Send reminder email
    const result = await emailService.sendReminderEmail(invoice, reminderContent);
    
    if (result.success) {
      logger.info(`Reminder email sent for invoice ${invoice.number}`);
    }

    return result;
  }

  generateReminderContent(invoice, reminderType) {
    const daysOverdue = Math.ceil((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24));
    
    let subject, message;
    
    switch (reminderType) {
      case 'payment_due':
        subject = `Payment Reminder - Invoice ${invoice.number}`;
        message = `This is a friendly reminder that payment for invoice ${invoice.number} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.`;
        break;
      case 'payment_overdue':
        subject = `Overdue Payment - Invoice ${invoice.number}`;
        message = `Invoice ${invoice.number} is now ${daysOverdue} days overdue. Please arrange payment as soon as possible.`;
        break;
      case 'final_notice':
        subject = `Final Notice - Invoice ${invoice.number}`;
        message = `This is a final notice for invoice ${invoice.number} which is ${daysOverdue} days overdue. Immediate payment is required.`;
        break;
      default:
        subject = `Payment Reminder - Invoice ${invoice.number}`;
        message = `This is a reminder about invoice ${invoice.number}.`;
    }

    return { subject, message };
  }

  stop() {
    if (this.worker) {
      this.worker.close();
      logger.info('Email worker stopped');
    }
  }
}

module.exports = EmailWorker;















