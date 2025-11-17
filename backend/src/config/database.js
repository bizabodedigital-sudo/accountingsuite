const mongoose = require('mongoose');
const logger = require('./logger');

// Try to load indexes module, but don't fail if it doesn't exist
let createIndexes = null;
try {
  const indexesModule = require('../models/indexes');
  createIndexes = indexesModule.createIndexes;
} catch (error) {
  logger.warn('⚠️  Could not load indexes module:', error.message);
}

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    logger.warn('⚠️  MONGODB_URI not set, skipping database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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




