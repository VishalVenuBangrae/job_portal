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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User; 