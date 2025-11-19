const mongoose = require('mongoose');
const logger = require('./logger');

// Try to load indexes module, but don't fail if it doesn't exist
let createIndexes = null;
try {
  // Try to require the indexes module
  const indexesModule = require('../models/indexes');
  if (indexesModule && typeof indexesModule.createIndexes === 'function') {
    createIndexes = indexesModule.createIndexes;
    logger.info('✅ Indexes module loaded successfully');
  } else {
    logger.warn('⚠️  Indexes module loaded but createIndexes function not found');
  }
} catch (error) {
  // Module not found or other error - this is OK, we'll skip index creation
  if (error.code === 'MODULE_NOT_FOUND') {
    logger.warn('⚠️  Indexes module not found, skipping index creation (this is OK)');
  } else {
    logger.warn('⚠️  Could not load indexes module:', error.message);
  }
}

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    logger.warn('⚠️  MONGODB_URI not set, skipping database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Create indexes after connection
    if (createIndexes) {
      mongoose.connection.once('open', async () => {
        try {
          await createIndexes();
          logger.info('✅ Database indexes created');
        } catch (error) {
          logger.error('Failed to create indexes:', error);
        }
      });
    } else {
      logger.warn('⚠️  Index creation skipped (indexes module not available)');
    }
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    logger.info('🔄 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;




