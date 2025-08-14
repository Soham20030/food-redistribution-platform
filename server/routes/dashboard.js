// server/routes/dashboard.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Restaurant Dashboard - Overview statistics for restaurant users
router.get('/restaurant', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get restaurant ID
        const restaurantResult = await pool.query(
            'SELECT id FROM restaurants WHERE user_id = $1',
            [user_id]
        );

        if (restaurantResult.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant profile not found' });
        }

        const restaurant_id = restaurantResult.rows[0].id;

        // Get dashboard statistics
        const stats = await Promise.all([
            // Total food listings created
            pool.query(
                'SELECT COUNT(*) as total FROM food_listings WHERE restaurant_id = $1',
                [restaurant_id]
            ),
            
            // Active food listings
            pool.query(
                'SELECT COUNT(*) as active FROM food_listings WHERE restaurant_id = $1 AND status = $2',
                [restaurant_id, 'available']
            ),
            
            // Total claims received
            pool.query(`
                SELECT COUNT(*) as total_claims FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                WHERE fl.restaurant_id = $1
            `, [restaurant_id]),
            
            // Pending claims needing approval
            pool.query(`
                SELECT COUNT(*) as pending_claims FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                WHERE fl.restaurant_id = $1 AND fc.status = $2
            `, [restaurant_id, 'pending']),
            
            // Total servings donated
            pool.query(`
                SELECT COALESCE(SUM(fc.claimed_quantity), 0) as total_servings FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                WHERE fl.restaurant_id = $1 AND fc.status IN ($2, $3)
            `, [restaurant_id, 'approved', 'completed']),
            
            // Recent claims on restaurant's listings
            pool.query(`
                SELECT fc.*, fl.title, o.name as organization_name,
                       u.first_name, u.last_name, u.email
                FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                JOIN organizations o ON fc.organization_id = o.id
                JOIN users u ON o.user_id = u.id
                WHERE fl.restaurant_id = $1
                ORDER BY fc.created_at DESC
                LIMIT 5
            `, [restaurant_id])
        ]);

        res.json({
            dashboard: {
                total_listings: parseInt(stats[0].rows[0].total),
                active_listings: parseInt(stats[1].rows[0].active),
                total_claims: parseInt(stats[2].rows[0].total_claims),
                pending_claims: parseInt(stats[3].rows[0].pending_claims),
                total_servings_donated: parseInt(stats[4].rows[0].total_servings),
                recent_claims: stats[5].rows
            }
        });

    } catch (error) {
        console.error('Restaurant dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Organization Dashboard - Overview statistics for organization users
router.get('/organization', authenticateToken, requireRole(['organization']), async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get organization ID
        const organizationResult = await pool.query(
            'SELECT id FROM organizations WHERE user_id = $1',
            [user_id]
        );

        if (organizationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Organization profile not found' });
        }

        const organization_id = organizationResult.rows[0].id;

        // Get dashboard statistics
        const stats = await Promise.all([
            // Total claims made
            pool.query(
                'SELECT COUNT(*) as total FROM food_claims WHERE organization_id = $1',
                [organization_id]
            ),
            
            // Approved claims
            pool.query(
                'SELECT COUNT(*) as approved FROM food_claims WHERE organization_id = $1 AND status = $2',
                [organization_id, 'approved']
            ),
            
            // Completed pickups
            pool.query(
                'SELECT COUNT(*) as completed FROM food_claims WHERE organization_id = $1 AND status = $2',
                [organization_id, 'completed']
            ),
            
            // Total servings received
            pool.query(
                'SELECT COALESCE(SUM(claimed_quantity), 0) as total_servings FROM food_claims WHERE organization_id = $1 AND status IN ($2, $3)',
                [organization_id, 'approved', 'completed']
            ),
            
            // Upcoming pickups
            pool.query(`
                SELECT fc.*, fl.title, fl.food_type, r.name as restaurant_name,
                       r.address, r.phone
                FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                JOIN restaurants r ON fl.restaurant_id = r.id
                WHERE fc.organization_id = $1 AND fc.status = $2 
                AND fc.pickup_scheduled_time > NOW()
                ORDER BY fc.pickup_scheduled_time ASC
                LIMIT 5
            `, [organization_id, 'approved'])
        ]);

        res.json({
            dashboard: {
                total_claims: parseInt(stats[0].rows[0].total),
                approved_claims: parseInt(stats[1].rows[0].approved),
                completed_pickups: parseInt(stats[2].rows[0].completed),
                total_servings_received: parseInt(stats[3].rows[0].total_servings),
                upcoming_pickups: stats[4].rows
            }
        });

    } catch (error) {
        console.error('Organization dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Volunteer Dashboard - Overview statistics for volunteer users
router.get('/volunteer', authenticateToken, requireRole(['volunteer']), async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get volunteer ID
        const volunteerResult = await pool.query(
            'SELECT id FROM volunteers WHERE user_id = $1',
            [user_id]
        );

        if (volunteerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Volunteer profile not found' });
        }

        const volunteer_id = volunteerResult.rows[0].id;

        // Get dashboard statistics
        const stats = await Promise.all([
            // Total assignments
            pool.query(
                'SELECT COUNT(*) as total FROM food_claims WHERE volunteer_id = $1',
                [volunteer_id]
            ),
            
            // Completed deliveries
            pool.query(
                'SELECT COUNT(*) as completed FROM food_claims WHERE volunteer_id = $1 AND status = $2',
                [volunteer_id, 'completed']
            ),
            
            // Total servings helped deliver
            pool.query(
                'SELECT COALESCE(SUM(claimed_quantity), 0) as total_servings FROM food_claims WHERE volunteer_id = $1',
                [volunteer_id]
            ),
            
            // Upcoming assignments
            pool.query(`
                SELECT fc.*, fl.title, fl.food_type, 
                       r.name as restaurant_name, r.address as restaurant_address,
                       o.name as organization_name, o.address as organization_address
                FROM food_claims fc
                JOIN food_listings fl ON fc.food_listing_id = fl.id
                JOIN restaurants r ON fl.restaurant_id = r.id
                JOIN organizations o ON fc.organization_id = o.id
                WHERE fc.volunteer_id = $1 AND fc.pickup_scheduled_time > NOW()
                ORDER BY fc.pickup_scheduled_time ASC
                LIMIT 5
            `, [volunteer_id])
        ]);

        res.json({
            dashboard: {
                total_assignments: parseInt(stats[0].rows[0].total),
                completed_deliveries: parseInt(stats[1].rows[0].completed),
                total_servings_delivered: parseInt(stats[2].rows[0].total_servings),
                upcoming_assignments: stats[3].rows
            }
        });

    } catch (error) {
        console.error('Volunteer dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Platform Overview - Global statistics (accessible to all authenticated users)
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        // Get platform-wide statistics
        const stats = await Promise.all([
            // Total registered users by role
            pool.query(
                'SELECT role, COUNT(*) as count FROM users GROUP BY role'
            ),
            
            // Total food listings
            pool.query(
                'SELECT COUNT(*) as total FROM food_listings'
            ),
            
            // Total servings made available
            pool.query(
                'SELECT COALESCE(SUM(quantity), 0) as total_servings FROM food_listings'
            ),
            
            // Total servings claimed/distributed
            pool.query(
                'SELECT COALESCE(SUM(claimed_quantity), 0) as distributed_servings FROM food_claims WHERE status IN ($1, $2)',
                ['approved', 'completed']
            ),
            
            // Recent activity (last 10 food listings)
            pool.query(`
                SELECT fl.title, fl.quantity, fl.unit, fl.created_at,
                       r.name as restaurant_name
                FROM food_listings fl
                JOIN restaurants r ON fl.restaurant_id = r.id
                ORDER BY fl.created_at DESC
                LIMIT 10
            `),
            
            // Food waste saved (completed claims)
            pool.query(
                'SELECT COALESCE(SUM(claimed_quantity), 0) as food_waste_saved FROM food_claims WHERE status = $1',
                ['completed']
            )
        ]);

        // Process user counts by role
        const userCounts = {};
        stats[0].rows.forEach(row => {
            userCounts[row.role] = parseInt(row.count);
        });

        res.json({
            platform_overview: {
                total_users: {
                    restaurants: userCounts.restaurant || 0,
                    organizations: userCounts.organization || 0,
                    volunteers: userCounts.volunteer || 0,
                    total: Object.values(userCounts).reduce((sum, count) => sum + count, 0)
                },
                total_food_listings: parseInt(stats[1].rows[0].total),
                total_servings_available: parseInt(stats[2].rows[0].total_servings),
                servings_distributed: parseInt(stats[3].rows[0].distributed_servings),
                food_waste_saved: parseInt(stats[5].rows[0].food_waste_saved),
                recent_listings: stats[4].rows
            }
        });

    } catch (error) {
        console.error('Platform overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
