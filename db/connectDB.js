import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async() => {
    try {
        await mongoose.connect(process.env?.MONGODB_STRING);
        console.log("MongoDB is connected");
    } catch (error) {
        console.log("Error in connecting to mongoDB", error)
    }
}

export default connectDB;