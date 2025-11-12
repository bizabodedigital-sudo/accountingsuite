const puppeteer = require('puppeteer');
const logger = require('../config/logger');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async generateInvoicePDF(invoice, customer, tenant) {
    try {
      await this.initialize();
      const page = await this.browser.newPage();

      // Generate HTML for the invoice
      const html = this.generateInvoiceHTML(invoice, customer, tenant);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await page.close();
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation error:', error);
      throw error;
    }
  }

  generateInvoiceHTML(invoice, customer, tenant) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-JM', {
        style: 'currency',
        currency: tenant.currency || 'JMD',
        minimumFractionDigits: 2
      }).format(amount);
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-JM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.number || 'Draft'}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .company-details {
            color: #6b7280;
            font-size: 14px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h2 {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
          }
          .invoice-number {
            color: #6b7280;
            font-size: 16px;
            margin-top: 5px;
          }
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .bill-to h3 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .customer-info {
            color: #374151;
          }
          .customer-info p {
            margin: 2px 0;
          }
          .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 14px;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
          }
          .meta-label {
            font-weight: 600;
            color: #1f2937;
          }
          .meta-value {
            color: #374151;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .font-medium {
            font-weight: 500;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-table {
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-row.total {
            background-color: #f9fafb;
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 18px;
            color: #1f2937;
            border-bottom: none;
          }
          .notes {
            margin-bottom: 30px;
          }
          .notes h3 {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .notes p {
            color: #374151;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <h1>${tenant.name}</h1>
              <div class="company-details">
                ${tenant.settings?.address ? `<p>${tenant.settings.address}</p>` : ''}
                <div style="display: flex; gap: 20px; font-size: 12px;">
                  ${tenant.settings?.phone ? `<span>Tel: ${tenant.settings.phone}</span>` : ''}
                  ${tenant.settings?.email ? `<span>Email: ${tenant.settings.email}</span>` : ''}
                  ${tenant.settings?.website ? `<span>Web: ${tenant.settings.website}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              ${invoice.number ? `<div class="invoice-number">#${invoice.number}</div>` : ''}
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="invoice-details">
            <div class="bill-to">
              <h3>Bill To:</h3>
              <div class="customer-info">
                <p style="font-weight: 500; margin-bottom: 5px;">${customer.name}</p>
                <p>${customer.email}</p>
                ${customer.phone ? `<p>${customer.phone}</p>` : ''}
                ${customer.address ? `<p>${customer.address}</p>` : ''}
              </div>
            </div>
            <div class="invoice-meta">
              <div class="meta-item">
                <span class="meta-label">Invoice Date:</span>
                <span class="meta-value">${formatDate(invoice.issueDate)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Due Date:</span>
                <span class="meta-value">${formatDate(invoice.dueDate)}</span>
              </div>
              ${invoice.poNumber ? `
                <div class="meta-item">
                  <span class="meta-label">PO Number:</span>
                  <span class="meta-value">${invoice.poNumber}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right font-medium">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <div class="totals-table">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span class="font-medium">${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="totals-row">
                <span>Tax (${invoice.taxRate}%):</span>
                <span class="font-medium">${formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div class="totals-row total">
                <span>Total:</span>
                <span>${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${invoice.notes ? `
            <div class="notes">
              <h3>Notes:</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business!</p>
            ${tenant.settings?.website ? `<p style="margin-top: 5px;">Visit us at ${tenant.settings.website}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PDFService();


