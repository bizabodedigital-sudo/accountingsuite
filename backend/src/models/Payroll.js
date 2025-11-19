const mongoose = require('mongoose');

/**
 * Payroll Schema
 * Tracks employee payroll runs, payslips, and deductions
 */
const payrollSchema = new mongoose.Schema({
  payrollNumber: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  payPeriodStart: {
    type: Date,
    required: [true, 'Pay period start date is required']
  },
  payPeriodEnd: {
    type: Date,
    required: [true, 'Pay period end date is required']
  },
  payDate: {
    type: Date,
    required: [true, 'Pay date is required'],
    default: Date.now
  },
  // Earnings
  baseSalary: {
    type: Number,
    required: true,
    min: [0, 'Base salary must be greater than or equal to 0']
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: [0, 'Overtime hours cannot be negative']
  },
  overtimeRate: {
    type: Number,
    default: 0,
    min: [0, 'Overtime rate must be greater than or equal to 0']
  },
  overtimeAmount: {
    type: Number,
    default: 0,
    min: [0, 'Overtime amount must be greater than or equal to 0']
  },
  bonuses: {
    type: Number,
    default: 0,
    min: [0, 'Bonuses must be greater than or equal to 0']
  },
  allowances: {
    type: Number,
    default: 0,
    min: [0, 'Allowances must be greater than or equal to 0']
  },
  grossPay: {
    type: Number,
    required: true,
    min: [0, 'Gross pay must be greater than or equal to 0']
  },
  // Deductions
  nis: {
    type: Number,
    default: 0,
    min: [0, 'NIS must be greater than or equal to 0']
  },
  nht: {
    type: Number,
    default: 0,
    min: [0, 'NHT must be greater than or equal to 0']
  },
  educationTax: {
    type: Number,
    default: 0,
    min: [0, 'Education tax must be greater than or equal to 0']
  },
  incomeTax: {
    type: Number,
    default: 0,
    min: [0, 'Income tax must be greater than or equal to 0']
  },
  pension: {
    type: Number,
    default: 0,
    min: [0, 'Pension must be greater than or equal to 0']
  },
  healthInsurance: {
    type: Number,
    default: 0,
    min: [0, 'Health insurance must be greater than or equal to 0']
  },
  otherDeductions: {
    type: Number,
    default: 0,
    min: [0, 'Other deductions must be greater than or equal to 0']
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: [0, 'Total deductions must be greater than or equal to 0']
  },
  netPay: {
    type: Number,
    required: true,
    min: [0, 'Net pay must be greater than or equal to 0']
  },
  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'],
    default: 'DRAFT'
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CHECK', 'CASH', 'OTHER'],
    default: 'BANK_TRANSFER'
  },
  // Accounting
  journalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  isPosted: {
    type: Boolean,
    default: false
  },
  postedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
payrollSchema.index({ tenantId: 1, payDate: -1 });
payrollSchema.index({ tenantId: 1, employeeId: 1 });
payrollSchema.index({ tenantId: 1, status: 1 });
// Note: payrollNumber index is automatically created by unique: true in schema

// Pre-save middleware
payrollSchema.pre('save', async function(next) {
  try {
    // Generate payroll number if not provided
    if (!this.payrollNumber) {
      const Tenant = require('./Tenant');
      const tenant = await Tenant.findById(this.tenantId);
      const prefix = tenant?.settings?.payrollPrefix || 'PR';
      
      const count = await mongoose.model('Payroll').countDocuments({ tenantId: this.tenantId });
      const nextNumber = count + 1;
      
      this.payrollNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
    }
    
    // Calculate totals
    this.grossPay = (this.baseSalary || 0) + (this.overtimeAmount || 0) + (this.bonuses || 0) + (this.allowances || 0);
    this.totalDeductions = (this.nis || 0) + (this.nht || 0) + (this.educationTax || 0) + 
                           (this.incomeTax || 0) + (this.pension || 0) + (this.healthInsurance || 0) + 
                           (this.otherDeductions || 0);
    this.netPay = this.grossPay - this.totalDeductions;
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Payroll', payrollSchema);

