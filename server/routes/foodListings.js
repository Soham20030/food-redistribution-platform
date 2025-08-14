// server/routes/foodListings.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create Food Listing (Restaurant users only)
router.post('/', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const {
            title,
            description,
            food_type,
            quantity,
            unit,
            expiry_date,
            pickup_time_start,
            pickup_time_end,
            special_instructions
        } = req.body;

        const user_id = req.user.id;

        // Get restaurant ID from user ID
        const restaurantResult = await pool.query(
            'SELECT id FROM restaurants WHERE user_id = $1',
            [user_id]
        );

        if (restaurantResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Restaurant profile required. Please create your restaurant profile first.' 
            });
        }

        const restaurant_id = restaurantResult.rows[0].id;

        // Create food listing
        const result = await pool.query(`
            INSERT INTO food_listings 
            (restaurant_id, title, description, food_type, quantity, unit, 
             expiry_date, pickup_time_start, pickup_time_end, special_instructions)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [restaurant_id, title, description, food_type, quantity, unit,
            expiry_date, pickup_time_start, pickup_time_end, special_instructions]);

        res.status(201).json({
            message: 'Food listing created successfully',
            listing: result.rows[0]
        });

    } catch (error) {
        console.error('Create food listing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Restaurant's Own Food Listings (Restaurant users only)
router.get('/my-listings', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT fl.*, r.name as restaurant_name
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            WHERE r.user_id = $1
            ORDER BY fl.created_at DESC
        `, [user_id]);

        res.json({
            listings: result.rows
        });

    } catch (error) {
        console.error('Get my listings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Available Food Listings (Public - for organizations and volunteers)
router.get('/available', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT fl.*, r.name as restaurant_name, r.address, r.latitude, r.longitude, r.phone,
                   u.first_name, u.last_name, u.email
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users u ON r.user_id = u.id
            WHERE fl.status = 'available' 
            AND fl.expiry_date > NOW()
            AND fl.pickup_time_end > NOW()
            ORDER BY fl.expiry_date ASC
        `);

        res.json({
            listings: result.rows
        });

    } catch (error) {
        console.error('Get available listings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Food Listing by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT fl.*, r.name as restaurant_name, r.address, r.latitude, r.longitude, 
                   r.phone, r.cuisine_type,
                   u.first_name, u.last_name, u.email
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users u ON r.user_id = u.id
            WHERE fl.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Food listing not found' });
        }

        res.json({
            listing: result.rows[0]
        });

    } catch (error) {
        console.error('Get listing by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Food Listing (Restaurant users only - own listings)
router.put('/:id', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            food_type,
            quantity,
            unit,
            expiry_date,
            pickup_time_start,
            pickup_time_end,
            status,
            special_instructions
        } = req.body;

        const user_id = req.user.id;

        // Check if listing belongs to current user's restaurant
        const ownershipCheck = await pool.query(`
            SELECT fl.id 
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            WHERE fl.id = $1 AND r.user_id = $2
        `, [id, user_id]);

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ 
                error: 'You can only update your own food listings' 
            });
        }

        // Update the listing
        const result = await pool.query(`
            UPDATE food_listings 
            SET title = $1, description = $2, food_type = $3, quantity = $4, unit = $5,
                expiry_date = $6, pickup_time_start = $7, pickup_time_end = $8, 
                status = $9, special_instructions = $10, updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING *
        `, [title, description, food_type, quantity, unit, expiry_date,
            pickup_time_start, pickup_time_end, status, special_instructions, id]);

        res.json({
            message: 'Food listing updated successfully',
            listing: result.rows[0]
        });

    } catch (error) {
        console.error('Update food listing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Food Listing (Restaurant users only - own listings)
router.delete('/:id', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check ownership and delete
        const result = await pool.query(`
            DELETE FROM food_listings fl
            USING restaurants r
            WHERE fl.restaurant_id = r.id 
            AND fl.id = $1 
            AND r.user_id = $2
            RETURNING fl.id, fl.title
        `, [id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Food listing not found or you do not have permission to delete it' 
            });
        }

        res.json({
            message: 'Food listing deleted successfully',
            deleted_listing: result.rows[0]
        });

    } catch (error) {
        console.error('Delete food listing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
