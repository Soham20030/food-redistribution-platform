// server/routes/volunteers.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create/Update Volunteer Profile (Volunteer users only)
router.post('/profile', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const {
            address,
            latitude,
            longitude,
            phone,
            availability,
            transportation_type,
            max_distance,
            skills,
            emergency_contact_name,
            emergency_contact_phone
        } = req.body;

        const user_id = req.user.id;

        // Check if volunteer profile already exists
        const existingProfile = await pool.query(
            'SELECT id FROM volunteers WHERE user_id = $1',
            [user_id]
        );

        let result;

        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await pool.query(`
                UPDATE volunteers 
                SET address = $1, latitude = $2, longitude = $3, phone = $4, 
                    availability = $5, transportation_type = $6, max_distance = $7,
                    skills = $8, emergency_contact_name = $9, emergency_contact_phone = $10,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $11
                RETURNING *
            `, [address, latitude, longitude, phone, availability, transportation_type, 
                max_distance, skills, emergency_contact_name, emergency_contact_phone, user_id]);
        } else {
            // Create new profile
            result = await pool.query(`
                INSERT INTO volunteers (user_id, address, latitude, longitude, phone, 
                                      availability, transportation_type, max_distance, skills,
                                      emergency_contact_name, emergency_contact_phone)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [user_id, address, latitude, longitude, phone, availability, 
                transportation_type, max_distance, skills, emergency_contact_name, emergency_contact_phone]);
        }

        res.json({
            message: existingProfile.rows.length > 0 ? 'Volunteer profile updated' : 'Volunteer profile created',
            volunteer: result.rows[0]
        });

    } catch (error) {
        console.error('Volunteer profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Volunteer Profile (Volunteer users only)
router.get('/profile', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(
            'SELECT * FROM volunteers WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Volunteer profile not found' });
        }

        res.json({
            volunteer: result.rows[0]
        });

    } catch (error) {
        console.error('Get volunteer profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Available Volunteer Opportunities (Volunteer users only)
router.get('/opportunities', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        // Get approved food claims that need pickup/delivery
        const result = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end, fl.special_instructions,
                   r.name as restaurant_name, r.address as restaurant_address, 
                   r.latitude as restaurant_latitude, r.longitude as restaurant_longitude,
                   r.phone as restaurant_phone,
                   o.name as organization_name, o.address as organization_address,
                   o.latitude as organization_latitude, o.longitude as organization_longitude,
                   o.phone as organization_phone
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            WHERE fc.status = 'approved' 
            AND fc.pickup_scheduled_time > NOW()
            AND fc.volunteer_id IS NULL
            ORDER BY fc.pickup_scheduled_time ASC
        `);

        res.json({
            opportunities: result.rows
        });

    } catch (error) {
        console.error('Get volunteer opportunities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Volunteer signs up for an opportunity
router.post('/signup/:claim_id', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const { claim_id } = req.params;
        const { notes } = req.body;
        const user_id = req.user.id;

        // Get volunteer ID from user ID
        const volunteerResult = await pool.query(
            'SELECT id FROM volunteers WHERE user_id = $1',
            [user_id]
        );

        if (volunteerResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Volunteer profile required. Please create your volunteer profile first.' 
            });
        }

        const volunteer_id = volunteerResult.rows[0].id;

        // Check if claim exists and is available for volunteers
        const claimResult = await pool.query(
            'SELECT * FROM food_claims WHERE id = $1 AND status = $2 AND volunteer_id IS NULL',
            [claim_id, 'approved']
        );

        if (claimResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Volunteer opportunity not found or already taken' 
            });
        }

        // Assign volunteer to the claim
        const result = await pool.query(`
            UPDATE food_claims 
            SET volunteer_id = $1, volunteer_notes = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [volunteer_id, notes, claim_id]);

        // Get full details of the assignment
        const assignmentResult = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.pickup_time_start, fl.pickup_time_end,
                   r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                   o.name as organization_name, o.address as organization_address, o.phone as organization_phone
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            WHERE fc.id = $1
        `, [claim_id]);

        res.json({
            message: 'Successfully signed up for volunteer opportunity',
            assignment: assignmentResult.rows[0]
        });

    } catch (error) {
        console.error('Volunteer signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get volunteer's assignments (Volunteer users only)
router.get('/my-assignments', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end, fl.special_instructions,
                   r.name as restaurant_name, r.address as restaurant_address, 
                   r.latitude as restaurant_latitude, r.longitude as restaurant_longitude,
                   r.phone as restaurant_phone,
                   o.name as organization_name, o.address as organization_address,
                   o.latitude as organization_latitude, o.longitude as organization_longitude,
                   o.phone as organization_phone
            FROM food_claims fc
            JOIN volunteers v ON fc.volunteer_id = v.id
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            WHERE v.user_id = $1
            ORDER BY fc.pickup_scheduled_time ASC
        `, [user_id]);

        res.json({
            assignments: result.rows
        });

    } catch (error) {
        console.error('Get volunteer assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Active Volunteers (Public - for coordination)
router.get('/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.id, v.address, v.latitude, v.longitude, v.transportation_type,
                   v.max_distance, v.availability, v.skills, v.created_at,
                   u.first_name, u.last_name, u.email, u.phone
            FROM volunteers v
            JOIN users u ON v.user_id = u.id
            WHERE v.is_active = true
            ORDER BY v.created_at DESC
        `);

        res.json({
            volunteers: result.rows
        });

    } catch (error) {
        console.error('Get all volunteers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
