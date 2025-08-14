// server/routes/restaurants.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create/Update Restaurant Profile (Restaurant users only)
router.post('/profile', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const {
            name,
            address,
            latitude,
            longitude,
            phone,
            cuisine_type,
            operating_hours
        } = req.body;

        const user_id = req.user.id;

        // Check if restaurant profile already exists
        const existingProfile = await pool.query(
            'SELECT id FROM restaurants WHERE user_id = $1',
            [user_id]
        );

        let result;

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await pool.query(`
                UPDATE restaurants 
                SET name = $1, address = $2, latitude = $3, longitude = $4, 
                    phone = $5, cuisine_type = $6, operating_hours = $7, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $8
                RETURNING *
            `, [name, address, latitude, longitude, phone, cuisine_type, operating_hours, user_id]);
        } else {
            // Create new profile
            result = await pool.query(`
                INSERT INTO restaurants (user_id, name, address, latitude, longitude, phone, cuisine_type, operating_hours)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [user_id, name, address, latitude, longitude, phone, cuisine_type, operating_hours]);
        }

        res.json({
            message: existingProfile.rows.length > 0 ? 'Restaurant profile updated' : 'Restaurant profile created',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Restaurant profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Restaurant Profile (Restaurant users only)
router.get('/profile', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(
            'SELECT * FROM restaurants WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant profile not found' });
        }

        res.json({
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Get restaurant profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Active Restaurants (Public - for organizations and volunteers)
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.name, r.address, r.latitude, r.longitude, 
                   r.phone, r.cuisine_type, r.operating_hours, r.created_at,
                   u.first_name, u.last_name, u.email
            FROM restaurants r
            JOIN users u ON r.user_id = u.id
            WHERE r.is_active = true
            ORDER BY r.created_at DESC
        `);

        res.json({
            restaurants: result.rows
        });

    } catch (error) {
        console.error('Get all restaurants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Restaurant by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.email
            FROM restaurants r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = $1 AND r.is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        res.json({
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Get restaurant by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
