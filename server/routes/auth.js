// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            role, 
            first_name, 
            last_name, 
            phone 
        } = req.body;

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const newUser = await pool.query(`
            INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, role, first_name, last_name, created_at
        `, [email, password_hash, role, first_name, last_name, phone]);

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: newUser.rows[0].id, 
                email: newUser.rows[0].email,
                role: newUser.rows[0].role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await pool.query(
            'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.rows[0].id, 
                email: user.rows[0].email,
                role: user.rows[0].role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password_hash from response
        const { password_hash, ...userWithoutPassword } = user.rows[0];

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
