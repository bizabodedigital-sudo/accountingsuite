const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const BankTransaction = require('../models/BankTransaction');
const logger = require('../config/logger');

// Helper function to get date range query
const getDateRangeQuery = (startDate, endDate, dateField = 'date') => {
  if (startDate && endDate) {
    return {
      [dateField]: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }
  return {};
};

// Helper function to calculate aging buckets
const calculateAging = (date, asOfDate = new Date()) => {
  const daysDiff = Math.floor((asOfDate - new Date(date)) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 30) return '0-30';
  if (daysDiff <= 60) return '31-60';
  if (daysDiff <= 90) return '61-90';
  return '90+';
};

// @desc    Generate Profit & Loss Report
// @route   GET /api/reports/profit-loss
// @access  Private
const generateProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Get invoices (revenue)
    const invoiceQuery = {
      ...query,
      status: { $in: ['PAID', 'SENT'] },
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    };
    
    const invoices = await Invoice.find(invoiceQuery).populate('customerId', 'name');
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Get expenses
    const expenseQuery = {
      ...query,
      ...getDateRangeQuery(startDate, endDate, 'date')
    };
    
    const expenses = await Expense.find(expenseQuery).populate('vendorId', 'name');
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        revenue: {
          total: totalRevenue,
          invoiceCount: invoices.length,
          invoices: invoices.map(inv => ({
            number: inv.number,
            date: inv.issueDate,
            amount: inv.total,
            customer: typeof inv.customerId === 'object' ? inv.customerId.name : 'Unknown'
          }))
        },
        expenses: {
          total: totalExpenses,
          expenseCount: expenses.length,
          byCategory: expensesByCategory,
          expenses: expenses.map(exp => ({
            description: exp.description,
            date: exp.date,
            amount: exp.amount,
            category: exp.category
          }))
        },
        profit: {
          net: netProfit,
          margin: profitMargin
        }
      }
    });
  } catch (error) {
    logger.error('Generate profit loss report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating profit loss report'
    });
  }
};

// @desc    Generate Balance Sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
const generateBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const query = req.tenantQuery();
    
    // Assets
    const paidInvoices = await Invoice.find({
      ...query,
      status: 'PAID',
      issueDate: { $lte: asOf }
    });
    const accountsReceivable = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'OVERDUE'] },
      issueDate: { $lte: asOf }
    });
    
    const cash = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const accountsReceivableTotal = accountsReceivable.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Liabilities
    const expenses = await Expense.find({
      ...query,
      date: { $lte: asOf }
    });
    const accountsPayable = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Equity
    const totalAssets = cash + accountsReceivableTotal;
    const totalLiabilities = accountsPayable;
    const equity = totalAssets - totalLiabilities;
    
    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        assets: {
          cash,
          accountsReceivable: accountsReceivableTotal,
          total: totalAssets
        },
        liabilities: {
          accountsPayable: totalLiabilities,
          total: totalLiabilities
        },
        equity: {
          retainedEarnings: equity,
          total: equity
        },
        balance: {
          totalAssets,
          totalLiabilities,
          totalEquity: equity,
          isBalanced: Math.abs((totalAssets - (totalLiabilities + equity))) < 0.01
        }
      }
    });
  } catch (error) {
    logger.error('Generate balance sheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating balance sheet'
    });
  }
};

// @desc    Generate Cash Flow Statement
// @route   GET /api/reports/cash-flow
// @access  Private
const generateCashFlow = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Operating Activities
    const paidInvoices = await Invoice.find({
      ...query,
      status: 'PAID',
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    });
    const operatingInflow = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const expenses = await Expense.find({
      ...query,
      ...getDateRangeQuery(startDate, endDate, 'date')
    });
    const operatingOutflow = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const netOperatingCash = operatingInflow - operatingOutflow;
    
    // Investing Activities (placeholder - would need asset tracking)
    const investingInflow = 0;
    const investingOutflow = 0;
    const netInvestingCash = investingInflow - investingOutflow;
    
    // Financing Activities (placeholder - would need loan/equity tracking)
    const financingInflow = 0;
    const financingOutflow = 0;
    const netFinancingCash = financingInflow - financingOutflow;
    
    const netChangeInCash = netOperatingCash + netInvestingCash + netFinancingCash;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        operating: {
          inflow: operatingInflow,
          outflow: operatingOutflow,
          net: netOperatingCash
        },
        investing: {
          inflow: investingInflow,
          outflow: investingOutflow,
          net: netInvestingCash
        },
        financing: {
          inflow: financingInflow,
          outflow: financingOutflow,
          net: netFinancingCash
        },
        summary: {
          netChangeInCash,
          beginningCash: 0, // Would need to track
          endingCash: netChangeInCash
        }
      }
    });
  } catch (error) {
    logger.error('Generate cash flow error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating cash flow statement'
    });
  }
};

// @desc    Generate Accounts Receivable Aging
// @route   GET /api/reports/accounts-receivable-aging
// @access  Private
const generateAccountsReceivableAging = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const query = req.tenantQuery();
    
    const invoices = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'OVERDUE'] },
      issueDate: { $lte: asOf }
    }).populate('customerId', 'name email');
    
    const agingBuckets = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': []
    };
    
    const totals = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
      total: 0
    };
    
    invoices.forEach(inv => {
      const aging = calculateAging(inv.issueDate, asOf);
      const amount = inv.total || 0;
      
      agingBuckets[aging].push({
        invoiceNumber: inv.number,
        customer: typeof inv.customerId === 'object' ? inv.customerId.name : 'Unknown',
        email: typeof inv.customerId === 'object' ? inv.customerId.email : '',
        date: inv.issueDate,
        dueDate: inv.dueDate || inv.issueDate,
        amount,
        daysOverdue: Math.floor((asOf - new Date(inv.issueDate)) / (1000 * 60 * 60 * 24)),
        status: inv.status
      });
      
      totals[aging] += amount;
      totals.total += amount;
    });
    
    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        agingBuckets,
        totals,
        summary: {
          totalCustomers: new Set(invoices.map(inv => 
            typeof inv.customerId === 'object' ? inv.customerId._id.toString() : inv.customerId?.toString()
          )).size,
          totalInvoices: invoices.length,
          averageDaysOverdue: invoices.length > 0
            ? invoices.reduce((sum, inv) => 
                sum + Math.floor((asOf - new Date(inv.issueDate)) / (1000 * 60 * 60 * 24)), 0) / invoices.length
            : 0
        }
      }
    });
  } catch (error) {
    logger.error('Generate AR aging error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating accounts receivable aging report'
    });
  }
};

// @desc    Generate Accounts Payable Aging
// @route   GET /api/reports/accounts-payable-aging
// @access  Private
const generateAccountsPayableAging = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const query = req.tenantQuery();
    
    const expenses = await Expense.find({
      ...query,
      date: { $lte: asOf }
    }).populate('vendorId', 'name email');
    
    const agingBuckets = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': []
    };
    
    const totals = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
      total: 0
    };
    
    expenses.forEach(exp => {
      const aging = calculateAging(exp.date, asOf);
      const amount = exp.amount || 0;
      
      agingBuckets[aging].push({
        description: exp.description,
        vendor: typeof exp.vendorId === 'object' ? exp.vendorId.name : 'Unknown',
        email: typeof exp.vendorId === 'object' ? exp.vendorId.email : '',
        date: exp.date,
        amount,
        daysAged: Math.floor((asOf - new Date(exp.date)) / (1000 * 60 * 60 * 24)),
        category: exp.category
      });
      
      totals[aging] += amount;
      totals.total += amount;
    });
    
    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        agingBuckets,
        totals,
        summary: {
          totalVendors: new Set(expenses.map(exp => 
            typeof exp.vendorId === 'object' ? exp.vendorId._id.toString() : exp.vendorId?.toString()
          )).size,
          totalExpenses: expenses.length
        }
      }
    });
  } catch (error) {
    logger.error('Generate AP aging error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating accounts payable aging report'
    });
  }
};

// @desc    Generate Sales by Customer
// @route   GET /api/reports/sales-by-customer
// @access  Private
const generateSalesByCustomer = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery({
      status: { $in: ['PAID', 'SENT'] },
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    });
    
    const invoices = await Invoice.find(query).populate('customerId', 'name email');
    
    const customerSales = invoices.reduce((acc, inv) => {
      const customerId = typeof inv.customerId === 'object' 
        ? inv.customerId._id.toString() 
        : inv.customerId?.toString() || 'unknown';
      
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: typeof inv.customerId === 'object' ? inv.customerId.name : 'Unknown',
          email: typeof inv.customerId === 'object' ? inv.customerId.email : '',
          invoiceCount: 0,
          total: 0,
          invoices: []
        };
      }
      
      acc[customerId].invoiceCount += 1;
      acc[customerId].total += inv.total || 0;
      acc[customerId].invoices.push({
        number: inv.number,
        date: inv.issueDate,
        amount: inv.total
      });
      
      return acc;
    }, {});
    
    const customerList = Object.values(customerSales)
      .sort((a, b) => b.total - a.total);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        customers: customerList,
        summary: {
          totalCustomers: customerList.length,
          totalRevenue: customerList.reduce((sum, c) => sum + c.total, 0),
          averagePerCustomer: customerList.length > 0 
            ? customerList.reduce((sum, c) => sum + c.total, 0) / customerList.length 
            : 0,
          topCustomer: customerList[0] || null
        }
      }
    });
  } catch (error) {
    logger.error('Generate sales by customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating sales by customer report'
    });
  }
};

// @desc    Generate Sales by Product
// @route   GET /api/reports/sales-by-product
// @access  Private
const generateSalesByProduct = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery({
      status: { $in: ['PAID', 'SENT'] },
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    });
    
    const invoices = await Invoice.find(query);
    
    const productSales = {};
    
    invoices.forEach(inv => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach(item => {
          const productKey = item.description || 'Other';
          
          if (!productSales[productKey]) {
            productSales[productKey] = {
              product: productKey,
              quantity: 0,
              revenue: 0,
              invoiceCount: 0
            };
          }
          
          productSales[productKey].quantity += item.quantity || 0;
          productSales[productKey].revenue += item.total || 0;
          productSales[productKey].invoiceCount += 1;
        });
      }
    });
    
    const productList = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        products: productList,
        summary: {
          totalProducts: productList.length,
          totalRevenue: productList.reduce((sum, p) => sum + p.revenue, 0),
          totalQuantity: productList.reduce((sum, p) => sum + p.quantity, 0),
          topProduct: productList[0] || null
        }
      }
    });
  } catch (error) {
    logger.error('Generate sales by product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating sales by product report'
    });
  }
};

// @desc    Generate Expenses by Vendor
// @route   GET /api/reports/expenses-by-vendor
// @access  Private
const generateExpensesByVendor = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery({
      ...getDateRangeQuery(startDate, endDate, 'date')
    });
    
    const expenses = await Expense.find(query).populate('vendorId', 'name email');
    
    const vendorExpenses = expenses.reduce((acc, exp) => {
      const vendorId = typeof exp.vendorId === 'object' 
        ? exp.vendorId._id.toString() 
        : exp.vendorId?.toString() || 'unknown';
      
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: typeof exp.vendorId === 'object' ? exp.vendorId.name : 'Unknown',
          email: typeof exp.vendorId === 'object' ? exp.vendorId.email : '',
          expenseCount: 0,
          total: 0,
          expenses: []
        };
      }
      
      acc[vendorId].expenseCount += 1;
      acc[vendorId].total += exp.amount || 0;
      acc[vendorId].expenses.push({
        description: exp.description,
        date: exp.date,
        amount: exp.amount,
        category: exp.category
      });
      
      return acc;
    }, {});
    
    const vendorList = Object.values(vendorExpenses)
      .sort((a, b) => b.total - a.total);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        vendors: vendorList,
        summary: {
          totalVendors: vendorList.length,
          totalExpenses: vendorList.reduce((sum, v) => sum + v.total, 0),
          averagePerVendor: vendorList.length > 0 
            ? vendorList.reduce((sum, v) => sum + v.total, 0) / vendorList.length 
            : 0
        }
      }
    });
  } catch (error) {
    logger.error('Generate expenses by vendor error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating expenses by vendor report'
    });
  }
};

// @desc    Generate Income by Customer Summary (alias for sales by customer)
// @route   GET /api/reports/income-by-customer
// @access  Private
const generateIncomeByCustomer = generateSalesByCustomer;

// @desc    Generate Expenses by Category Summary
// @route   GET /api/reports/expenses-by-category
// @access  Private
const generateExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery({
      ...getDateRangeQuery(startDate, endDate, 'date')
    });
    
    const expenses = await Expense.find(query);
    
    const categoryExpenses = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          total: 0,
          taxDeductible: 0,
          expenses: []
        };
      }
      
      acc[category].count += 1;
      acc[category].total += exp.amount || 0;
      if (exp.isTaxDeductible) {
        acc[category].taxDeductible += exp.amount || 0;
      }
      acc[category].expenses.push({
        description: exp.description,
        date: exp.date,
        amount: exp.amount,
        isTaxDeductible: exp.isTaxDeductible
      });
      
      return acc;
    }, {});
    
    const categoryList = Object.values(categoryExpenses)
      .sort((a, b) => b.total - a.total);
    
    const totalExpenses = categoryList.reduce((sum, c) => sum + c.total, 0);
    const taxDeductibleTotal = expenses
      .filter(e => e.isTaxDeductible)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        categories: categoryList,
        summary: {
          totalExpenses,
          taxDeductibleTotal,
          categoryCount: categoryList.length,
          expenseCount: expenses.length
        }
      }
    });
  } catch (error) {
    logger.error('Generate expenses by category report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating expenses by category report'
    });
  }
};

// @desc    Generate Tax Summary
// @route   GET /api/reports/tax-summary
// @access  Private
const generateTaxSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    const invoices = await Invoice.find({
      ...query,
      status: { $in: ['PAID', 'SENT'] },
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    });
    
    const expenses = await Expense.find({
      ...query,
      ...getDateRangeQuery(startDate, endDate, 'date')
    });
    
    const taxableRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const taxDeductibleExpenses = expenses
      .filter(e => e.isTaxDeductible)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const netTaxableIncome = taxableRevenue - taxDeductibleExpenses;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        revenue: {
          total: taxableRevenue,
          invoiceCount: invoices.length
        },
        deductions: {
          total: taxDeductibleExpenses,
          expenseCount: expenses.filter(e => e.isTaxDeductible).length
        },
        taxableIncome: {
          net: netTaxableIncome,
          estimatedTax: netTaxableIncome * 0.25 // Placeholder - would use actual tax rate
        }
      }
    });
  } catch (error) {
    logger.error('Generate tax summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating tax summary report'
    });
  }
};

// @desc    Generate Trial Balance
// @route   GET /api/reports/trial-balance
// @access  Private
const generateTrialBalance = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const query = req.tenantQuery();
    
    // Revenue accounts
    const paidInvoices = await Invoice.find({
      ...query,
      status: 'PAID',
      issueDate: { $lte: asOf }
    });
    const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Expense accounts
    const expenses = await Expense.find({
      ...query,
      date: { $lte: asOf }
    });
    const expenseTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Asset accounts
    const accountsReceivable = await Invoice.find({
      ...query,
      status: { $in: ['SENT', 'OVERDUE'] },
      issueDate: { $lte: asOf }
    });
    const arTotal = accountsReceivable.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const accounts = [
      { account: 'Revenue', debit: 0, credit: revenue },
      { account: 'Expenses', debit: expenseTotal, credit: 0 },
      { account: 'Accounts Receivable', debit: arTotal, credit: 0 },
      { account: 'Cash', debit: revenue, credit: 0 }
    ];
    
    const totalDebits = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = accounts.reduce((sum, acc) => sum + acc.credit, 0);
    
    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        accounts,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          difference: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      }
    });
  } catch (error) {
    logger.error('Generate trial balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating trial balance report'
    });
  }
};

// @desc    Generate Customer Profitability
// @route   GET /api/reports/customer-profitability
// @access  Private
const generateCustomerProfitability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    const invoices = await Invoice.find({
      ...query,
      status: { $in: ['PAID', 'SENT'] },
      ...getDateRangeQuery(startDate, endDate, 'issueDate')
    }).populate('customerId', 'name email');
    
    // This is a simplified version - would need cost tracking for full profitability
    const customerProfitability = invoices.reduce((acc, inv) => {
      const customerId = typeof inv.customerId === 'object' 
        ? inv.customerId._id.toString() 
        : inv.customerId?.toString() || 'unknown';
      
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: typeof inv.customerId === 'object' ? inv.customerId.name : 'Unknown',
          email: typeof inv.customerId === 'object' ? inv.customerId.email : '',
          revenue: 0,
          invoiceCount: 0,
          averageInvoice: 0
        };
      }
      
      acc[customerId].revenue += inv.total || 0;
      acc[customerId].invoiceCount += 1;
      acc[customerId].averageInvoice = acc[customerId].revenue / acc[customerId].invoiceCount;
      
      return acc;
    }, {});
    
    const customerList = Object.values(customerProfitability)
      .sort((a, b) => b.revenue - a.revenue);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        customers: customerList,
        summary: {
          totalCustomers: customerList.length,
          totalRevenue: customerList.reduce((sum, c) => sum + c.revenue, 0),
          mostProfitable: customerList[0] || null
        }
      }
    });
  } catch (error) {
    logger.error('Generate customer profitability error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating customer profitability report'
    });
  }
};

module.exports = {
  generateProfitLoss,
  generateBalanceSheet,
  generateCashFlow,
  generateAccountsReceivableAging,
  generateAccountsPayableAging,
  generateSalesByCustomer,
  generateSalesByProduct,
  generateExpensesByVendor,
  generateIncomeByCustomer,
  generateExpensesByCategory,
  generateTaxSummary,
  generateTrialBalance,
  generateCustomerProfitability
};
