import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a job title'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please provide a company name'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please provide a job location'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a job description']
    },
    requirements: [{
        type: String
    }],
    salary: {
        type: String,
        required: [true, 'Please provide salary information']
    },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Temporary'],
        required: true
    },
    jobCategory: {
        type: String,
        enum: ['Daywork/Freelance', 'Deliveries'],
        required: true
    },
    position: {
        type: String,
        enum: [
            // Daywork/Freelance positions
            'Captain', 'Engineer', 'Bosun', 'Mate', 'Deckhand', 
            'Chef/crew cook', 'Chief Stewardess', '2nd Stewardess',
            // Delivery positions
            'Stewardess'
        ],
        required: true
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applications: [{
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String
        },
        resume: {
            filename: String,
            originalName: String,
            path: String,
            mimetype: String
        },
        coverLetter: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'accepted', 'rejected'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

const Job = mongoose.model('Job', jobSchema);

export default Job; 