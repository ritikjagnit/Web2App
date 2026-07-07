const express = require('express');
const router = express.Router();
const pwaService = require('../services/pwaService');
const pool = require('../db/database');

// POST /api/pwa/validate
router.post('/validate', async (req, res) => {
    const { website_url, sourceType, htmlContent } = req.body;
    try {
        const result = await pwaService.validateWebsite(website_url, sourceType, htmlContent);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Validation route error:', err);
        res.status(500).json({ error: 'Validation process failed', details: err.message });
    }
});

// POST /api/pwa/manifest
router.post('/manifest', (req, res) => {
    const { app_name, short_name, theme_color, background_color, start_url, display } = req.body;
    try {
        const manifest = pwaService.generateManifest({
            appName: app_name,
            shortName: short_name,
            themeColor: theme_color,
            backgroundColor: background_color,
            startUrl: start_url,
            display: display
        });
        res.json({ success: true, manifest });
    } catch (err) {
        res.status(500).json({ error: 'Manifest generation failed', details: err.message });
    }
});

// POST /api/pwa/service-worker
router.post('/service-worker', (req, res) => {
    const { cacheStrategy } = req.body;
    try {
        const swCode = pwaService.generateServiceWorker({ cacheStrategy });
        res.json({ success: true, serviceWorker: swCode });
    } catch (err) {
        res.status(500).json({ error: 'Service Worker generation failed', details: err.message });
    }
});

// POST /api/pwa/readiness
router.post('/readiness', async (req, res) => {
    const { website_url, app_name, theme_color, icon_url, sourceType } = req.body;
    try {
        const result = await pwaService.checkReadiness(website_url, {
            appName: app_name,
            themeColor: theme_color,
            iconUrl: icon_url,
            sourceType: sourceType
        });
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: 'Readiness check failed', details: err.message });
    }
});

// GET /api/pwa/check-limits/:userId
router.get('/check-limits/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const profileResult = await pool.query('SELECT plan, email FROM profiles WHERE id = $1', [userId]);
        const plan = profileResult.rows[0]?.plan || 'free';
        const email = profileResult.rows[0]?.email || '';

        const buildsResult = await pool.query('SELECT COUNT(*) as count FROM app_builds WHERE user_id = $1', [userId]);
        const count = parseInt(buildsResult.rows[0]?.count || '0');

        // Bypass limit check for admin developer
        const isBypass = email === 'ritikjagnit@gmail.com';

        res.json({
            plan,
            count,
            allowed: plan !== 'free' || isBypass || count < 1
        });
    } catch (err) {
        console.error('Error checking limits:', err);
        res.status(500).json({ error: 'Failed to check limits', details: err.message });
    }
});

// POST /api/pwa/build (Generate PWA Package)
router.post('/build', async (req, res) => {
    const { 
        user_id, 
        website_url, 
        app_name, 
        short_name, 
        theme_color, 
        background_color, 
        sourceType, 
        htmlContent, 
        iconUrl,
        cacheStrategy,
        plan,
        android_build_format,
        include_bottom_nav,
        custom_navigation
    } = req.body;
    
    if (sourceType !== 'html' && !website_url) {
        return res.status(400).json({ error: 'website_url is required when sourceType is not html' });
    }

    try {
        let activePlan = plan || 'free';
        let email = '';
        if (user_id) {
            const profileResult = await pool.query('SELECT plan, email FROM profiles WHERE id = $1', [user_id]);
            if (profileResult.rows.length > 0) {
                activePlan = profileResult.rows[0].plan || activePlan;
                email = profileResult.rows[0].email || '';
            }
        }

        const isBypass = email === 'ritikjagnit@gmail.com';
        if (activePlan === 'free' && include_bottom_nav && !isBypass) {
            return res.status(403).json({ error: 'Bottom Navigation Bar is a Premium feature. Please upgrade to Pro/Console plan.' });
        }

        if (activePlan === 'free' && user_id && !isBypass) {
            const buildsResult = await pool.query('SELECT COUNT(*) as count FROM app_builds WHERE user_id = $1', [user_id]);
            const count = parseInt(buildsResult.rows[0]?.count || '0');
            if (count >= 10) {
                return res.status(403).json({ error: 'Free Plan limit exceeded: Maximum 10 apps allowed on the free plan.' });
            }
        }
    } catch (dbErr) {
        console.error('Error checking limits on build:', dbErr);
    }

    try {
        const buildId = await pwaService.generatePwaPackage({
            userId: user_id || 'guest',
            websiteUrl: website_url,
            appName: app_name || 'My PWA App',
            shortName: short_name || app_name || 'PWA App',
            themeColor: theme_color || '#7c3aed',
            backgroundColor: background_color || '#ffffff',
            sourceType: sourceType || 'url',
            htmlContent: htmlContent,
            iconUrl: iconUrl,
            cacheStrategy: cacheStrategy || 'StaleWhileRevalidate',
            plan: plan || 'free',
            androidBuildFormat: android_build_format || 'apk',
            includeBottomNav: include_bottom_nav === true,
            customNavigation: custom_navigation
        });

        res.json({ 
            success: true, 
            message: 'PWA generation started',
            buildId: buildId,
            statusUrl: `/api/pwa/build/status/${buildId}`,
            logsUrl: `/api/pwa/build/logs/${buildId}`
        });
    } catch (err) {
        console.error('Failed to start PWA generation:', err);
        res.status(500).json({ error: 'Failed to start build', details: err.message });
    }
});

const path = require('path');

// POST /api/pwa/api-build
router.post('/api-build', async (req, res) => {
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!apiKeyHeader) {
        return res.status(401).json({ error: 'Unauthorized: X-API-Key header is missing' });
    }

    try {
        const result = await pool.query('SELECT id, plan FROM profiles WHERE api_key = $1', [apiKeyHeader]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }

        const profile = result.rows[0];
        if (profile.plan !== 'business') {
            return res.status(403).json({ error: 'Forbidden: API Access is exclusive to the Business Plan' });
        }

        const {
            website_url,
            app_name,
            short_name,
            theme_color,
            background_color,
            iconUrl,
            cacheStrategy,
            android_build_format
        } = req.body;

        if (!website_url && req.body.sourceType !== 'html') {
            return res.status(400).json({ error: 'website_url is required' });
        }

        const buildId = await pwaService.generatePwaPackage({
            userId: profile.id,
            websiteUrl: website_url,
            appName: app_name || 'API compiled PWA',
            shortName: short_name || app_name || 'API PWA',
            themeColor: theme_color || '#7c3aed',
            backgroundColor: background_color || '#ffffff',
            sourceType: req.body.sourceType || 'url',
            htmlContent: req.body.htmlContent || null,
            iconUrl: iconUrl,
            cacheStrategy: cacheStrategy || 'StaleWhileRevalidate',
            plan: 'business',
            androidBuildFormat: android_build_format || 'apk'
        });

        res.json({
            success: true,
            message: 'API compilation started successfully in priority queue',
            buildId: buildId,
            statusUrl: `/api/pwa/build/status/${buildId}`,
            logsUrl: `/api/pwa/build/logs/${buildId}`
        });

    } catch (err) {
        console.error('API PWA Build error:', err);
        res.status(500).json({ error: 'Failed to start programmatic build', details: err.message });
    }
});

// Setup multer for GitHub Action build upload
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fs = require('fs');
        const path = require('path');
        const { buildId } = req.params;
        const uploadDir = path.resolve(__dirname, `../../builds/${buildId}`);
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.endsWith('.aab') ? '.aab' : '.apk';
        cb(null, `app-release${ext}`);
    }
});
const upload = multer({ storage: storage });

// POST /api/pwa/upload-build/:buildId (GitHub Actions Callback)
router.post('/upload-build/:buildId', upload.single('file'), async (req, res) => {
    const { buildId } = req.params;
    const { status, error } = req.body;
    
    const authHeader = req.headers['authorization'];
    const expectedToken = `Bearer ${process.env.BUILD_CALLBACK_SECRET}`;
    if (!process.env.BUILD_CALLBACK_SECRET || authHeader !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized callback token' });
    }

    try {
        if (status === 'success') {
            if (!req.file) {
                return res.status(400).json({ error: 'No build file uploaded' });
            }

            const path = require('path');
            const finalPath = req.file.path;
            const downloadUrl = `/api/pwa/download/${buildId}`;

            // Update Database
            await pool.query(
                `UPDATE app_builds SET status = 'success', apk_url = $1 WHERE id = $2`,
                [downloadUrl, buildId]
            );

            // Update in-memory state in pwaService
            pwaService.updateBuildStatus(buildId, {
                progress: 100,
                step: 'Completed',
                status: 'success',
                packagePath: finalPath
            });
            pwaService.logBuildMsg(buildId, `✓ Package compiled and uploaded successfully from GitHub Actions!`);

            console.log(`[SUCCESS] Build ${buildId} finished via GitHub Actions.`);
            return res.json({ success: true, message: 'Build uploaded and state updated successfully' });
        } else {
            // Update database status to failed
            await pool.query(
                `UPDATE app_builds SET status = 'failed' WHERE id = $1`,
                [buildId]
            );

            pwaService.updateBuildStatus(buildId, {
                status: 'failed',
                error: error || 'Compilation failed on GitHub runner'
            });
            pwaService.logBuildMsg(buildId, `❌ Compilation failed on GitHub runner: ${error || 'Unknown error'}`);

            console.log(`[FAILED] Build ${buildId} failed via GitHub Actions:`, error);
            return res.json({ success: true, message: 'Failure state updated' });
        }
    } catch (err) {
        console.error(`Error in upload-build callback:`, err);
        res.status(500).json({ error: 'Internal callback processing error', details: err.message });
    }
});

// GET /api/pwa/build/status/:buildId
router.get('/build/status/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    let build = pwaService.getBuildStatus(buildId);
    
    if (!build) {
        try {
            const dbResult = await pool.query('SELECT status, apk_url FROM app_builds WHERE id = $1', [buildId]);
            if (dbResult.rows.length > 0) {
                const dbBuild = dbResult.rows[0];
                const isRunningButDead = dbBuild.status === 'running';
                const finalStatus = isRunningButDead ? 'failed' : dbBuild.status;
                build = {
                    id: buildId,
                    status: finalStatus,
                    progress: finalStatus === 'success' ? 100 : 0,
                    step: finalStatus === 'success' ? 'Completed' : (isRunningButDead ? 'Interrupted (Server restarted)' : 'Failed'),
                    error: isRunningButDead ? 'Build interrupted because the server restarted.' : (finalStatus === 'failed' ? 'Build failed' : null)
                };
            }
        } catch (dbErr) {
            console.error('Error fetching build status from DB:', dbErr);
        }
    }

    if (!build) {
        return res.status(404).json({ error: 'PWA generation task not found' });
    }
    
    const packageUrl = build.status === 'success' ? `/api/pwa/download/${buildId}` : null;
    res.json({
        buildId: build.id,
        status: build.status,
        progress: build.progress,
        step: build.step,
        error: build.error,
        apkUrl: packageUrl // Keep field name as 'apkUrl' for seamless compatibility with frontend database columns!
    });
});

// GET /api/pwa/status/:buildId (Alias requested by user)
router.get('/status/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    let build = pwaService.getBuildStatus(buildId);
    
    if (!build) {
        try {
            const dbResult = await pool.query('SELECT status, apk_url FROM app_builds WHERE id = $1', [buildId]);
            if (dbResult.rows.length > 0) {
                const dbBuild = dbResult.rows[0];
                const isRunningButDead = dbBuild.status === 'running';
                const finalStatus = isRunningButDead ? 'failed' : dbBuild.status;
                build = {
                    id: buildId,
                    status: finalStatus,
                    progress: finalStatus === 'success' ? 100 : 0,
                    step: finalStatus === 'success' ? 'Completed' : (isRunningButDead ? 'Interrupted (Server restarted)' : 'Failed'),
                    error: isRunningButDead ? 'Build interrupted because the server restarted.' : (finalStatus === 'failed' ? 'Build failed' : null)
                };
            }
        } catch (dbErr) {
            console.error('Error fetching build status from DB:', dbErr);
        }
    }

    if (!build) {
        return res.status(404).json({ error: 'PWA generation task not found' });
    }
    
    const packageUrl = build.status === 'success' ? `/api/pwa/download/${buildId}` : null;
    res.json({
        buildId: build.id,
        status: build.status,
        progress: build.progress,
        step: build.step,
        error: build.error,
        apkUrl: packageUrl
    });
});

// GET /api/pwa/build/logs/:buildId
router.get('/build/logs/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    let logs = pwaService.getBuildLogs(buildId);
    
    if (!logs) {
        try {
            const dbResult = await pool.query('SELECT status FROM app_builds WHERE id = $1', [buildId]);
            if (dbResult.rows.length > 0) {
                const status = dbResult.rows[0].status;
                logs = [
                    `[System] Build status in database: ${status.toUpperCase()}`,
                    `[System] Full compiler trace is unavailable (server restarted).`
                ];
            }
        } catch (dbErr) {
            console.error('Error fetching logs fallback from DB:', dbErr);
        }
    }

    if (!logs) {
        return res.status(404).json({ error: 'Logs not found' });
    }
    res.json({
        buildId: buildId,
        logs: logs
    });
});

// GET /api/pwa/download/:buildId
router.get('/download/:buildId', (req, res) => {
    const buildId = req.params.buildId;
    const format = req.query.format || 'apk';
    const fs = require('fs');
    const path = require('path');
    
    let extension = format === 'aab' ? '.aab' : '.apk';
    let packagePath = path.resolve(__dirname, `../../builds/${buildId}/app-release${extension}`);
    
    // Fallback if the requested format doesn't exist but the other one does
    if (!fs.existsSync(packagePath)) {
        const altExt = extension === '.apk' ? '.aab' : '.apk';
        const altPath = path.resolve(__dirname, `../../builds/${buildId}/app-release${altExt}`);
        if (fs.existsSync(altPath)) {
            packagePath = altPath;
            extension = altExt;
        }
    }
    
    if (!fs.existsSync(packagePath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(404).json({ error: 'Android package is not ready or compilation failed' });
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const build = pwaService.getBuildStatus(buildId);
    const cleanName = (build && build.appName ? build.appName : 'app').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    res.download(packagePath, `${cleanName}${extension}`);
});

module.exports = router;
