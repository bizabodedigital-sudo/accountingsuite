const mongoose = require('mongoose');

/**
 * Currency Schema
 * Manages currency exchange rates and settings
 */
const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Currency code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    length: [3, 'Currency code must be 3 characters'],
    enum: [
      'JMD', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 
      'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'NZD', 'KRW', 'TRY'
    ]
  },
  name: {
    type: String,
    required: [true, 'Currency name is required'],
    trim: true
  },
  symbol: {
    type: String,
    required: [true, 'Currency symbol is required'],
    trim: true
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: [0, 'Exchange rate must be positive'],
    default: 1 // Base currency (JMD) has rate of 1
  },
  baseCurrency: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  decimalPlaces: {
    type: Number,
    default: 2,
    min: 0,
    max: 8
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
currencySchema.index({ code: 1 });
currencySchema.index({ isActive: 1 });
currencySchema.index({ baseCurrency: 1 });

// Static method to get base currency
currencySchema.statics.getBaseCurrency = async function() {
  return await this.findOne({ baseCurrency: true, isActive: true });
};

// Static method to convert amount between currencies
currencySchema.statics.convert = async function(amount, fromCode, toCode) {
  if (fromCode === toCode) {
    return amount;
  }

  const fromCurrency = await this.findOne({ code: fromCode.toUpperCase(), isActive: true });
  const toCurrency = await this.findOne({ code: toCode.toUpperCase(), isActive: true });

  if (!fromCurrency || !toCurrency) {
    throw new Error('Invalid currency code');
  }

  // Convert to base currency first, then to target currency
  const baseAmount = amount / fromCurrency.exchangeRate;
  const convertedAmount = baseAmount * toCurrency.exchangeRate;

  return parseFloat(convertedAmount.toFixed(toCurrency.decimalPlaces));
};

// Static method to format currency amount
currencySchema.statics.format = function(amount, code) {
  const currency = this.findOne({ code: code.toUpperCase() });
  if (!currency) {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: code
    }).format(amount);
  }

  return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`;
};

// Static method to update exchange rates
currencySchema.statics.updateExchangeRates = async function(rates, updatedBy = 'system') {
  const updates = [];
  
  for (const [code, rate] of Object.entries(rates)) {
    updates.push({
      updateOne: {
        filter: { code: code.toUpperCase() },
        update: {
          $set: {
            exchangeRate: rate,
            lastUpdated: new Date(),
            updatedBy
          }
        },
        upsert: true
      }
    });
  }

  if (updates.length > 0) {
    await this.bulkWrite(updates);
  }

  return { success: true, updated: updates.length };
};

// Instance method to convert to base currency
currencySchema.methods.toBase = function(amount) {
  return amount / this.exchangeRate;
};

// Instance method to convert from base currency
currencySchema.methods.fromBase = function(amount) {
  return amount * this.exchangeRate;
};

module.exports = mongoose.model('Currency', currencySchema);

