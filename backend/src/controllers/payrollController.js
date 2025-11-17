const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const AccountingEngine = require('../services/accountingEngine');
const PayrollService = require('../services/payrollService');
const logger = require('../config/logger');
const eventEmitter = require('../services/eventEmitter');

/**
 * @desc    Get all payroll records
 * @route   GET /api/payroll
 * @access  Private
 */
const getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, status, startDate, endDate } = req.query;
    
    const query = req.tenantQuery({
      ...(employeeId && { employeeId }),
      ...(status && { status })
    });

    if (startDate || endDate) {
      query.payDate = {};
      if (startDate) query.payDate.$gte = new Date(startDate);
      if (endDate) query.payDate.$lte = new Date(endDate);
    }

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'employeeNumber firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ payDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get payrolls error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting payrolls'
    });
  }
};

/**
 * @desc    Get single payroll record
 * @route   GET /api/payroll/:id
 * @access  Private
 */
const getPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    })
      .populate('employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName')
      .populate('journalEntryId');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    logger.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error getting payroll'
    });
  }
};

/**
 * @desc    Create payroll record
 * @route   POST /api/payroll
 * @access  Private (OWNER, ACCOUNTANT)
 */
const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      payDate,
      baseSalary,
      overtimeHours,
      overtimeRate,
      bonuses,
      allowances,
      nis,
      nht,
      educationTax,
      incomeTax,
      pension,
      healthInsurance,
      otherDeductions,
      paymentMethod,
      notes
    } = req.body;

    if (!employeeId || !payPeriodStart || !payPeriodEnd || !payDate) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID, pay period dates, and pay date are required'
      });
    }

    // Verify employee exists
    const employee = await Employee.findOne({
      _id: employeeId,
      ...req.tenantQuery()
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Calculate overtime amount
    const overtimeAmount = (overtimeHours || 0) * (overtimeRate || employee.overtimeRate || 0);

    // Calculate gross pay
    const grossPay = (baseSalary || employee.baseSalary || 0) + overtimeAmount + (bonuses || 0) + (allowances || 0);

    // Calculate total deductions
    const totalDeductions = (nis || 0) + (nht || 0) + (educationTax || 0) + 
                           (incomeTax || 0) + (pension || 0) + (healthInsurance || 0) + 
                           (otherDeductions || 0);

    // Calculate net pay
    const netPay = grossPay - totalDeductions;

    const payroll = await Payroll.create({
      employeeId,
      payPeriodStart: new Date(payPeriodStart),
      payPeriodEnd: new Date(payPeriodEnd),
      payDate: new Date(payDate),
      baseSalary: baseSalary || employee.baseSalary || 0,
      overtimeHours: overtimeHours || 0,
      overtimeRate: overtimeRate || employee.overtimeRate || 0,
      overtimeAmount,
      bonuses: bonuses || 0,
      allowances: allowances || 0,
      grossPay,
      nis: nis || 0,
      nht: nht || 0,
      educationTax: educationTax || 0,
      incomeTax: incomeTax || 0,
      pension: pension || 0,
      healthInsurance: healthInsurance || 0,
      otherDeductions: otherDeductions || 0,
      totalDeductions,
      netPay,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      notes,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate('employeeId', 'employeeNumber firstName lastName')
      .populate('createdBy', 'firstName lastName');

    eventEmitter.emitEvent('payroll.created', populatedPayroll.toObject(), req.user.tenantId);

    res.status(201).json({
      success: true,
      data: populatedPayroll
    });
  } catch (error) {
    logger.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating payroll'
    });
  }
};

/**
 * @desc    Approve payroll
 * @route   POST /api/payroll/:id/approve
 * @access  Private (OWNER, ACCOUNTANT)
 */
const approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('employeeId');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Only draft payroll records can be approved'
      });
    }

    payroll.status = 'APPROVED';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll approved successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Approve payroll error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error approving payroll'
    });
  }
};

/**
 * @desc    Post payroll to ledger
 * @route   POST /api/payroll/:id/post
 * @access  Private (OWNER, ACCOUNTANT)
 */
const postPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    }).populate('employeeId');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll record not found'
      });
    }

    if (payroll.isPosted) {
      return res.status(400).json({
        success: false,
        error: 'Payroll has already been posted'
      });
    }

    // Create journal entry for payroll
    const entries = [];

    // Debit: Salary Expense
    const salaryExpenseAccount = await AccountingEngine.getAccountByCode('6010', req.user.tenantId); // Salary Expense
    const salaryAccount = await require('../models/ChartOfAccount').findById(salaryExpenseAccount);
    entries.push({
      accountId: salaryExpenseAccount,
      accountCode: salaryAccount.code,
      accountName: salaryAccount.name,
      debit: payroll.grossPay,
      credit: 0,
      description: `Payroll - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
    });

    // Credit: Cash/Bank (net pay)
    const cashAccount = await AccountingEngine.getAccountByCode('1010', req.user.tenantId); // Cash
    const cashAccountDoc = await require('../models/ChartOfAccount').findById(cashAccount);
    entries.push({
      accountId: cashAccount,
      accountCode: cashAccountDoc.code,
      accountName: cashAccountDoc.name,
      debit: 0,
      credit: payroll.netPay,
      description: `Payroll payment - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
    });

    // Credit: NIS Payable
    if (payroll.nis > 0) {
      const nisAccount = await AccountingEngine.getAccountByCode('2020', req.user.tenantId); // NIS Payable
      const nisAccountDoc = await require('../models/ChartOfAccount').findById(nisAccount);
      entries.push({
        accountId: nisAccount,
        accountCode: nisAccountDoc.code,
        accountName: nisAccountDoc.name,
        debit: 0,
        credit: payroll.nis,
        description: `NIS deduction - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
      });
    }

    // Credit: NHT Payable
    if (payroll.nht > 0) {
      const nhtAccount = await AccountingEngine.getAccountByCode('2021', req.user.tenantId); // NHT Payable
      const nhtAccountDoc = await require('../models/ChartOfAccount').findById(nhtAccount);
      entries.push({
        accountId: nhtAccount,
        accountCode: nhtAccountDoc.code,
        accountName: nhtAccountDoc.name,
        debit: 0,
        credit: payroll.nht,
        description: `NHT deduction - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
      });
    }

    // Credit: Income Tax Payable
    if (payroll.incomeTax > 0) {
      const taxAccount = await AccountingEngine.getAccountByCode('2022', req.user.tenantId); // Income Tax Payable
      const taxAccountDoc = await require('../models/ChartOfAccount').findById(taxAccount);
      entries.push({
        accountId: taxAccount,
        accountCode: taxAccountDoc.code,
        accountName: taxAccountDoc.name,
        debit: 0,
        credit: payroll.incomeTax,
        description: `Income tax deduction - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
      });
    }

    // Credit: Education Tax Payable
    if (payroll.educationTax > 0) {
      const edTaxAccount = await AccountingEngine.getAccountByCode('2023', req.user.tenantId); // Education Tax Payable
      const edTaxAccountDoc = await require('../models/ChartOfAccount').findById(edTaxAccount);
      entries.push({
        accountId: edTaxAccount,
        accountCode: edTaxAccountDoc.code,
        accountName: edTaxAccountDoc.name,
        debit: 0,
        credit: payroll.educationTax,
        description: `Education tax deduction - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
      });
    }

    // Credit: Other deductions (pension, health insurance, etc.)
    const otherDeductions = payroll.pension + payroll.healthInsurance + payroll.otherDeductions;
    if (otherDeductions > 0) {
      const deductionsAccount = await AccountingEngine.getAccountByCode('2024', req.user.tenantId); // Other Deductions Payable
      const deductionsAccountDoc = await require('../models/ChartOfAccount').findById(deductionsAccount);
      entries.push({
        accountId: deductionsAccount,
        accountCode: deductionsAccountDoc.code,
        accountName: deductionsAccountDoc.name,
        debit: 0,
        credit: otherDeductions,
        description: `Other deductions - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
      });
    }

    const result = await AccountingEngine.createJournalEntry({
      entryDate: payroll.payDate,
      description: `Payroll - ${payroll.employeeId.firstName} ${payroll.employeeId.lastName} - ${payroll.payrollNumber}`,
      entries,
      entryType: 'PAYROLL',
      sourceDocument: {
        type: 'PAYROLL',
        id: payroll._id,
        number: payroll.payrollNumber
      },
      tenantId: req.user.tenantId,
      userId: req.user._id
    });

    payroll.journalEntryId = result.journalEntry._id;
    payroll.isPosted = true;
    payroll.postedAt = new Date();
    await payroll.save();

    logger.info(`Posted payroll ${payroll.payrollNumber} to ledger`);

    res.status(200).json({
      success: true,
      message: 'Payroll posted to ledger successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Post payroll error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error posting payroll'
    });
  }
};

/**
 * @desc    Mark payroll as paid
 * @route   POST /api/payroll/:id/pay
 * @access  Private (OWNER, ACCOUNTANT)
 */
const markPayrollPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      ...req.tenantQuery()
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        error: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Only approved payroll records can be marked as paid'
      });
    }

    payroll.status = 'PAID';
    payroll.paidBy = req.user._id;
    payroll.paidAt = new Date();
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll marked as paid',
      data: payroll
    });
  } catch (error) {
    logger.error('Mark payroll paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error marking payroll as paid'
    });
  }
};

module.exports = {
  getPayrolls,
  getPayroll,
  createPayroll,
  approvePayroll,
  postPayroll,
  markPayrollPaid
};

