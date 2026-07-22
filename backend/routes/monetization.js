const express = require('express');
const router = express.Router();
const pool = require('../db/database');
const crypto = require('crypto');

const APP_ID_REGEX = /^ca-app-pub-\d{16}~\d{10}$/;
const AD_UNIT_ID_REGEX = /^ca-app-pub-\d{16}\/\d{10}$/;

function validateAppId(id) {
    if (!id) return true;
    return APP_ID_REGEX.test(id.trim());
}

function validateAdUnitId(id) {
    if (!id) return true;
    return AD_UNIT_ID_REGEX.test(id.trim());
}

// GET /api/monetization/:projectId
router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM monetization WHERE project_id = $1', [projectId]);
        if (result.rows.length === 0) {
            return res.json({
                project_id: projectId,
                provider: 'none',
                ads_enabled: false,
                app_id: '',
                banner_id: '',
                interstitial_id: '',
                rewarded_id: '',
                native_id: '',
                app_open_id: ''
            });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching monetization settings:', err);
        res.status(500).json({ error: 'Database error fetching monetization settings' });
    }
});

// POST /api/monetization/save
router.post('/save', async (req, res) => {
    const {
        user_id,
        project_id,
        provider,
        app_id,
        banner_id,
        interstitial_id,
        rewarded_id,
        native_id,
        app_open_id,
        ads_enabled
    } = req.body;

    if (!project_id) {
        return res.status(400).json({ error: 'project_id is required' });
    }

    const currentProvider = provider || 'none';
    const enabled = ads_enabled === true || ads_enabled === 'true' || ads_enabled === 1 || ads_enabled === '1';

    // Validation if AdMob provider is selected
    if (currentProvider === 'admob') {
        if (!app_id) {
            return res.status(400).json({ error: 'Google AdMob App ID is required' });
        }
        if (!validateAppId(app_id)) {
            return res.status(400).json({ error: 'Invalid Google AdMob App ID format (expected: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX)' });
        }
        if (!banner_id) {
            return res.status(400).json({ error: 'Banner Ad Unit ID is required' });
        }
        if (!validateAdUnitId(banner_id)) {
            return res.status(400).json({ error: 'Invalid Banner Ad Unit ID format (expected: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX)' });
        }
        if (!interstitial_id) {
            return res.status(400).json({ error: 'Interstitial Ad Unit ID is required' });
        }
        if (!validateAdUnitId(interstitial_id)) {
            return res.status(400).json({ error: 'Invalid Interstitial Ad Unit ID format (expected: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX)' });
        }
        if (rewarded_id && !validateAdUnitId(rewarded_id)) {
            return res.status(400).json({ error: 'Invalid Rewarded Ad Unit ID format' });
        }
        if (native_id && !validateAdUnitId(native_id)) {
            return res.status(400).json({ error: 'Invalid Native Ad Unit ID format' });
        }
        if (app_open_id && !validateAdUnitId(app_open_id)) {
            return res.status(400).json({ error: 'Invalid App Open Ad Unit ID format' });
        }
    }

    try {
        // Check if config already exists for project
        const existing = await pool.query('SELECT id FROM monetization WHERE project_id = $1', [project_id]);
        
        let query;
        let params;
        const now = new Date().toISOString();

        if (existing.rows.length > 0) {
            // Update
            query = `
                UPDATE monetization SET 
                provider = $1,
                app_id = $2,
                banner_id = $3,
                interstitial_id = $4,
                rewarded_id = $5,
                native_id = $6,
                app_open_id = $7,
                ads_enabled = $8,
                updated_at = $9
                WHERE project_id = $10
            `;
            params = [
                currentProvider,
                app_id || null,
                banner_id || null,
                interstitial_id || null,
                rewarded_id || null,
                native_id || null,
                app_open_id || null,
                enabled,
                now,
                project_id
            ];
        } else {
            // Insert
            const id = crypto.randomUUID();
            query = `
                INSERT INTO monetization (
                    id, user_id, project_id, provider, app_id, 
                    banner_id, interstitial_id, rewarded_id, native_id, 
                    app_open_id, ads_enabled, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            params = [
                id,
                user_id || 'guest',
                project_id,
                currentProvider,
                app_id || null,
                banner_id || null,
                interstitial_id || null,
                rewarded_id || null,
                native_id || null,
                app_open_id || null,
                enabled,
                now,
                now
            ];
        }

        await pool.query(query, params);
        res.json({ success: true, message: 'Monetization settings saved successfully' });
    } catch (err) {
        console.error('Error saving monetization settings:', err);
        res.status(500).json({ error: 'Failed to save monetization settings' });
    }
});

// PUT /api/monetization/:projectId
router.put('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    req.body.project_id = projectId;
    
    // Redirect to POST save handler logic
    const saveHandler = router.stack.find(s => s.route && s.route.path === '/save').route.stack[0].handle;
    return saveHandler(req, res);
});

// DELETE /api/monetization/:projectId
router.delete('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    
    try {
        await pool.query(`
            UPDATE monetization SET 
            provider = 'none',
            ads_enabled = false,
            updated_at = $1
            WHERE project_id = $2
        `, [new Date().toISOString(), projectId]);
        
        res.json({ success: true, message: 'Monetization disabled successfully' });
    } catch (err) {
        console.error('Error disabling monetization settings:', err);
        res.status(500).json({ error: 'Failed to disable monetization' });
    }
});

module.exports = router;
