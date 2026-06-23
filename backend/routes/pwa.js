const express = require('express');
const router = express.Router();
const pwaService = require('../services/pwaService');

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
        android_build_format
    } = req.body;
    
    if (sourceType !== 'html' && !website_url) {
        return res.status(400).json({ error: 'website_url is required when sourceType is not html' });
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
            androidBuildFormat: android_build_format || 'apk'
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

const pool = require('../db/database');
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

// GET /api/pwa/build/status/:buildId
router.get('/build/status/:buildId', (req, res) => {
    const build = pwaService.getBuildStatus(req.params.buildId);
    if (!build) {
        return res.status(404).json({ error: 'PWA generation task not found' });
    }
    
    const packageUrl = build.status === 'success' ? `/api/pwa/download/${req.params.buildId}` : null;
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
router.get('/status/:buildId', (req, res) => {
    const build = pwaService.getBuildStatus(req.params.buildId);
    if (!build) {
        return res.status(404).json({ error: 'PWA generation task not found' });
    }
    
    const packageUrl = build.status === 'success' ? `/api/pwa/download/${req.params.buildId}` : null;
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
router.get('/build/logs/:buildId', (req, res) => {
    const logs = pwaService.getBuildLogs(req.params.buildId);
    if (!logs) {
        return res.status(404).json({ error: 'Logs not found' });
    }
    res.json({
        buildId: req.params.buildId,
        logs: logs
    });
});

// GET /api/pwa/download/:buildId
router.get('/download/:buildId', (req, res) => {
    const build = pwaService.getBuildStatus(req.params.buildId);
    if (!build || build.status !== 'success' || !build.packagePath) {
        return res.status(404).json({ error: 'Android package is not ready or compilation failed' });
    }
    const extension = path.extname(build.packagePath) || '.apk';
    const cleanName = (build.appName || 'app').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    res.download(build.packagePath, `${cleanName}${extension}`);
});

module.exports = router;
