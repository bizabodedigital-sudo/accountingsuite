const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Payroll = require('../models/Payroll');
const LedgerEntry = require('../models/LedgerEntry');
const ChartOfAccount = require('../models/ChartOfAccount');
const logger = require('../config/logger');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = async (req, res) => {
  try {
    const query = req.tenantQuery();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Revenue (from invoices)
    const invoicesThisMonth = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'PAID'] },
      issueDate: { $gte: startOfMonth }
    });
    const totalRevenue = invoicesThisMonth.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Expenses
    const expensesThisMonth = await Expense.find({
      ...query,
      date: { $gte: startOfMonth }
    });
    const totalExpenses = expensesThisMonth.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Net Income
    const netIncome = totalRevenue - totalExpenses;

    // Pending Invoices
    const pendingInvoices = await Invoice.countDocuments({
      ...query,
      status: 'SENT'
    });

    // Overdue Invoices
    const overdueInvoices = await Invoice.countDocuments({
      ...query,
      status: 'OVERDUE'
    });

    // Recent Payments (last 30 days)
    const recentPayments = await Payment.find({
      ...query,
      paymentDate: { $gte: thirtyDaysAgo }
    }).sort({ paymentDate: -1 }).limit(10);

    // Revenue trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthInvoices = await Invoice.find({
        ...query,
        status: { $in: ['SENT', 'PAID'] },
        issueDate: { $gte: monthStart, $lte: monthEnd }
      });
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      revenueTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }

    // Expense trend (last 6 months)
    const expenseTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthExpenses = await Expense.find({
        ...query,
        date: { $gte: monthStart, $lte: monthEnd }
      });
      
      const monthExpense = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      expenseTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        expenses: monthExpense
      });
    }

    // Cash Flow (from ledger entries)
    const cashAccounts = await ChartOfAccount.find({
      ...query,
      type: 'ASSET',
      name: { $regex: /cash|bank/i },
      isActive: true
    });

    let cashBalance = 0;
    for (const account of cashAccounts) {
      const entries = await LedgerEntry.find({
        ...query,
        accountId: account._id
      });
      
      entries.forEach(entry => {
        if (entry.entryType === 'DEBIT') {
          cashBalance += entry.amount;
        } else {
          cashBalance -= entry.amount;
        }
      });
    }

    // Outstanding Receivables
    const outstandingInvoices = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'OVERDUE'] }
    });
    const outstandingReceivables = outstandingInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    // Alerts
    const alerts = [];

    // Low stock alerts
    const lowStockProducts = await Product.find({
      ...query,
      isActive: true,
      $expr: {
        $lte: ['$stockQuantity', '$minStockLevel']
      }
    }).limit(5);

    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${lowStockProducts.length} product(s) are below minimum stock level`,
        severity: 'warning',
        actionUrl: '/products',
        actionLabel: 'View Products'
      });
    }

    // Overdue invoices alert
    if (overdueInvoices > 0) {
      alerts.push({
        type: 'OVERDUE_INVOICE',
        title: 'Overdue Invoices',
        message: `${overdueInvoices} invoice(s) are overdue`,
        severity: 'error',
        actionUrl: '/invoices?status=OVERDUE',
        actionLabel: 'View Overdue'
      });
    }

    // Upcoming payroll (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPayroll = await Payroll.countDocuments({
      ...query,
      payDate: { $gte: now, $lte: nextWeek },
      status: { $ne: 'PAID' }
    });

    if (upcomingPayroll > 0) {
      alerts.push({
        type: 'PAYROLL_UPCOMING',
        title: 'Upcoming Payroll',
        message: `${upcomingPayroll} payroll(s) due in the next 7 days`,
        severity: 'info',
        actionUrl: '/payroll',
        actionLabel: 'View Payroll'
      });
    }

    // GCT due (simplified - would need actual tax calculation)
    const gctDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15); // 15th of next month
    const daysUntilGCT = Math.ceil((gctDueDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilGCT <= 7 && daysUntilGCT > 0) {
      alerts.push({
        type: 'GCT_DUE',
        title: 'GCT Payment Due Soon',
        message: `GCT payment is due in ${daysUntilGCT} day(s)`,
        severity: 'warning',
        actionUrl: '/reports?report=tax',
        actionLabel: 'View Tax Report'
      });
    }

    // Top customers (by revenue)
    const customerRevenue = await Invoice.aggregate([
      { $match: { ...query, status: { $in: ['SENT', 'PAID'] } } },
      { $group: { _id: '$customerId', total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalExpenses,
          netIncome,
          pendingInvoices,
          overdueInvoices,
          cashBalance,
          outstandingReceivables
        },
        trends: {
          revenue: revenueTrend,
          expenses: expenseTrend
        },
        recentPayments: recentPayments.map(p => ({
          id: p._id,
          amount: p.amount,
          date: p.paymentDate,
          invoiceNumber: p.invoiceId?.number || 'N/A',
          method: p.paymentMethod
        })),
        topCustomers: customerRevenue.map(c => ({
          customerId: c._id,
          customerName: c.customer.name,
          totalRevenue: c.total
        })),
        alerts
      }
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching dashboard data'
    });
  }
};

module.exports = {
  getDashboard
};





