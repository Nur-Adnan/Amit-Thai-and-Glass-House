import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    logger.database(`MongoDB Connected: ${conn.connection.host}`);
    logger.database(`Database: ${conn.connection.name}`);

    // Money-path writes (invoices/payments/stock) use multi-document transactions,
    // which require a replica set. Warn loudly if connected to a standalone mongod
    // so the failure mode is obvious before users hit it.
    try {
      const hello = await conn.connection.db.admin().command({ hello: 1 });
      if (!hello.setName && !hello.msg) {
        logger.warn(
          'MongoDB is running as a STANDALONE instance. Multi-document transactions ' +
          '(invoice/payment/stock writes) will FAIL. Use a replica set or MongoDB Atlas.'
        );
      }
    } catch {
      // admin command may be unavailable (restricted user) — non-fatal.
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Error connecting to MongoDB:', { 
      error: error.message,
      uri: config.mongoUri ? '[CONFIGURED]' : '[NOT SET]'
    });
    process.exit(1);
  }
};

export default connectDB;