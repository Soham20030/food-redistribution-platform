// server/routes/volunteers.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get volunteer opportunities (approved claims that need help)
router.get('/opportunities', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT fc.*, fc.id as claim_id,
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end,
                   r.name as restaurant_name, r.address as restaurant_address, 
                   r.phone as restaurant_phone, r.latitude, r.longitude,
                   ru.first_name as restaurant_contact_first_name, ru.last_name as restaurant_contact_last_name,
                   ru.email as restaurant_contact_email,
                   o.name as organization_name, o.type as organization_type,
                   o.address as organization_address, o.phone as organization_phone,
                   ou.first_name as organization_contact_first_name, ou.last_name as organization_contact_last_name,
                   ou.email as organization_contact_email
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users ru ON r.user_id = ru.id
            JOIN organizations o ON fc.organization_id = o.id
            JOIN users ou ON o.user_id = ou.id
            WHERE fc.status = 'approved'
            AND fc.pickup_scheduled_time > NOW()
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
router.post('/signup/:claimId', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const { claimId } = req.params;
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

        // Check if claim exists and is available
        const claimResult = await pool.query(
            'SELECT * FROM food_claims WHERE id = $1 AND status = $2',
            [claimId, 'approved']
        );

        if (claimResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'This opportunity is no longer available' 
            });
        }

        // Check if volunteer already signed up for this claim
        const existingAssignment = await pool.query(
            'SELECT id FROM volunteer_assignments WHERE claim_id = $1 AND volunteer_id = $2',
            [claimId, volunteer_id]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(400).json({ 
                error: 'You have already signed up for this opportunity' 
            });
        }

        // Create volunteer assignment
        const assignmentResult = await pool.query(`
            INSERT INTO volunteer_assignments (claim_id, volunteer_id, status, assigned_at)
            VALUES ($1, $2, 'assigned', CURRENT_TIMESTAMP)
            RETURNING *
        `, [claimId, volunteer_id]);

        res.status(201).json({
            message: 'Successfully signed up for volunteer opportunity',
            assignment: assignmentResult.rows[0]
        });

    } catch (error) {
        console.error('Volunteer signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get volunteer's assignments
router.get('/my-assignments', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT va.*, fc.claimed_quantity, fc.pickup_scheduled_time, fc.notes,
                   fl.title as food_title, fl.food_type,
                   r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                   o.name as organization_name
            FROM volunteer_assignments va
            JOIN volunteers v ON va.volunteer_id = v.id
            JOIN food_claims fc ON va.claim_id = fc.id
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            WHERE v.user_id = $1
            ORDER BY va.assigned_at DESC
        `, [user_id]);

        res.json({
            assignments: result.rows
        });

    } catch (error) {
        console.error('Get volunteer assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark assignment as completed
router.put('/assignments/:id/complete', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if assignment belongs to current user
        const permissionResult = await pool.query(`
            SELECT va.id 
            FROM volunteer_assignments va
            JOIN volunteers v ON va.volunteer_id = v.id
            WHERE va.id = $1 AND v.user_id = $2
        `, [id, user_id]);

        if (permissionResult.rows.length === 0) {
            return res.status(403).json({ error: 'You do not have permission to update this assignment' });
        }

        // Update assignment status
        const result = await pool.query(`
            UPDATE volunteer_assignments 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        res.json({
            message: 'Assignment marked as completed',
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error('Complete assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create/Update volunteer profile
router.post('/profile', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const {
            phone,
            availability,
            transportation,
            skills
        } = req.body;

        const user_id = req.user.id;

        // Check if profile exists
        const existingProfile = await pool.query(
            'SELECT id FROM volunteers WHERE user_id = $1',
            [user_id]
        );

        let result;
        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await pool.query(`
                UPDATE volunteers 
                SET phone = $1, availability = $2, transportation = $3, skills = $4, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $5
                RETURNING *
            `, [phone, availability, transportation, skills, user_id]);
        } else {
            // Create new profile
            result = await pool.query(`
                INSERT INTO volunteers (user_id, phone, availability, transportation, skills)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [user_id, phone, availability, transportation, skills]);
        }

        res.json({
            message: 'Volunteer profile saved successfully',
            volunteer: result.rows[0]
        });

    } catch (error) {
        console.error('Save volunteer profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark assignment as completed
router.put('/assignments/:id/complete', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if assignment belongs to current user
        const permissionResult = await pool.query(`
            SELECT va.id, va.claim_id
            FROM volunteer_assignments va
            JOIN volunteers v ON va.volunteer_id = v.id
            WHERE va.id = $1 AND v.user_id = $2
        `, [id, user_id]);

        if (permissionResult.rows.length === 0) {
            return res.status(403).json({ error: 'You do not have permission to update this assignment' });
        }

        const claimId = permissionResult.rows[0].claim_id;

        // Start a transaction to update all related records
        await pool.query('BEGIN');

        try {
            // Update assignment status
            const assignmentResult = await pool.query(`
                UPDATE volunteer_assignments 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [id]);

            // Update the corresponding food claim status
            await pool.query(`
                UPDATE food_claims 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [claimId]);

            // Update the food listing status to 'completed'
            await pool.query(`
                UPDATE food_listings 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = (
                    SELECT food_listing_id FROM food_claims WHERE id = $1
                )
            `, [claimId]);

            await pool.query('COMMIT');

            console.log(`✅ Completed pickup: Assignment ${id}, Claim ${claimId}`); // Debug log

            res.json({
                message: 'Assignment marked as completed and food listing updated',
                assignment: assignmentResult.rows[0]
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Complete assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Get volunteer profile
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

export default router;
