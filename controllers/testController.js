import User from '../models/User.js';
import Job from '../models/Job.js';

// @desc    Test database connection
// @route   GET /api/v1/test/db
// @access  Public
export const testDB = async (req, res) => {
    try {
        // Try to count users and jobs
        const userCount = await User.countDocuments();
        const jobCount = await Job.countDocuments();
        
        res.json({
            message: 'Database connection successful',
            stats: {
                users: userCount,
                jobs: jobCount
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
};

// @desc    Test JWT authentication
// @route   GET /api/v1/test/auth
// @access  Private
export const testAuth = async (req, res) => {
    try {
        res.json({
            message: 'Authentication successful',
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Authentication failed',
            error: error.message
        });
    }
};

export const testPostController = (req, res) =>{
    const{ name } = req.body;
    res.status(200).send(`your name is ${name}`);

};

