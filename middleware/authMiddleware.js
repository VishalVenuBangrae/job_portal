import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }



        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password -emailVerificationCode -resetEmailCode -profile.resume.data');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (!req.user.emailVerified) return res.status(403).json({message:'Please verify your email before continuing'});
            if ((decoded.tokenVersion || 0)!==(req.user.tokenVersion || 0)) return res.status(401).json({message:'Please sign in again'});
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
}; 