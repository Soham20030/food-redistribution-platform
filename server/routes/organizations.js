// server/routes/organizations.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create/Update Organization Profile (Organization users only)
router.post('/profile', authenticateToken, requireRole(['organization']), async (req, res) => {
    try {
        const {
            name,
            type,
            address,
            latitude,
            longitude,
            phone,
            capacity
        } = req.body;

        const user_id = req.user.id;

        // Check if organization profile already exists
        const existingProfile = await pool.query(
            'SELECT id FROM organizations WHERE user_id = $1',
            [user_id]
        );

        let result;

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await pool.query(`
                UPDATE organizations 
                SET name = $1, type = $2, address = $3, latitude = $4, longitude = $5,
                    phone = $6, capacity = $7, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $8
                RETURNING *
            `, [name, type, address, latitude, longitude, phone, capacity, user_id]);
        } else {
            // Create new profile
            result = await pool.query(`
                INSERT INTO organizations (user_id, name, type, address, latitude, longitude, phone, capacity)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [user_id, name, type, address, latitude, longitude, phone, capacity]);
        }

        res.json({
            message: existingProfile.rows.length > 0 ? 'Organization profile updated' : 'Organization profile created',
            organization: result.rows[0]
        });

    } catch (error) {
        console.error('Organization profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Organization Profile (Organization users only)
router.get('/profile', authenticateToken, requireRole(['organization']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(
            'SELECT * FROM organizations WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization profile not found' });
        }

        res.json({
            organization: result.rows[0]
        });

    } catch (error) {
        console.error('Get organization profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Active Organizations (Public)
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.id, o.name, o.type, o.address, o.latitude, o.longitude, 
                   o.phone, o.capacity, o.created_at,
                   u.first_name, u.last_name, u.email
            FROM organizations o
            JOIN users u ON o.user_id = u.id
            WHERE o.is_active = true
            ORDER BY o.name ASC
        `);

        res.json({
            organizations: result.rows
        });

    } catch (error) {
        console.error('Get all organizations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Organizations by Type (Public)
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;

        const result = await pool.query(`
            SELECT o.id, o.name, o.type, o.address, o.latitude, o.longitude, 
                   o.phone, o.capacity, o.created_at,
                   u.first_name, u.last_name, u.email
            FROM organizations o
            JOIN users u ON o.user_id = u.id
            WHERE o.type = $1 AND o.is_active = true
            ORDER BY o.name ASC
        `, [type]);

        res.json({
            organizations: result.rows,
            type: type
        });

    } catch (error) {
        console.error('Get organizations by type error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Organization by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT o.*, u.first_name, u.last_name, u.email
            FROM organizations o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1 AND o.is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json({
            organization: result.rows[0]
        });

    } catch (error) {
        console.error('Get organization by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
