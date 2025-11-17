const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const BankTransaction = require('../models/BankTransaction');
const LedgerEntry = require('../models/LedgerEntry');
const ChartOfAccount = require('../models/ChartOfAccount');
const JournalEntry = require('../models/JournalEntry');
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

// @desc    Generate Profit & Loss Report (Ledger-based)
// @route   GET /api/reports/profit-loss
// @access  Private
const generateProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter for ledger entries
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get Income accounts
    const incomeAccounts = await ChartOfAccount.find({
      ...query,
      type: 'INCOME',
      isActive: true
    });
    
    // Get Expense accounts
    const expenseAccounts = await ChartOfAccount.find({
      ...query,
      type: 'EXPENSE',
      isActive: true
    });
    
    // Calculate revenue from ledger entries (Income accounts)
    let totalRevenue = 0;
    const revenueByAccount = {};
    
    for (const account of incomeAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      // Income accounts have CREDIT normal balance
      const accountRevenue = ledgerEntries.reduce((sum, entry) => {
        if (entry.entryType === 'CREDIT') {
          return sum + entry.amount;
        } else {
          return sum - entry.amount;
        }
      }, account.openingBalance || 0);
      
      totalRevenue += accountRevenue;
      revenueByAccount[account.code] = {
        code: account.code,
        name: account.name,
        amount: accountRevenue
      };
    }
    
    // Calculate expenses from ledger entries (Expense accounts)
    let totalExpenses = 0;
    const expensesByAccount = {};
    const expensesByCategory = {};
    
    for (const account of expenseAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      // Expense accounts have DEBIT normal balance
      const accountExpense = ledgerEntries.reduce((sum, entry) => {
        if (entry.entryType === 'DEBIT') {
          return sum + entry.amount;
        } else {
          return sum - entry.amount;
        }
      }, account.openingBalance || 0);
      
      totalExpenses += accountExpense;
      expensesByAccount[account.code] = {
        code: account.code,
        name: account.name,
        amount: accountExpense
      };
      
      // Group by category
      const category = account.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + accountExpense;
    }
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        revenue: {
          total: totalRevenue,
          byAccount: revenueByAccount
        },
        expenses: {
          total: totalExpenses,
          byAccount: expensesByAccount,
          byCategory: expensesByCategory
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

// @desc    Generate Balance Sheet (Ledger-based)
// @route   GET /api/reports/balance-sheet
// @access  Private
const generateBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const query = req.tenantQuery();
    
    // Get all accounts by type
    const assetAccounts = await ChartOfAccount.find({
      ...query,
      type: 'ASSET',
      isActive: true
    });
    
    const liabilityAccounts = await ChartOfAccount.find({
      ...query,
      type: 'LIABILITY',
      isActive: true
    });
    
    const equityAccounts = await ChartOfAccount.find({
      ...query,
      type: 'EQUITY',
      isActive: true
    });
    
    // Calculate asset balances
    let totalAssets = 0;
    const assetsByAccount = {};
    
    for (const account of assetAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        transactionDate: { $lte: asOf }
      });
      
      // Asset accounts have DEBIT normal balance
      const balance = ledgerEntries.reduce((sum, entry) => {
        if (entry.entryType === 'DEBIT') {
          return sum + entry.amount;
        } else {
          return sum - entry.amount;
        }
      }, account.openingBalance || 0);
      
      totalAssets += balance;
      assetsByAccount[account.code] = {
        code: account.code,
        name: account.name,
        balance
      };
    }
    
    // Calculate liability balances
    let totalLiabilities = 0;
    const liabilitiesByAccount = {};
    
    for (const account of liabilityAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        transactionDate: { $lte: asOf }
      });
      
      // Liability accounts have CREDIT normal balance
      const balance = ledgerEntries.reduce((sum, entry) => {
        if (entry.entryType === 'CREDIT') {
          return sum + entry.amount;
        } else {
          return sum - entry.amount;
        }
      }, account.openingBalance || 0);
      
      totalLiabilities += balance;
      liabilitiesByAccount[account.code] = {
        code: account.code,
        name: account.name,
        balance
      };
    }
    
    // Calculate equity balances
    let totalEquity = 0;
    const equityByAccount = {};
    
    for (const account of equityAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        transactionDate: { $lte: asOf }
      });
      
      // Equity accounts have CREDIT normal balance
      const balance = ledgerEntries.reduce((sum, entry) => {
        if (entry.entryType === 'CREDIT') {
          return sum + entry.amount;
        } else {
          return sum - entry.amount;
        }
      }, account.openingBalance || 0);
      
      totalEquity += balance;
      equityByAccount[account.code] = {
        code: account.code,
        name: account.name,
        balance
      };
    }
    
    // Extract key accounts for display
    const cash = assetsByAccount['1010']?.balance || 0;
    const accountsReceivable = assetsByAccount['1030']?.balance || 0;
    const accountsPayable = liabilitiesByAccount['2010']?.balance || 0;
    const retainedEarnings = equityByAccount['5010']?.balance || totalEquity;
    
    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        assets: {
          cash,
          accountsReceivable,
          other: totalAssets - cash - accountsReceivable,
          byAccount: assetsByAccount,
          total: totalAssets
        },
        liabilities: {
          accountsPayable,
          other: totalLiabilities - accountsPayable,
          byAccount: liabilitiesByAccount,
          total: totalLiabilities
        },
        equity: {
          retainedEarnings,
          other: totalEquity - retainedEarnings,
          byAccount: equityByAccount,
          total: totalEquity
        },
        balance: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          isBalanced: Math.abs((totalAssets - (totalLiabilities + totalEquity))) < 0.01
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

    // Get all accounts
    const accounts = await ChartOfAccount.find({
      ...query,
      isActive: true
    });

    // Get ledger entries up to asOfDate
    const ledgerEntries = await LedgerEntry.find({
      ...query,
      transactionDate: { $lte: asOf }
    }).populate('accountId', 'code name type normalBalance');

    // Calculate balances by account
    const accountBalances = {};
    
    accounts.forEach(account => {
      accountBalances[account._id.toString()] = {
        accountId: account._id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        openingBalance: account.openingBalance || 0,
        debit: 0,
        credit: 0,
        balance: account.openingBalance || 0
      };
    });

    // Apply ledger entries
    ledgerEntries.forEach(entry => {
      const accountId = entry.accountId?._id?.toString();
      if (accountId && accountBalances[accountId]) {
        const account = accountBalances[accountId];
        if (entry.entryType === 'DEBIT') {
          account.debit += entry.amount;
        } else {
          account.credit += entry.amount;
        }
      }
    });

    // Calculate final balances
    Object.values(accountBalances).forEach(account => {
      if (account.normalBalance === 'DEBIT') {
        account.balance = account.openingBalance + account.debit - account.credit;
      } else {
        account.balance = account.openingBalance + account.credit - account.debit;
      }
    });

    const accountsList = Object.values(accountBalances).sort((a, b) => 
      a.code.localeCompare(b.code)
    );

    const totalDebits = accountsList.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = accountsList.reduce((sum, acc) => sum + acc.credit, 0);
    const totalOpeningDebits = accountsList.filter(acc => acc.normalBalance === 'DEBIT')
      .reduce((sum, acc) => sum + acc.openingBalance, 0);
    const totalOpeningCredits = accountsList.filter(acc => acc.normalBalance === 'CREDIT')
      .reduce((sum, acc) => sum + acc.openingBalance, 0);

    res.status(200).json({
      success: true,
      data: {
        asOfDate: asOf,
        accounts: accountsList,
        totals: {
          openingDebits: totalOpeningDebits,
          openingCredits: totalOpeningCredits,
          debits: totalDebits,
          credits: totalCredits,
          isBalanced: Math.abs((totalOpeningDebits + totalDebits) - (totalOpeningCredits + totalCredits)) < 0.01
        }
      }
    });
  } catch (error) {
    logger.error('Generate trial balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating trial balance'
    });
  }
};

// @desc    Generate General Ledger
// @route   GET /api/reports/general-ledger
// @access  Private
const generateGeneralLedger = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.query;
    const query = req.tenantQuery();

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    // Get account
    const account = await ChartOfAccount.findOne({
      _id: accountId,
      ...query
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get ledger entries for this account
    const ledgerEntries = await LedgerEntry.find({
      ...query,
      accountId,
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
    })
      .populate('journalEntryId', 'entryNumber entryDate description')
      .sort({ transactionDate: 1, createdAt: 1 });

    // Calculate running balance
    let runningBalance = account.openingBalance || 0;
    const entriesWithBalance = ledgerEntries.map(entry => {
      if (account.normalBalance === 'DEBIT') {
        if (entry.entryType === 'DEBIT') {
          runningBalance += entry.amount;
        } else {
          runningBalance -= entry.amount;
        }
      } else {
        if (entry.entryType === 'CREDIT') {
          runningBalance += entry.amount;
        } else {
          runningBalance -= entry.amount;
        }
      }
      
      return {
        ...entry.toObject(),
        runningBalance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        account: {
          code: account.code,
          name: account.name,
          type: account.type,
          openingBalance: account.openingBalance || 0
        },
        period: { startDate, endDate },
        entries: entriesWithBalance,
        summary: {
          totalDebits: ledgerEntries.filter(e => e.entryType === 'DEBIT')
            .reduce((sum, e) => sum + e.amount, 0),
          totalCredits: ledgerEntries.filter(e => e.entryType === 'CREDIT')
            .reduce((sum, e) => sum + e.amount, 0),
          endingBalance: runningBalance
        }
      }
    });
  } catch (error) {
    logger.error('Generate general ledger error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating general ledger'
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

// @desc    Generate Budget vs Actual Report
// @route   GET /api/reports/budget-vs-actual
// @access  Private
const generateBudgetVsActual = async (req, res) => {
  try {
    const { startDate, endDate, budgetId } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get budget data (if budget module exists, otherwise use account-based budgets)
    // For now, we'll use account opening balances or settings as budget
    const accounts = await ChartOfAccount.find({
      ...query,
      isActive: true,
      type: { $in: ['INCOME', 'EXPENSE'] }
    });
    
    const budgetVsActual = [];
    
    for (const account of accounts) {
      // Get actual from ledger entries
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      // Calculate actual amount
      let actual = 0;
      ledgerEntries.forEach(entry => {
        if (account.type === 'INCOME') {
          // Income: CREDIT increases, DEBIT decreases
          actual += entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
        } else {
          // Expense: DEBIT increases, CREDIT decreases
          actual += entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
        }
      });
      
      // Budget is stored in account.budgetAmount or calculated from opening balance
      const budget = account.budgetAmount || (account.openingBalance || 0);
      const variance = actual - budget;
      const variancePercent = budget !== 0 ? (variance / budget) * 100 : 0;
      
      budgetVsActual.push({
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        budget,
        actual,
        variance,
        variancePercent
      });
    }
    
    // Calculate totals
    const incomeBudget = budgetVsActual
      .filter(a => a.accountType === 'INCOME')
      .reduce((sum, a) => sum + a.budget, 0);
    const incomeActual = budgetVsActual
      .filter(a => a.accountType === 'INCOME')
      .reduce((sum, a) => sum + a.actual, 0);
    const expenseBudget = budgetVsActual
      .filter(a => a.accountType === 'EXPENSE')
      .reduce((sum, a) => sum + a.budget, 0);
    const expenseActual = budgetVsActual
      .filter(a => a.accountType === 'EXPENSE')
      .reduce((sum, a) => sum + a.actual, 0);
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        accounts: budgetVsActual,
        summary: {
          income: {
            budget: incomeBudget,
            actual: incomeActual,
            variance: incomeActual - incomeBudget
          },
          expenses: {
            budget: expenseBudget,
            actual: expenseActual,
            variance: expenseActual - expenseBudget
          },
          netIncome: {
            budget: incomeBudget - expenseBudget,
            actual: incomeActual - expenseActual,
            variance: (incomeActual - expenseActual) - (incomeBudget - expenseBudget)
          }
        }
      }
    });
  } catch (error) {
    logger.error('Generate budget vs actual error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating budget vs actual report'
    });
  }
};

// @desc    Generate Statement of Owner's Equity
// @route   GET /api/reports/owners-equity
// @access  Private
const generateOwnersEquity = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get equity accounts
    const equityAccounts = await ChartOfAccount.find({
      ...query,
      type: 'EQUITY',
      isActive: true
    });
    
    // Get opening equity balance
    let openingEquity = 0;
    equityAccounts.forEach(account => {
      openingEquity += account.openingBalance || 0;
    });
    
    // Get ledger entries for equity accounts
    let equityChanges = 0;
    for (const account of equityAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        if (account.normalBalance === 'CREDIT') {
          equityChanges += entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
        } else {
          equityChanges += entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
        }
      });
    }
    
    // Calculate net income from P&L
    const incomeAccounts = await ChartOfAccount.find({
      ...query,
      type: 'INCOME',
      isActive: true
    });
    
    const expenseAccounts = await ChartOfAccount.find({
      ...query,
      type: 'EXPENSE',
      isActive: true
    });
    
    let revenue = 0;
    for (const account of incomeAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        revenue += entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
      });
    }
    
    let expenses = 0;
    for (const account of expenseAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        expenses += entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
      });
    }
    
    const netIncome = revenue - expenses;
    const endingEquity = openingEquity + equityChanges + netIncome;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        openingEquity,
        netIncome,
        equityChanges,
        endingEquity,
        breakdown: {
          revenue,
          expenses,
          netIncome
        }
      }
    });
  } catch (error) {
    logger.error('Generate owners equity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating owners equity report'
    });
  }
};

// @desc    Generate Cash Flow (Direct Method)
// @route   GET /api/reports/cash-flow-direct
// @access  Private
const generateCashFlowDirect = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get cash accounts
    const cashAccounts = await ChartOfAccount.find({
      ...query,
      type: 'ASSET',
      category: { $in: ['Cash', 'Bank', 'Current Assets'] },
      isActive: true
    });
    
    // Get opening cash balance
    let openingCash = 0;
    cashAccounts.forEach(account => {
      openingCash += account.openingBalance || 0;
    });
    
    // Calculate cash from operations (direct method)
    // Cash received from customers
    const invoices = await Invoice.find({
      ...query,
      status: 'PAID',
      ...(Object.keys(dateFilter).length > 0 && { paidDate: dateFilter })
    });
    
    const cashFromCustomers = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Cash paid to suppliers (expenses)
    const expenses = await Expense.find({
      ...query,
      status: 'PAID',
      ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter })
    });
    
    const cashPaidToSuppliers = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Cash from investing activities (asset sales, etc.)
    // This would come from asset disposal transactions
    const cashFromInvesting = 0; // Placeholder
    
    // Cash from financing activities (loans, equity, etc.)
    // This would come from journal entries tagged as financing
    const cashFromFinancing = 0; // Placeholder
    
    const netCashFromOperations = cashFromCustomers - cashPaidToSuppliers;
    const netCashFlow = netCashFromOperations + cashFromInvesting + cashFromFinancing;
    const endingCash = openingCash + netCashFlow;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        openingCash,
        operatingActivities: {
          cashFromCustomers,
          cashPaidToSuppliers,
          netCashFromOperations
        },
        investingActivities: {
          cashFromInvesting
        },
        financingActivities: {
          cashFromFinancing
        },
        netCashFlow,
        endingCash
      }
    });
  } catch (error) {
    logger.error('Generate cash flow direct error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating cash flow report'
    });
  }
};

// @desc    Generate Cash Flow (Indirect Method)
// @route   GET /api/reports/cash-flow-indirect
// @access  Private
const generateCashFlowIndirect = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get net income from P&L
    const incomeAccounts = await ChartOfAccount.find({
      ...query,
      type: 'INCOME',
      isActive: true
    });
    
    const expenseAccounts = await ChartOfAccount.find({
      ...query,
      type: 'EXPENSE',
      isActive: true
    });
    
    let revenue = 0;
    for (const account of incomeAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        revenue += entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
      });
    }
    
    let expenses = 0;
    for (const account of expenseAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        expenses += entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
      });
    }
    
    const netIncome = revenue - expenses;
    
    // Adjustments for non-cash items (depreciation, etc.)
    // Get depreciation expenses
    const depreciationExpenses = await LedgerEntry.find({
      ...query,
      sourceDocument: { type: 'DEPRECIATION' },
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
    });
    
    const depreciation = depreciationExpenses.reduce((sum, entry) => {
      return sum + (entry.entryType === 'DEBIT' ? entry.amount : 0);
    }, 0);
    
    // Changes in working capital
    // Accounts Receivable change
    const arAccounts = await ChartOfAccount.find({
      ...query,
      type: 'ASSET',
      category: 'Accounts Receivable',
      isActive: true
    });
    
    let arChange = 0;
    for (const account of arAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        arChange += entry.entryType === 'DEBIT' ? entry.amount : -entry.amount;
      });
    }
    
    // Accounts Payable change
    const apAccounts = await ChartOfAccount.find({
      ...query,
      type: 'LIABILITY',
      category: 'Accounts Payable',
      isActive: true
    });
    
    let apChange = 0;
    for (const account of apAccounts) {
      const ledgerEntries = await LedgerEntry.find({
        ...query,
        accountId: account._id,
        ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter })
      });
      
      ledgerEntries.forEach(entry => {
        apChange += entry.entryType === 'CREDIT' ? entry.amount : -entry.amount;
      });
    }
    
    // Get cash accounts
    const cashAccounts = await ChartOfAccount.find({
      ...query,
      type: 'ASSET',
      category: { $in: ['Cash', 'Bank', 'Current Assets'] },
      isActive: true
    });
    
    let openingCash = 0;
    cashAccounts.forEach(account => {
      openingCash += account.openingBalance || 0;
    });
    
    // Calculate cash from operations (indirect method)
    const cashFromOperations = netIncome + depreciation - arChange + apChange;
    
    // Investing and financing activities (simplified)
    const cashFromInvesting = 0;
    const cashFromFinancing = 0;
    
    const netCashFlow = cashFromOperations + cashFromInvesting + cashFromFinancing;
    const endingCash = openingCash + netCashFlow;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        openingCash,
        operatingActivities: {
          netIncome,
          adjustments: {
            depreciation
          },
          changesInWorkingCapital: {
            accountsReceivable: -arChange,
            accountsPayable: apChange
          },
          netCashFromOperations: cashFromOperations
        },
        investingActivities: {
          cashFromInvesting
        },
        financingActivities: {
          cashFromFinancing
        },
        netCashFlow,
        endingCash
      }
    });
  } catch (error) {
    logger.error('Generate cash flow indirect error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating cash flow report'
    });
  }
};

// @desc    Generate Project Profitability Report
// @route   GET /api/reports/project-profitability
// @access  Private
const generateProjectProfitability = async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const query = req.tenantQuery();
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get invoices (revenue) - if project tracking exists
    const invoices = await Invoice.find({
      ...query,
      status: { $in: ['PAID', 'SENT'] },
      ...(Object.keys(dateFilter).length > 0 && { issueDate: dateFilter }),
      ...(projectId && { projectId })
    }).populate('customerId', 'name');
    
    // Get expenses (costs) - if project tracking exists
    const expenses = await Expense.find({
      ...query,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(projectId && { projectId })
    });
    
    // Group by project (or customer if no project tracking)
    const projectData = {};
    
    invoices.forEach(inv => {
      const projectKey = inv.projectId?.toString() || inv.customerId?._id?.toString() || 'unassigned';
      
      if (!projectData[projectKey]) {
        projectData[projectKey] = {
          projectId: projectKey,
          projectName: inv.projectId?.name || inv.customerId?.name || 'Unassigned',
          revenue: 0,
          costs: 0,
          invoiceCount: 0,
          expenseCount: 0
        };
      }
      
      projectData[projectKey].revenue += inv.total || 0;
      projectData[projectKey].invoiceCount += 1;
    });
    
    expenses.forEach(exp => {
      const projectKey = exp.projectId?.toString() || exp.customerId?.toString() || 'unassigned';
      
      if (!projectData[projectKey]) {
        projectData[projectKey] = {
          projectId: projectKey,
          projectName: 'Unassigned',
          revenue: 0,
          costs: 0,
          invoiceCount: 0,
          expenseCount: 0
        };
      }
      
      projectData[projectKey].costs += exp.amount || 0;
      projectData[projectKey].expenseCount += 1;
    });
    
    // Calculate profitability
    const projects = Object.values(projectData).map(project => ({
      ...project,
      profit: project.revenue - project.costs,
      profitMargin: project.revenue > 0 ? ((project.revenue - project.costs) / project.revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit);
    
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
    const totalCosts = projects.reduce((sum, p) => sum + p.costs, 0);
    const totalProfit = totalRevenue - totalCosts;
    
    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        projects,
        summary: {
          totalProjects: projects.length,
          totalRevenue,
          totalCosts,
          totalProfit,
          averageProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          mostProfitable: projects[0] || null
        }
      }
    });
  } catch (error) {
    logger.error('Generate project profitability error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating project profitability report'
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
  generateGeneralLedger,
  generateCustomerProfitability,
  generateBudgetVsActual,
  generateOwnersEquity,
  generateCashFlowDirect,
  generateCashFlowIndirect,
  generateProjectProfitability
};
