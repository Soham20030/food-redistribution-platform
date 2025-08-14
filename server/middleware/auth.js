// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get fresh user data from database
        const user = await pool.query(
            'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
            [decoded.user_id]
        );

        if (user.rows.length === 0) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = user.rows[0];
        next();

    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};
