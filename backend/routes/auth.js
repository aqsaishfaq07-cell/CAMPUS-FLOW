const express = require('express');
const router = express.Router();

const db = require('../db');
const bcrypt = require('bcryptjs');

// Login API
router.post('/login', async (req, res) => {

    const { login_id, password } = req.body;

    try {

        // Find user in database
        const [rows] = await db.promise().execute(
            'SELECT * FROM cf_users WHERE login_id = ?',
            [login_id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid Login ID or Password'
            });
        }

        const user = rows[0];

        // Check password
        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid Login ID or Password'
            });
        }

        // Check account status
        if (user.account_status !== 'active') {
            return res.status(403).json({
                message: 'Account is not active'
            });
        }

        // Create session
        req.session.user = {
            user_id: user.user_id,
            login_id: user.login_id,
            role: user.role
        };

        res.json({
            message: 'Login successful',
            role: user.role
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

module.exports = router;