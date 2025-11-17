const mongoose = require('mongoose');

/**
 * Employee Schema
 * Tracks employee information for payroll
 */
const employeeSchema = new mongoose.Schema({
  employeeNumber: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    parish: String,
    country: {
      type: String,
      default: 'Jamaica'
    },
    postalCode: String
  },
  dateOfBirth: {
    type: Date
  },
  dateOfHire: {
    type: Date,
    required: [true, 'Date of hire is required']
  },
  dateOfTermination: {
    type: Date
  },
  // Employment details
  employmentType: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY'],
    default: 'FULL_TIME'
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  // Payroll details
  baseSalary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary must be greater than or equal to 0']
  },
  salaryFrequency: {
    type: String,
    enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
    default: 'MONTHLY'
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate must be greater than or equal to 0']
  },
  overtimeRate: {
    type: Number,
    default: 0,
    min: [0, 'Overtime rate must be greater than or equal to 0']
  },
  // Tax information
  trn: {
    type: String,
    trim: true,
    uppercase: true
  },
  nisNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  // Banking
  bankName: {
    type: String,
    trim: true
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  bankAccountType: {
    type: String,
    enum: ['CHECKING', 'SAVINGS'],
    default: 'CHECKING'
  },
  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'],
    default: 'ACTIVE'
  },
  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
employeeSchema.index({ tenantId: 1, status: 1 });
employeeSchema.index({ tenantId: 1, employeeNumber: 1 });
employeeSchema.index({ email: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
employeeSchema.pre('save', async function(next) {
  try {
    // Generate employee number if not provided
    if (!this.employeeNumber) {
      const Tenant = require('./Tenant');
      const tenant = await Tenant.findById(this.tenantId);
      const prefix = tenant?.settings?.employeePrefix || 'EMP';
      
      const count = await mongoose.model('Employee').countDocuments({ tenantId: this.tenantId });
      const nextNumber = count + 1;
      
      this.employeeNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
    }
    
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Employee', employeeSchema);

