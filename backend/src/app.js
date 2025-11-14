// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const expenseRoutes = require('./routes/expenses');
const productRoutes = require('./routes/productRoutes');
const fileRoutes = require('./routes/files');
const recurringInvoiceRoutes = require('./routes/recurringInvoices');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');
const backupRoutes = require('./routes/backup');
const documentRoutes = require('./routes/documents');
const currencyRoutes = require('./routes/currencies');
const inventoryRoutes = require('./routes/inventory');
const taxRoutes = require('./routes/tax');
const webhookRoutes = require('./routes/webhooks');
const integrationRoutes = require('./routes/integrations');
const apiKeyRoutes = require('./routes/apiKeys');

const app = express();

// ------------------------------
// ✅ Security Middleware
// ------------------------------
app.use(helmet());

// ------------------------------
// ✅ Fixed CORS Configuration
// ------------------------------
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Enable CORS and explicitly handle preflight requests
app.use(cors(corsOptions));

// ------------------------------
// ✅ Rate Limiting
// ------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ------------------------------
// ✅ Body Parsing
// ------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ------------------------------
// ✅ Health Check
// ------------------------------
app.get('/healthz', (req, res) => {
  const mongoose = require('mongoose');
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    mongo: mongoStatus,
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------
// ✅ Routes
// ------------------------------
// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const reconciliationRoutes = require('./routes/reconciliation');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/recurring-invoices', recurringInvoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/api-keys', apiKeyRoutes);

// Debug log for visibility
console.log('Registered routes:');
['auth', 'customers', 'invoices', 'expenses', 'products', 'files', 'recurring-invoices', 'settings', 'reports', 'reconciliation', 'backup', 'documents', 'currencies', 'inventory', 'tax', 'webhooks', 'integrations', 'api-keys'].forEach(route =>
  console.log(`- /api/${route}`)
);

// ------------------------------
// ✅ Error Handling
// ------------------------------
app.use(errorHandler);

// ------------------------------
// ✅ Connect Database and Start Server
// ------------------------------
connectDB();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
