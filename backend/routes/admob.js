const express = require('express');
const router = express.Router();
const pool = require('../db/database');

// POST /api/admob/save
router.post('/save', async (req, res) => {
    const { user_id, banner_id, interstitial_id } = req.body;
    
    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    const query = `
        INSERT INTO admob_configs (user_id, banner_id, interstitial_id) 
        VALUES ($1, $2, $3) 
        ON CONFLICT(user_id) DO UPDATE SET 
        banner_id = EXCLUDED.banner_id, 
        interstitial_id = EXCLUDED.interstitial_id
    `;
    
    try {
        await pool.query(query, [user_id, banner_id, interstitial_id]);
        res.json({ success: true, message: 'AdMob configuration saved to Neon DB successfully' });
    } catch (err) {
        console.error('Error saving AdMob config:', err);
        res.status(500).json({ error: 'Failed to save AdMob configuration' });
    }
});

// GET /api/admob/:user_id
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM admob_configs WHERE user_id = $1', [user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
