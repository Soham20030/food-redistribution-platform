// server/routes/foodClaims.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { notifyFoodClaimed, notifyClaimStatusUpdate } from '../utils/emailService.js';

const router = express.Router();

// Organization claims a food listing
router.post('/', authenticateToken, requireRole(['organization']), async (req, res) => {
    try {
        const {
            food_listing_id,
            claimed_quantity,
            pickup_scheduled_time,
            notes
        } = req.body;

        const user_id = req.user.id;

        // Get organization ID from user ID
        const organizationResult = await pool.query(
            'SELECT id FROM organizations WHERE user_id = $1',
            [user_id]
        );

        if (organizationResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Organization profile required. Please create your organization profile first.' 
            });
        }

        const organization_id = organizationResult.rows[0].id;

        // Check if food listing exists and is available
        const listingResult = await pool.query(
            'SELECT * FROM food_listings WHERE id = $1 AND status = $2',
            [food_listing_id, 'available']
        );

        if (listingResult.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Food listing not found or no longer available' 
            });
        }

        const listing = listingResult.rows[0];

        // Check if organization already claimed this listing
        const existingClaim = await pool.query(
            'SELECT id FROM food_claims WHERE food_listing_id = $1 AND organization_id = $2',
            [food_listing_id, organization_id]
        );

        if (existingClaim.rows.length > 0) {
            return res.status(400).json({ 
                error: 'You have already claimed this food listing' 
            });
        }

        // Validate claimed quantity
        if (claimed_quantity > listing.quantity) {
            return res.status(400).json({ 
                error: `Cannot claim ${claimed_quantity} ${listing.unit}. Only ${listing.quantity} ${listing.unit} available.` 
            });
        }

        // Create the claim
        const claimResult = await pool.query(`
            INSERT INTO food_claims (food_listing_id, organization_id, claimed_quantity, pickup_scheduled_time, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [food_listing_id, organization_id, claimed_quantity, pickup_scheduled_time, notes]);

        // Send email notification to restaurant
        await notifyFoodClaimed(claimResult.rows[0].id);

        // Get full claim details with related data
        const fullClaimResult = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end,
                   r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                   o.name as organization_name
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            WHERE fc.id = $1
        `, [claimResult.rows[0].id]);

        res.status(201).json({
            message: 'Food listing claimed successfully',
            claim: fullClaimResult.rows[0]
        });

    } catch (error) {
        console.error('Claim food listing error:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'You have already claimed this food listing' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get organization's claims (Organization users only)
router.get('/my-claims', authenticateToken, requireRole(['organization']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end, fl.special_instructions,
                   r.name as restaurant_name, r.address as restaurant_address, 
                   r.phone as restaurant_phone, r.latitude, r.longitude,
                   ru.first_name as restaurant_contact_first_name, ru.last_name as restaurant_contact_last_name,
                   ru.email as restaurant_contact_email
            FROM food_claims fc
            JOIN organizations o ON fc.organization_id = o.id
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users ru ON r.user_id = ru.id
            WHERE o.user_id = $1
            ORDER BY fc.created_at DESC
        `, [user_id]);

        res.json({
            claims: result.rows
        });

    } catch (error) {
        console.error('Get my claims error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get claims for restaurant's listings (Restaurant users only)
router.get('/restaurant-claims', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT fc.*, 
                   fl.title, fl.description, fl.food_type, fl.quantity as total_quantity, fl.unit,
                   fl.expiry_date, fl.pickup_time_start, fl.pickup_time_end,
                   o.name as organization_name, o.type as organization_type,
                   o.address as organization_address, o.phone as organization_phone,
                   ou.first_name as organization_contact_first_name, ou.last_name as organization_contact_last_name,
                   ou.email as organization_contact_email
            FROM food_claims fc
            JOIN food_listings fl ON fc.food_listing_id = fl.id
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN organizations o ON fc.organization_id = o.id
            JOIN users ou ON o.user_id = ou.id
            WHERE r.user_id = $1
            ORDER BY fc.created_at DESC
        `, [user_id]);

        res.json({
            claims: result.rows
        });

    } catch (error) {
        console.error('Get restaurant claims error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update claim status (Restaurant users can approve/reject, Organizations can complete/cancel)
router.put('/:id/status', authenticateToken, requireRole(['restaurant', 'organization']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const user_id = req.user.id;
        const user_role = req.user.role;

        // Validate status transitions based on role
        if (user_role === 'restaurant' && !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Restaurants can only approve or reject claims' });
        }

        if (user_role === 'organization' && !['completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Organizations can only mark claims as completed or cancelled' });
        }

        // Check if user has permission to update this claim
        let permissionQuery;
        if (user_role === 'restaurant') {
            permissionQuery = `
                SELECT fc.id 
                FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                JOIN restaurants r ON fl.restaurant_id = r.id
                WHERE fc.id = $1 AND r.user_id = $2
            `;
        } else {
            permissionQuery = `
                SELECT fc.id 
                FROM food_claims fc
                JOIN organizations o ON fc.organization_id = o.id
                WHERE fc.id = $1 AND o.user_id = $2
            `;
        }

        const permissionResult = await pool.query(permissionQuery, [id, user_id]);

        if (permissionResult.rows.length === 0) {
            return res.status(403).json({ error: 'You do not have permission to update this claim' });
        }

        // Update the claim status
        const result = await pool.query(`
            UPDATE food_claims 
            SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [status, notes, id]);

        // Send email notification for status update
        await notifyClaimStatusUpdate(id, status, notes);

        // If claim is approved, update food listing status to claimed
        if (status === 'approved') {
            await pool.query(`
                UPDATE food_listings 
                SET status = 'claimed', updated_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT food_listing_id FROM food_claims WHERE id = $1)
            `, [id]);
        }

        // If claim is completed, update food listing status to completed
        if (status === 'completed') {
            await pool.query(`
                UPDATE food_listings 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT food_listing_id FROM food_claims WHERE id = $1)
            `, [id]);
        }

        res.json({
            message: `Claim status updated to ${status}`,
            claim: result.rows[0]
        });

    } catch (error) {
        console.error('Update claim status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
