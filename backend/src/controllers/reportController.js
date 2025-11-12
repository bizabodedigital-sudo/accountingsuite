const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const logger = require('../config/logger');

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
      status: 'PAID',
      ...(startDate && endDate && {
        issueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    };
    
    const invoices = await Invoice.find(invoiceQuery);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Get expenses
    const expenseQuery = {
      ...query,
      ...(startDate && endDate && {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    };
    
    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        },
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
          margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
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

// @desc    Generate Income by Customer Summary
// @route   GET /api/reports/income-by-customer
// @access  Private
const generateIncomeByCustomer = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      status: 'PAID',
      ...(startDate && endDate && {
        issueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });
    
    const invoices = await Invoice.find(query)
      .populate('customerId', 'name email');
    
    // Group by customer
    const customerIncome = invoices.reduce((acc, inv) => {
      const customerId = typeof inv.customerId === 'object' 
        ? inv.customerId._id.toString() 
        : inv.customerId?.toString() || 'unknown';
      
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: typeof inv.customerId === 'object' 
            ? inv.customerId.name 
            : 'Unknown Customer',
          email: typeof inv.customerId === 'object' 
            ? inv.customerId.email 
            : '',
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
    
    const customerList = Object.values(customerIncome)
      .sort((a, b) => b.total - a.total);
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        },
        customers: customerList,
        summary: {
          totalCustomers: customerList.length,
          totalRevenue: customerList.reduce((sum, c) => sum + c.total, 0),
          averagePerCustomer: customerList.length > 0 
            ? customerList.reduce((sum, c) => sum + c.total, 0) / customerList.length 
            : 0
        }
      }
    });
  } catch (error) {
    logger.error('Generate income by customer report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error generating income by customer report'
    });
  }
};

// @desc    Generate Expenses by Category Summary
// @route   GET /api/reports/expenses-by-category
// @access  Private
const generateExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(startDate && endDate && {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
    });
    
    const expenses = await Expense.find(query);
    
    // Group by category
    const categoryExpenses = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          total: 0,
          expenses: []
        };
      }
      
      acc[category].count += 1;
      acc[category].total += exp.amount || 0;
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
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        },
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

module.exports = {
  generateProfitLoss,
  generateIncomeByCustomer,
  generateExpensesByCategory
};

