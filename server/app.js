// server/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import foodListingRoutes from './routes/foodListings.js';
import organizationRoutes from './routes/organizations.js';
import foodClaimRoutes from './routes/foodClaims.js';
import volunteerRoutes from './routes/volunteers.js';
import dashboardRoutes from './routes/dashboard.js';
import { authenticateToken, requireRole } from './middleware/auth.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - FIX: Add localhost:5173 for Vite
app.use(cors({
    origin: [
        'http://localhost:3000',  // Create React App default
        'http://localhost:5173'   // Vite default - ADD THIS LINE
    ],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/food-listings', foodListingRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/food-claims', foodClaimRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
