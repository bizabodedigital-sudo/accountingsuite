const BankTransaction = require('../models/BankTransaction');
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');
const { Readable } = require('stream');

// Lazy load csv-parser to avoid startup errors if not installed
let csv;
try {
  csv = require('csv-parser');
} catch (error) {
  logger.warn('csv-parser not found. CSV parsing will not be available.');
  csv = null;
}

// Lazy load pdf-parse to avoid startup errors if not installed
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  logger.warn('pdf-parse not found. PDF parsing will not be available.');
  pdfParse = null;
}

// Parse CSV bank statement
const parseCSVStatement = async (fileBuffer, tenantId, userId, fileKey, originalName) => {
  return new Promise((resolve, reject) => {
    const transactions = [];
    const stream = Readable.from(fileBuffer);
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Try to parse common CSV formats
        // Format 1: Date, Description, Amount, Type
        // Format 2: Date, Description, Debit, Credit
        // Format 3: Date, Description, Amount (negative for debits)
        
        let date, description, amount, type;
        
        // Try different column name variations
        const dateCol = row.Date || row.date || row.DATE || row['Transaction Date'] || row['TransactionDate'];
        const descCol = row.Description || row.description || row.DESCRIPTION || row['Transaction Description'] || row['TransactionDescription'] || row.Details || row.details;
        const amountCol = row.Amount || row.amount || row.AMOUNT || row['Transaction Amount'] || row['TransactionAmount'];
        const debitCol = row.Debit || row.debit || row.DEBIT;
        const creditCol = row.Credit || row.credit || row.CREDIT;
        const typeCol = row.Type || row.type || row.TYPE;
        
        if (!dateCol || !descCol) {
          return; // Skip invalid rows
        }
        
        // Parse date
        try {
          date = new Date(dateCol);
          if (isNaN(date.getTime())) {
            return; // Skip invalid dates
          }
        } catch (e) {
          return; // Skip invalid dates
        }
        
        description = descCol.trim();
        
        // Determine amount and type
        if (debitCol && creditCol) {
          // Format with separate debit/credit columns
          const debit = parseFloat(debitCol) || 0;
          const credit = parseFloat(creditCol) || 0;
          if (debit > 0) {
            amount = debit;
            type = 'debit';
          } else if (credit > 0) {
            amount = credit;
            type = 'credit';
          } else {
            return; // Skip rows with no amount
          }
        } else if (amountCol) {
          // Format with single amount column
          amount = parseFloat(amountCol);
          if (isNaN(amount)) {
            return; // Skip invalid amounts
          }
          
          if (typeCol) {
            type = typeCol.toLowerCase().includes('debit') || typeCol.toLowerCase().includes('withdrawal') ? 'debit' : 'credit';
          } else {
            // Negative amounts are debits, positive are credits
            type = amount < 0 ? 'debit' : 'credit';
            amount = Math.abs(amount);
          }
        } else {
          return; // Skip rows without amount
        }
        
        if (amount <= 0) {
          return; // Skip zero or negative amounts
        }
        
        transactions.push({
          date,
          description,
          amount,
          type,
          bankReference: row.Reference || row.reference || row.REFERENCE || row['Reference Number'] || '',
          status: 'pending',
          statementFile: {
            key: fileKey,
            originalName: originalName
          },
          tenantId,
          createdBy: userId
        });
      })
      .on('end', () => {
        resolve(transactions);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Parse PDF bank statement
const parsePDFStatement = async (fileBuffer, tenantId, userId, fileKey, originalName) => {
  try {
    // Extract text from PDF
    const data = await pdfParse(fileBuffer);
    const text = data.text;
    
    logger.info(`Extracted ${text.length} characters from PDF`);
    
    // Improved PDF parsing for bank statements
    const transactions = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Enhanced date patterns: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}[-\s]\w{3}[-\s]\d{2,4})/i;
    // Enhanced amount patterns: currency symbols, commas, decimals, parentheses for negatives
    const amountPattern = /([\$\€\£JMD]?\s*\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?)/g;
    
    let currentDate = null;
    let inTransactionSection = false;
    let foundHeader = false;
    
    // Look for transaction table headers
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') && (line.includes('description') || line.includes('details') || line.includes('particulars'))) {
        foundHeader = true;
        inTransactionSection = true;
        break;
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Skip header/footer lines and summary sections
      if ((lowerLine.match(/statement|balance|account|opening|closing|summary|total|page|\d+\s+of\s+\d+/i) && 
          line.length < 60) || 
          lowerLine.match(/^balance\s+brought\s+forward/i) ||
          lowerLine.match(/^balance\s+carried\s+forward/i)) {
        continue;
      }
      
      // Detect start of transaction section
      if (!inTransactionSection && foundHeader && i > 0) {
        const prevLine = lines[i - 1].toLowerCase();
        if (prevLine.includes('date') || prevLine.includes('transaction')) {
          inTransactionSection = true;
        }
      }
      
      // Try to extract date
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        try {
          const dateStr = dateMatch[0];
          let date;
          
          // Handle different date formats
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[0].length === 4) {
              // YYYY/MM/DD
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              // MM/DD/YYYY or DD/MM/YYYY
              // Try MM/DD/YYYY first (US format)
              date = new Date(parts[2], parts[0] - 1, parts[1]);
              // If invalid, try DD/MM/YYYY
              if (isNaN(date.getTime()) && parts[0] <= 12) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
          } else if (dateStr.includes('-')) {
            // Try ISO format first
            date = new Date(dateStr);
            // If invalid, try DD-MM-YYYY
            if (isNaN(date.getTime())) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
          } else if (dateStr.match(/\d{1,2}\s+\w{3}\s+\d{2,4}/i)) {
            // DD-MMM-YYYY format
            date = new Date(dateStr);
          }
          
          if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
            currentDate = date;
          }
        } catch (e) {
          // Invalid date, continue
        }
      }
      
      // Try to extract amounts - look for patterns like "1,234.56" or "(1,234.56)" for debits
      const amounts = [];
      let match;
      const amountRegex = /([\$\€\£JMD]?\s*\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?)/g;
      while ((match = amountRegex.exec(line)) !== null) {
        let amountStr = match[1].replace(/[\$\€\£JMD,\s]/g, '');
        const isNegative = match[1].includes('(') && match[1].includes(')');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0 && amount < 100000000) { // Reasonable limit
          amounts.push({ amount, isNegative });
        }
      }
      
      // If we have a date and amounts, try to create a transaction
      if (currentDate && amounts.length > 0 && inTransactionSection) {
        // Get description (everything between date and amount)
        let description = line;
        if (dateMatch) {
          description = line.substring(dateMatch.index + dateMatch[0].length).trim();
        }
        
        // Find the position of the transaction amount (usually the last or largest amount on the line)
        let amountEndIndex = description.length;
        const sortedAmounts = [...amounts].sort((a, b) => b.amount - a.amount); // Sort by amount descending
        const mainAmount = sortedAmounts[0];
        
        // Try to find where the main amount appears in the description
        const amountPatterns = [
          mainAmount.amount.toFixed(2),
          mainAmount.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          mainAmount.amount.toString(),
        ];
        
        for (const pattern of amountPatterns) {
          const index = description.lastIndexOf(pattern);
          if (index > 0) {
            amountEndIndex = index;
            break;
          }
        }
        
        // Extract description before the amount
        description = description.substring(0, amountEndIndex).trim();
        
        // Remove currency symbols but keep the text
        description = description
          .replace(/[\$\€\£JMD]/g, '') // Remove currency symbols
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // If description is too short or looks like just numbers, try to get more context
        // Check if description is mostly numbers/spaces (not meaningful text)
        const isMostlyNumbers = /^[\d\s\.\-]+$/.test(description);
        
        if ((description.length < 10 || isMostlyNumbers) && i < lines.length - 1) {
          // Look ahead for continuation lines
          let continuation = '';
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j].trim();
            // Stop if we hit another date or transaction
            if (nextLine.match(datePattern) || (nextLine.match(amountRegex) && nextLine.length < 30)) {
              break;
            }
            // Add continuation if it looks like description text (not just numbers)
            if (nextLine.length > 3 && !/^[\d\s\.\-]+$/.test(nextLine)) {
              continuation += ' ' + nextLine;
            }
          }
          description = (description + continuation).trim();
        }
        
        // Clean up: remove trailing numbers that might be leftover amounts
        description = description.replace(/\s+\d+\.?\d*\s*$/, '').trim();
        
        // Final cleanup: remove parenthetical amounts if they're clearly amounts
        description = description.replace(/\(\s*\d+[,\d]*\.?\d*\s*\)/g, '').trim();
        
        // Determine transaction type and amount
        // If multiple amounts, use the one that makes sense based on context
        let amount = amounts[0].amount;
        let isDebit = amounts[0].isNegative;
        
        // Check for explicit debit/credit indicators
        if (lowerLine.includes('debit') || lowerLine.includes('dr') || lowerLine.includes('withdrawal') || 
            lowerLine.includes('payment') || lowerLine.includes('charge') || lowerLine.includes('fee')) {
          isDebit = true;
        } else if (lowerLine.includes('credit') || lowerLine.includes('cr') || lowerLine.includes('deposit') || 
                   lowerLine.includes('transfer in') || lowerLine.includes('interest')) {
          isDebit = false;
        }
        
        // If we have multiple amounts, the larger one is usually the transaction amount
        if (amounts.length > 1) {
          amount = Math.max(...amounts.map(a => a.amount));
        }
        
        // Extract reference number if present
        const refMatch = line.match(/(?:ref|reference|chq|cheque|check)\s*:?\s*([A-Z0-9\-]+)/i);
        const bankReference = refMatch ? refMatch[1] : '';
        
        if (description.length > 3 && amount > 0 && amount < 100000000) {
          transactions.push({
            date: currentDate,
            description: description.substring(0, 500), // Increased limit to 500 characters for better description capture
            amount: amount,
            type: isDebit ? 'debit' : 'credit',
            bankReference: bankReference,
            status: 'pending',
            statementFile: {
              key: fileKey,
              originalName: originalName
            },
            tenantId,
            createdBy: userId
          });
        }
      }
    }
    
    // Remove duplicates based on date, amount, and description
    const uniqueTransactions = [];
    const seen = new Set();
    for (const txn of transactions) {
      const key = `${txn.date.toISOString().split('T')[0]}_${txn.amount}_${txn.description.substring(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransactions.push(txn);
      }
    }
    
    logger.info(`Parsed ${uniqueTransactions.length} unique transactions from PDF (${transactions.length} total before deduplication)`);
    return uniqueTransactions;
    
  } catch (error) {
    logger.error(`PDF parsing error: ${error.message}`);
    throw error;
  }
};

// Upload and parse bank statement
const uploadBankStatement = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { type = 'bank-statement' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Upload file to S3 first
    const fileKey = s3Service.generateFileKey(tenantId, type, req.file.originalname);
    const uploadResult = await s3Service.uploadFile(req.file, fileKey, {
      originalName: req.file.originalname,
      uploadedBy: userId.toString(),
      tenantId: tenantId.toString()
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error
      });
    }

    // Parse the file based on type
    let transactions = [];
    
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      if (!csv) {
        return res.status(500).json({
          success: false,
          error: 'CSV parsing is not available. Please install csv-parser package.'
        });
      }
      try {
        transactions = await parseCSVStatement(
          req.file.buffer,
          tenantId,
          userId,
          fileKey,
          req.file.originalname
        );
      } catch (parseError) {
        logger.error(`CSV parsing error: ${parseError.message}`);
        return res.status(400).json({
          success: false,
          error: `Failed to parse CSV file: ${parseError.message}`
        });
      }
    } else if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      if (!pdfParse) {
        return res.status(500).json({
          success: false,
          error: 'PDF parsing is not available. Please install pdf-parse package.'
        });
      }
      try {
        transactions = await parsePDFStatement(
          req.file.buffer,
          tenantId,
          userId,
          fileKey,
          req.file.originalname
        );
      } catch (parseError) {
        logger.error(`PDF parsing error: ${parseError.message}`);
        return res.status(400).json({
          success: false,
          error: `Failed to parse PDF file: ${parseError.message}`
        });
      }
    } else {
      // For other formats (OFX, QFX, etc.), we'll just store the file
      // and return success - parsing can be added later
      return res.json({
        success: true,
        file: {
          key: uploadResult.key,
          location: uploadResult.location,
          originalName: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        },
        message: 'File uploaded successfully. Parsing for this format will be implemented soon.',
        transactionsCount: 0
      });
    }

    // Save transactions to database
    if (transactions.length > 0) {
      const savedTransactions = await BankTransaction.insertMany(transactions);
      logger.info(`Saved ${savedTransactions.length} transactions from bank statement`);
    }

    res.json({
      success: true,
      file: {
        key: uploadResult.key,
        location: uploadResult.location,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      transactionsCount: transactions.length,
      message: `Successfully parsed and imported ${transactions.length} transactions`
    });

  } catch (error) {
    logger.error(`Bank statement upload error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to process bank statement'
    });
  }
};

// Get bank transactions
const getBankTransactions = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;
    
    const query = { tenantId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      BankTransaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('matchedInvoiceId', 'invoiceNumber total')
        .populate('matchedExpenseId', 'description amount'),
      BankTransaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Get bank transactions error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bank transactions'
    });
  }
};

// Get reconciliation summary
const getReconciliationSummary = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;
    
    const query = { tenantId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await BankTransaction.find(query).sort({ date: 1 });
    
    // Calculate bank balance: sum of all transactions
    // Credits increase balance, debits decrease balance
    const bankBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'credit' ? t.amount : -t.amount);
    }, 0);
    
    const matchedCount = transactions.filter(t => t.status === 'matched').length;
    const unmatchedCount = transactions.filter(t => t.status === 'unmatched').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    
    res.json({
      success: true,
      summary: {
        bankBalance: Math.round(bankBalance * 100) / 100, // Round to 2 decimal places
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
        pendingTransactions: pendingCount,
        totalTransactions: transactions.length
      }
    });
  } catch (error) {
    logger.error(`Get reconciliation summary error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation summary'
    });
  }
};

// Match transaction
const matchTransaction = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { invoiceId, expenseId } = req.body;
    
    const transaction = await BankTransaction.findOne({ _id: id, tenantId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    transaction.status = 'matched';
    if (invoiceId) transaction.matchedInvoiceId = invoiceId;
    if (expenseId) transaction.matchedExpenseId = expenseId;
    
    await transaction.save();
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error(`Match transaction error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to match transaction'
    });
  }
};

// Unmatch transaction
const unmatchTransaction = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    const transaction = await BankTransaction.findOne({ _id: id, tenantId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    transaction.status = 'unmatched';
    transaction.matchedInvoiceId = undefined;
    transaction.matchedExpenseId = undefined;
    
    await transaction.save();
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error(`Unmatch transaction error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to unmatch transaction'
    });
  }
};

module.exports = {
  uploadBankStatement,
  getBankTransactions,
  getReconciliationSummary,
  matchTransaction,
  unmatchTransaction
};

