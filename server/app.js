// server/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import { authenticateToken, requireRole } from './middleware/auth.js'; 
import restaurantRoutes from './routes/restaurants.js';
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication routes
app.use('/api/auth', authRoutes);

// Restaurants routes
app.use('/api/restaurants', restaurantRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Food Redistribution API is running',
        timestamp: new Date().toISOString()
    });
});

// Database connection test route
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({
            status: 'OK',
            message: 'Database connection successful',
            current_time: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// ADD THESE PROTECTED TEST ROUTES:

// Test protected route
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

// Test role-based route (restaurants only)
app.get('/api/restaurant-only', authenticateToken, requireRole(['restaurant']), (req, res) => {
    res.json({
        message: 'This endpoint is for restaurants only',
        user: req.user
    });
});

// Test route for organizations only
app.get('/api/organization-only', authenticateToken, requireRole(['organization']), (req, res) => {
    res.json({
        message: 'This endpoint is for organizations only',
        user: req.user
    });
});

// Test route for multiple roles
app.get('/api/restaurant-or-volunteer', authenticateToken, requireRole(['restaurant', 'volunteer']), (req, res) => {
    res.json({
        message: 'This endpoint is for restaurants and volunteers',
        user: req.user
    });
});

export default app;
