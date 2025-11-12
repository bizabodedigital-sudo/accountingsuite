const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, tenantFilter } = require('../middleware/auth');
const {
  uploadBankStatement,
  getBankTransactions,
  getReconciliationSummary,
  matchTransaction,
  unmatchTransaction
} = require('../controllers/reconciliationController');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/plain',
      'application/x-ofx',
      'application/vnd.intu.qfx',
      'application/octet-stream'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.pdf', '.txt', '.ofx', '.qfx'];
    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Apply authentication and tenant filtering to all routes
router.use(protect);
router.use(tenantFilter());

// Upload and parse bank statement
router.post('/upload', upload.single('file'), uploadBankStatement);

// Get bank transactions
router.get('/transactions', getBankTransactions);

// Get reconciliation summary
router.get('/summary', getReconciliationSummary);

// Match transaction
router.post('/transactions/:id/match', matchTransaction);

// Unmatch transaction
router.post('/transactions/:id/unmatch', unmatchTransaction);

module.exports = router;

