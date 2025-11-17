const express = require('express');
const router = express.Router();
const {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  reverseJournalEntry,
  getTrialBalance
} = require('../controllers/journalEntryController');
const { protect, authorize } = require('../middleware/auth');
const { tenantFilter } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(tenantFilter());

// Routes
router.route('/')
  .get(getJournalEntries)
  .post(authorize('OWNER', 'ACCOUNTANT'), createJournalEntry);

router.route('/trial-balance')
  .get(getTrialBalance);

router.route('/:id')
  .get(getJournalEntry);

router.route('/:id/reverse')
  .post(authorize('OWNER', 'ACCOUNTANT'), reverseJournalEntry);

module.exports = router;

