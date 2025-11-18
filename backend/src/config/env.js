const logger = require('./logger');

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT'
];

// In production, FRONTEND_URL is required
if (process.env.NODE_ENV === 'production') {
  if (!process.env.FRONTEND_URL) {
    logger.error('FRONTEND_URL is required in production environment');
    process.exit(1);
  }
  requiredEnvVars.push('FRONTEND_URL');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Environment configuration
const config = {
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {}
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  
  // Server
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  // Storage
  storage: {
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
    }
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate configuration
const validateConfig = () => {
  const errors = [];
  
  // Validate MongoDB URI
  if (!config.mongodb.uri.includes('mongodb://') && !config.mongodb.uri.includes('mongodb+srv://')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  // Validate JWT secret
  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate port
  const port = parseInt(config.server.port);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  if (errors.length > 0) {
    logger.error('Configuration validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    process.exit(1);
  }
  
  logger.info('Configuration validated successfully');
};

// Initialize configuration
validateConfig();

module.exports = config;






