import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

console.log('🔧 Development Setup Script');
console.log('==========================\n');

// Check required environment variables
const requiredEnvVars = ['MONGO_URL', 'JWT_SECRET'];
const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please create a .env file with the following variables:');
  console.log('MONGO_URL=mongodb://localhost:27017/job_portal');
  console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
  console.log('\nOptional variables for email verification:');
  console.log('EMAIL_USER=your_email@gmail.com');
  console.log('EMAIL_PASS=your_app_password');
  console.log('EMAIL_FROM=your_email@gmail.com');
  process.exit(1);
}

// Test database connection
console.log('🔍 Testing database connection...');
try {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Database connection successful!');
  await mongoose.connection.close();
} catch (error) {
  console.log('❌ Database connection failed:');
  console.log(`   ${error.message}`);
  console.log('\n💡 Make sure MongoDB is running on your system.');
  process.exit(1);
}

console.log('\n✅ Development environment is ready!');
console.log('🚀 You can now start the server with: npm start'); 