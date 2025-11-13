const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass) {
        this.transporter = nodemailer.createTransporter({
          host: config.email.smtp.host,
          port: config.email.smtp.port || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass
          }
        });
        
        logger.info('Email service initialized with SMTP');
      } else {
        logger.warn('Email service not configured - SMTP credentials missing');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendInvoiceEmail(invoice, customer, pdfBuffer = null) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available - invoice not sent');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"${invoice.tenantId.name}" <${config.email.smtp.user}>`,
        to: customer.email,
        subject: `Invoice ${invoice.number} from ${invoice.tenantId.name}`,
        html: this.generateInvoiceEmailHTML(invoice, customer),
        attachments: pdfBuffer ? [{
          filename: `invoice-${invoice.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : []
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Invoice email sent to ${customer.email}: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send invoice email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user, tenant) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available - welcome email not sent');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"${tenant.name}" <${config.email.smtp.user}>`,
        to: user.email,
        subject: `Welcome to ${tenant.name} - Bizabode Accounting Suite`,
        html: this.generateWelcomeEmailHTML(user, tenant)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  generateInvoiceEmailHTML(invoice, customer) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007BFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .total { font-size: 18px; font-weight: bold; color: #007BFF; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoice.number}</h1>
            <p>From ${invoice.tenantId.name}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customer.name},</p>
            
            <p>Please find attached your invoice for the services provided.</p>
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.number}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
              
              <h4>Items</h4>
              ${invoice.items.map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                  <strong>${item.description}</strong><br>
                  Quantity: ${item.quantity} × $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}
                </div>
              `).join('')}
              
              <div style="margin-top: 20px; text-align: right;">
                <p><strong>Subtotal:</strong> $${invoice.subtotal.toFixed(2)}</p>
                <p><strong>Tax (${invoice.taxRate}%):</strong> $${invoice.taxAmount.toFixed(2)}</p>
                <p class="total">Total: $${invoice.total.toFixed(2)}</p>
              </div>
            </div>
            
            <p>Thank you for your business!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Bizabode Accounting Suite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailHTML(user, tenant) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${tenant.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007BFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${tenant.name}!</h1>
            <p>Bizabode Accounting Suite</p>
          </div>
          
          <div class="content">
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <p>Welcome to Bizabode Accounting Suite! Your account has been successfully created.</p>
            
            <p>You can now access your accounting dashboard and start managing your business finances.</p>
            
            <p>Key features available to you:</p>
            <ul>
              <li>Create and send invoices</li>
              <li>Track expenses and vendors</li>
              <li>Manage customers</li>
              <li>Generate financial reports</li>
              <li>Monitor your business KPIs</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Bizabode Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Bizabode Accounting Suite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(user, resetToken, resetUrl) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available - password reset email not sent');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"Bizabode" <${config.email.smtp.user}>`,
        to: user.email,
        subject: 'Password Reset Request - Bizabode',
        html: this.generatePasswordResetEmailHTML(user, resetToken, resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${user.email}: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvoiceReminderEmail(invoice, customer, daysOverdue = 0) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available - reminder email not sent');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"${invoice.tenantId?.name || 'Bizabode'}" <${config.email.smtp.user}>`,
        to: customer.email,
        subject: `Payment Reminder: Invoice ${invoice.number}`,
        html: this.generateInvoiceReminderEmailHTML(invoice, customer, daysOverdue)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Invoice reminder email sent to ${customer.email}: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send invoice reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendCustomEmail(to, subject, htmlContent, attachments = []) {
    try {
      if (!this.transporter) {
        logger.warn('Email service not available');
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"Bizabode" <${config.email.smtp.user}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: htmlContent,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Custom email sent: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send custom email:', error);
      return { success: false, error: error.message };
    }
  }

  generatePasswordResetEmailHTML(user, resetToken, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007BFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007BFF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <p>We received a request to reset your password for your Bizabode account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007BFF;">${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Bizabode Accounting Suite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateInvoiceReminderEmailHTML(invoice, customer, daysOverdue) {
    const overdueText = daysOverdue > 0 
      ? `<p style="color: #dc3545; font-weight: bold;">This invoice is ${daysOverdue} day(s) overdue.</p>`
      : '<p>This is a friendly reminder about your outstanding invoice.</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007BFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .total { font-size: 18px; font-weight: bold; color: #007BFF; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <p>Invoice ${invoice.number}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customer.name},</p>
            
            ${overdueText}
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoice.number}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Amount Due:</strong> <span class="total">$${invoice.total.toFixed(2)}</span></p>
            </div>
            
            <p>Please make payment at your earliest convenience. If you have already made payment, please disregard this reminder.</p>
            
            <p>Thank you for your business!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Bizabode Accounting Suite</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not configured' };
      }

      await this.transporter.verify();
      logger.info('Email service connection verified');
      return { success: true };
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();













