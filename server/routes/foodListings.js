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

// Get All Available Food Listings with Search and Filtering (Public)
router.get('/available', async (req, res) => {
    try {
        const {
            search,          // Search in title, description, food_type
            food_type,       // Filter by specific food type
            min_quantity,    // Minimum quantity
            max_quantity,    // Maximum quantity
            latitude,        // User's latitude for distance filtering
            longitude,       // User's longitude for distance filtering
            max_distance,    // Maximum distance in km
            sort_by          // Sort options: 'expiry', 'quantity', 'distance', 'created'
        } = req.query;

        let query = `
            SELECT fl.*, r.name as restaurant_name, r.address, r.latitude, r.longitude, r.phone,
                   u.first_name, u.last_name, u.email
        `;

        // Add distance calculation if location provided
        if (latitude && longitude) {
            query += `, 
                (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * 
                cos(radians(r.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(r.latitude)))) AS distance
            `;
        }

        query += `
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            JOIN users u ON r.user_id = u.id
            WHERE fl.status = 'available' 
            AND fl.expiry_date > NOW()
            AND fl.pickup_time_end > NOW()
        `;

        const queryParams = [];
        let paramCount = 0;

        // Add location parameters if provided
        if (latitude && longitude) {
            queryParams.push(parseFloat(latitude), parseFloat(longitude));
            paramCount = 2;
        }

        // Search filter
        if (search) {
            paramCount++;
            query += ` AND (fl.title ILIKE $${paramCount} OR fl.description ILIKE $${paramCount} OR fl.food_type ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        // Food type filter
        if (food_type) {
            paramCount++;
            query += ` AND fl.food_type ILIKE $${paramCount}`;
            queryParams.push(`%${food_type}%`);
        }

        // Quantity filters
        if (min_quantity) {
            paramCount++;
            query += ` AND fl.quantity >= $${paramCount}`;
            queryParams.push(parseInt(min_quantity));
        }

        if (max_quantity) {
            paramCount++;
            query += ` AND fl.quantity <= $${paramCount}`;
            queryParams.push(parseInt(max_quantity));
        }

        // Distance filter (only if location provided)
        if (latitude && longitude && max_distance) {
            query += ` HAVING distance <= ${parseFloat(max_distance)}`;
        }

        // Sorting
        if (sort_by === 'expiry') {
            query += ` ORDER BY fl.expiry_date ASC`;
        } else if (sort_by === 'quantity') {
            query += ` ORDER BY fl.quantity DESC`;
        } else if (sort_by === 'distance' && latitude && longitude) {
            query += ` ORDER BY distance ASC`;
        } else {
            query += ` ORDER BY fl.created_at DESC`; // Default sort
        }

        const result = await pool.query(query, queryParams);

        res.json({
            listings: result.rows,
            total: result.rows.length,
            filters_applied: {
                search: search || null,
                food_type: food_type || null,
                min_quantity: min_quantity || null,
                max_quantity: max_quantity || null,
                max_distance: max_distance || null,
                sort_by: sort_by || 'created',
                location_provided: !!(latitude && longitude)
            }
        });

    } catch (error) {
        console.error('Get available listings with search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available food types for filter dropdown (Public)
router.get('/food-types', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT food_type 
            FROM food_listings 
            WHERE status = 'available' 
            AND expiry_date > NOW()
            AND pickup_time_end > NOW()
            ORDER BY food_type ASC
        `);

        res.json({
            food_types: result.rows.map(row => row.food_type)
        });

    } catch (error) {
        console.error('Get food types error:', error);
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

// Get Restaurant's Own Food Listings (Restaurant users only)
router.get('/my-listings', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await pool.query(`
            SELECT fl.*, r.name as restaurant_name,
                   COUNT(fc.id) as total_claims,
                   COUNT(fc.id) FILTER (WHERE fc.status = 'pending') as pending_claims,
                   COUNT(fc.id) FILTER (WHERE fc.status = 'approved') as approved_claims
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            LEFT JOIN food_claims fc ON fl.id = fc.food_listing_id
            WHERE r.user_id = $1
            AND fl.status IN ('available', 'claimed')  -- Only show active listings, not completed ones
            GROUP BY fl.id, r.name
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

// Get Restaurant's Own Food Listings (Restaurant users only)
router.get('/my-listings', authenticateToken, requireRole(['restaurant']), async (req, res) => {
    try {
        const user_id = req.user.id;
        const { status } = req.query;

        let statusFilter;
        if (status === 'completed') {
            statusFilter = "AND fl.status = 'completed'"; // Completed listings only
        } else {
            statusFilter = "AND fl.status IN ('available', 'claimed')"; // Active listings only (default)
        }

        const query = `
            SELECT fl.*, r.name as restaurant_name,
                   COUNT(fc.id) as total_claims,
                   COUNT(fc.id) FILTER (WHERE fc.status = 'pending') as pending_claims,
                   COUNT(fc.id) FILTER (WHERE fc.status = 'approved') as approved_claims
            FROM food_listings fl
            JOIN restaurants r ON fl.restaurant_id = r.id
            LEFT JOIN food_claims fc ON fl.id = fc.food_listing_id
            WHERE r.user_id = $1
            ${statusFilter}
            GROUP BY fl.id, r.name
            ORDER BY fl.created_at DESC
        `;

        const result = await pool.query(query, [user_id]);

        res.json({
            listings: result.rows
        });

    } catch (error) {
        console.error('Get my listings error:', error);
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
