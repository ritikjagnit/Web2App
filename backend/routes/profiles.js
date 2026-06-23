const express = require('express');
const router = express.Router();
const pool = require('../db/database');

// POST /api/profiles/sync
router.post('/sync', async (req, res) => {
    const { id, email, plan, api_key } = req.body;
    
    if (!id) {
        return res.status(400).json({ error: 'id is required for profile sync' });
    }

    const query = `
        INSERT INTO profiles (id, email, plan, api_key) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT(id) DO UPDATE SET 
        email = EXCLUDED.email,
        plan = EXCLUDED.plan, 
        api_key = EXCLUDED.api_key
    `;
    
    try {
        await pool.query(query, [id, email || '', plan || 'free', api_key || null]);
        res.json({ success: true, message: 'Profile synced successfully' });
    } catch (err) {
        console.error('Error syncing profile:', err);
        res.status(500).json({ error: 'Failed to sync profile configuration' });
    }
});

// GET /api/profiles/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found in Neon' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error fetching profile:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
