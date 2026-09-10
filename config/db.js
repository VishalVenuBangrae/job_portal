import mongoose from 'mongoose';
export default async function connectDB() {
 if (!process.env.MONGO_URL) throw new Error('Set MONGO_URL in .env before starting the server');
 if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32) throw new Error('JWT_SECRET must be at least 32 characters');
 await mongoose.connect(process.env.MONGO_URL, {serverSelectionTimeoutMS:10000});
}
