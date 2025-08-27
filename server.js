// imports packages
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import testRoutes from './routes/testRoutes.js';
import multer from 'multer';
import {
  createRateLimiters,
  helmetConfig,
  corsConfig,
  securityHeaders,
  validateInput,
  fileUploadSecurity,
  securityErrorHandler,
  securityLogger
} from './config/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security Middleware
app.use(helmetConfig);

// Rate limiting
const { general: generalLimiter, auth: authLimiter, emailVerification: emailVerificationLimiter } = createRateLimiters();
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/', authLimiter);

// More lenient rate limiting for email verification
app.use('/api/v1/auth/verify-email', emailVerificationLimiter);
app.use('/api/v1/auth/resend-verification', emailVerificationLimiter);

// CORS configuration
app.use(cors(corsConfig));

// Security headers
app.use(securityHeaders);

// Input validation
app.use(validateInput);

// Security logging
app.use(securityLogger);

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (production-safe)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
    stream: {
      write: (message) => {
        // Log to file in production instead of console
        console.log(message.trim());
      }
    }
  }));
}

// Static files
app.use(express.static('public'));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: fileUploadSecurity.limits,
  fileFilter: fileUploadSecurity.fileFilter
});

// Make upload available to routes
app.locals.upload = upload;

// API Routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/locations', locationRoutes);

// Error handling middleware
app.use(securityErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
