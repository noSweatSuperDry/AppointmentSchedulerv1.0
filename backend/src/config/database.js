import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};
