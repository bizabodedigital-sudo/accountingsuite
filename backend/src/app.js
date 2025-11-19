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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean); // Remove undefined values
    
    // In production, only allow configured origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        return callback(new Error('FRONTEND_URL must be set in production'));
      }
      // Check if origin matches any allowed origin
      const isAllowed = allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          const originUrl = new URL(origin);
          return allowedUrl.origin === originUrl.origin;
        } catch {
          return origin.startsWith(allowed);
        }
      });
      return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow localhost and configured origins
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // In development, also check configured origins
    if (allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
      if (isAllowed) return callback(null, true);
    }
    
    // Default: reject in production, allow in development
    return process.env.NODE_ENV === 'production' 
      ? callback(new Error('Not allowed by CORS'))
      : callback(null, true);
  },
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
  const isHealthy = mongoStatus === 'connected';
  
  // Return 503 (Service Unavailable) if MongoDB is disconnected
  // This makes Docker healthcheck fail when database is not connected
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Server is healthy' : 'Server is unhealthy - MongoDB disconnected',
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
const chartOfAccountRoutes = require('./routes/chartOfAccounts');
const journalEntryRoutes = require('./routes/journalEntries');
const openingBalanceRoutes = require('./routes/openingBalances');
const financialPeriodRoutes = require('./routes/financialPeriods');
const quoteRoutes = require('./routes/quotes');
const paymentRoutes = require('./routes/payments');
const auditLogRoutes = require('./routes/auditLogs');
const paymentGatewayRoutes = require('./routes/paymentGateways');
const paymentReminderRoutes = require('./routes/paymentReminders');
const payrollRoutes = require('./routes/payroll');
const employeeRoutes = require('./routes/employees');
const bankRuleRoutes = require('./routes/bankRules');
const fixedAssetRoutes = require('./routes/fixedAssets');
const clientAuthRoutes = require('./routes/clientAuth');
const clientPortalRoutes = require('./routes/clientPortal');
const workflowRoutes = require('./routes/workflows');
const healthRoutes = require('./routes/health');
const dashboardRoutes = require('./routes/dashboard');

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
app.use('/api/chart-of-accounts', chartOfAccountRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/opening-balances', openingBalanceRoutes);
app.use('/api/financial-periods', financialPeriodRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/payment-gateways', paymentGatewayRoutes);
app.use('/api/payment-reminders', paymentReminderRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/bank-rules', bankRuleRoutes);
app.use('/api/fixed-assets', fixedAssetRoutes);
app.use('/api/client-auth', clientAuthRoutes);
app.use('/api/client-portal', clientPortalRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API Documentation
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./config/swagger');
    
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Bizabode API Documentation'
    }));
  } catch (error) {
    logger.warn('Swagger UI not available, skipping API documentation');
  }
  
  logger.info('API Documentation available at /api/docs');
}

// Debug log for visibility
console.log('Registered routes:');
['auth', 'customers', 'invoices', 'expenses', 'products', 'files', 'recurring-invoices', 'settings', 'reports', 'reconciliation', 'backup', 'documents', 'currencies', 'inventory', 'tax', 'webhooks', 'integrations', 'api-keys', 'chart-of-accounts', 'journal-entries', 'opening-balances', 'financial-periods', 'quotes', 'payments', 'audit-logs', 'payment-gateways', 'payment-reminders', 'payroll', 'employees', 'bank-rules'].forEach(route =>
  console.log(`- /api/${route}`)
);

// ------------------------------
// ✅ Error Handling
// ------------------------------
app.use(errorHandler);

// ------------------------------
// ✅ Error Handling for Uncaught Exceptions
// ------------------------------
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit, let the server continue running
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, let the server continue running
});

// ------------------------------
// ✅ Connect Database and Start Server
// ------------------------------
// Connect to database (non-blocking, will retry on failure)
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  logger.warn('⚠️  MONGODB_URI not set, database connection will not be established');
}

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`✅ Health check available at http://0.0.0.0:${PORT}/healthz`);
});

// Handle server errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use`);
  } else {
    logger.error('❌ Server error:', error);
  }
});

module.exports = app;
