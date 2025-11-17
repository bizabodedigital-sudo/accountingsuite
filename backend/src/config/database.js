const mongoose = require('mongoose');
const logger = require('./logger');

const { createIndexes } = require('../models/indexes');

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
    mongoose.connection.once('open', async () => {
      try {
        await createIndexes();
        logger.info('✅ Database indexes created');
      } catch (error) {
        logger.error('Failed to create indexes:', error);
      }
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    logger.info('🔄 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;




