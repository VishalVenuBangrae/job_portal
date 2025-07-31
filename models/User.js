import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6
    },
    userType: {
        type: String,
        enum: ['jobseeker', 'employer'],
        required: true
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        trim: true
    },
    // For job seekers
    profile: {
        phone: String,
        location: String,
        skills: [String],
        experience: String,
        education: String,
        resume: {
            data: Buffer,
            contentType: String
        }
    },
    resetEmailCode: String,
    resetEmailCodeExpiry: Date,
    // For job seekers - track applied jobs
    appliedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    // For employers - track posted jobs
    postedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationCode: String
}, {
    timestamps: true
});

// Password validation and hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    // Password strength validation (relaxed for development)
    const password = this.password;
    const minLength = 6; // Reduced from 8 for development
    
    if (password.length < minLength) {
        return next(new Error('Password must be at least 6 characters long'));
    }
    
    // Optional: Uncomment for stricter password requirements in production
    /*
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUppercase) {
        return next(new Error('Password must contain at least one uppercase letter'));
    }
    if (!hasLowercase) {
        return next(new Error('Password must contain at least one lowercase letter'));
    }
    if (!hasNumbers) {
        return next(new Error('Password must contain at least one number'));
    }
    if (!hasSpecialChars) {
        return next(new Error('Password must contain at least one special character'));
    }
    */
    
    // Hash password with higher salt rounds for security
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User; 