const express = require('express');
const {
  registerClient,
  loginClient,
  getMe
} = require('../controllers/clientAuthController');
const { protect } = require('../middleware/clientAuth');

const router = express.Router();

router.post('/register', registerClient);
router.post('/login', loginClient);
router.get('/me', protect, getMe);

module.exports = router;

