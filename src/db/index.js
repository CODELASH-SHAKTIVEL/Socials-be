import mongoose from 'mongoose';
import { DB_NAME } from "../constant.js";

const ConnectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    const hostmessage = connectionInstance.connection.host;
    console.log('MongoDB is connected:', hostmessage);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

export default ConnectDB;
