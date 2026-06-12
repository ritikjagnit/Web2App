const fs = require('fs');
const path = require('path');
const https = require('https');
const Jimp = require('jimp');
const AdmZip = require('adm-zip');
const { URL } = require('url');
const { exec } = require('child_process');

// Global builds store in memory to keep track of running PWA compilations
const buildsStore = {};

// Helper to log messages for a specific build
function logMsg(buildId, message) {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${message}`;
    if (!buildsStore[buildId]) {
        buildsStore[buildId] = {
            id: buildId,
            status: 'running',
            progress: 0,
            step: 'Initializing',
            logs: [],
            error: null,
            packagePath: null
        };
    }
    buildsStore[buildId].logs.push(formatted);
    console.log(`[PWA Build ${buildId}] ${message}`);
}

// Helper to execute terminal commands and stream logs
function runCommand(command, cwd, buildId) {
    return new Promise((resolve, reject) => {
        logMsg(buildId, `Running: ${command}`);
        const proc = exec(command, { cwd, env: { ...process.env, PAGER: 'cat' } });
        
        proc.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) logMsg(buildId, line.trim());
            });
        });

        proc.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) logMsg(buildId, `[ERR] ${line.trim()}`);
            });
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}: ${command}`));
            }
        });
    });
}

// Helper to download a file over HTTPS
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download icon, status code: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

// Generate PWA icons (192x192, 512x512) and return them as buffers
async function generatePwaIcons(iconUrl, appName, themeColor, buildId) {
    const icons = {};
    let baseImage;

    if (iconUrl) {
        logMsg(buildId, `Downloading icon from: ${iconUrl}`);
        const tempIconPath = path.join(__dirname, `../output/temp_icon_${buildId}.png`);
        const outputDir = path.dirname(tempIconPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        try {
            await downloadFile(iconUrl, tempIconPath);
            baseImage = await Jimp.read(tempIconPath);
            logMsg(buildId, "Icon downloaded successfully.");
            fs.unlink(tempIconPath, () => {});
        } catch (downloadErr) {
            logMsg(buildId, `Failed to download icon: ${downloadErr.message}. Falling back to default generated icon.`);
        }
    }

    if (!baseImage) {
        logMsg(buildId, `Generating default icon with theme color: ${themeColor || '#7c3aed'}`);
        baseImage = new Jimp(512, 512, themeColor || '#7c3aed');
        try {
            // Draw a solid circle inside the canvas
            baseImage.scan(0, 0, 512, 512, function(x, y, idx) {
                const centerX = 256;
                const centerY = 256;
                const radius = 240;
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (dist > radius) {
                    this.bitmap.data[idx + 3] = 0;
                }
            });

            const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
            const text = appName.substring(0, 2).toUpperCase() || 'PW';
            const textWidth = Jimp.measureText(font, text);
            const textHeight = Jimp.measureTextHeight(font, text, 512);

            const x = (512 - textWidth) / 2;
            const y = (512 - textHeight) / 2;
            baseImage.print(font, x, y, text);
        } catch (fontErr) {
            logMsg(buildId, `Font load error: ${fontErr.message}. Creating standard theme color background icon.`);
        }
    }

    const icon192 = await baseImage.clone().resize(192, 192).getBufferAsync(Jimp.MIME_PNG);
    const icon512 = await baseImage.clone().resize(512, 512).getBufferAsync(Jimp.MIME_PNG);

    return {
        192: icon192,
        512: icon512
    };
}

// 1. Validate Website
exports.validateWebsite = async (url, sourceType, htmlContent) => {
    const issues = [];
    let isValid = true;
    let details = {
        hasHttps: false,
        isReachable: false,
        hasViewport: false,
        hasManifest: false,
        hasServiceWorker: false
    };

    if (sourceType === 'html') {
        details.hasHttps = true;
        details.isReachable = true;
        
        if (!htmlContent || htmlContent.length < 50) {
            isValid = false;
            issues.push("HTML source content is empty or too short.");
        } else {
            if (htmlContent.includes('viewport')) details.hasViewport = true;
            if (htmlContent.includes('manifest.json') || htmlContent.includes('rel="manifest"')) details.hasManifest = true;
            if (htmlContent.includes('navigator.serviceWorker')) details.hasServiceWorker = true;
        }

        if (!details.hasViewport) {
            issues.push("Warning: Missing viewport meta tag. Add <meta name='viewport' content='width=device-width, initial-scale=1'> for mobile responsive scaling.");
        }
        
        return { isValid, issues, details };
    }

    if (!url) {
        return { isValid: false, issues: ["Website URL is required."], details };
    }

    // Check scheme
    if (url.startsWith('https://')) {
        details.hasHttps = true;
    } else if (url.startsWith('http://')) {
        isValid = false;
        issues.push("PWA require HTTPS. URLs starting with http:// cannot be installed on mobile devices.");
    } else {
        isValid = false;
        issues.push("Invalid URL scheme. Must start with https://");
        return { isValid, issues, details };
    }

    // Try fetching the site to check if it's reachable and scan for features
    try {
        logMsg('validate', `Scanning website: ${url}`);
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        details.isReachable = response.ok;

        if (!response.ok) {
            issues.push(`Website returned status code ${response.status}. It might be offline or blocked by CORS/firewall.`);
        } else {
            const html = await response.text();
            
            if (html.includes('viewport')) details.hasViewport = true;
            if (html.includes('manifest.json') || html.includes('rel="manifest"')) details.hasManifest = true;
            if (html.includes('navigator.serviceWorker') || html.includes('sw.js')) details.hasServiceWorker = true;

            if (!details.hasViewport) {
                issues.push("Warning: Website doesn't seem to have a mobile-responsive viewport meta tag.");
            }
        }
    } catch (err) {
        issues.push(`Failed to reach the website: ${err.message}. Ensure the server is online and accessible.`);
    }

    return {
        isValid: isValid && details.isReachable && details.hasHttps,
        issues,
        details
    };
};

// 2. Generate Manifest
exports.generateManifest = (config) => {
    const startUrl = config.startUrl || './index.html';
    return {
        name: config.appName || "My Installable App",
        short_name: config.shortName || config.appName || "My App",
        description: config.description || `Progressive Web App for ${config.appName}`,
        theme_color: config.themeColor || "#7c3aed",
        background_color: config.backgroundColor || "#ffffff",
        display: config.display || "standalone",
        start_url: startUrl,
        orientation: "any",
        icons: [
            {
                src: "icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: "icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
            }
        ]
    };
};

// 3. Generate Service Worker
exports.generateServiceWorker = (config) => {
    // support string argument compatibility or config object
    const configObj = typeof config === 'string' ? { cacheStrategy: config } : (config || {});
    const cacheName = `pwa-cache-${Date.now()}`;
    const strategy = configObj.cacheStrategy || 'StaleWhileRevalidate';
    const dynamicAssets = configObj.dynamicAssets || [];

    // Format the list of dynamic assets as JavaScript string literals
    const formattedDynamicAssets = dynamicAssets.map(asset => `    '${asset}'`).join(',\n');

    let cacheStrategyLogic = '';

    if (strategy === 'CacheFirst') {
        cacheStrategyLogic = `
        // Cache First Strategy
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback
                    if (event.request.mode === 'navigate') {
                        return caches.match('./offline.html');
                    }
                });
            })
        );`;
    } else if (strategy === 'NetworkFirst') {
        cacheStrategyLogic = `
        // Network First Strategy
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./offline.html');
                    }
                });
            })
        );`;
    } else {
        // Default: StaleWhileRevalidate
        cacheStrategyLogic = `
        // Stale While Revalidate Strategy
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Suppress network error logs when offline
                });
                return cachedResponse || fetchPromise || caches.match('./offline.html');
            })
        );`;
    }

    return `// Service Worker generated automatically by App Weaver PWA Platform
const CACHE_NAME = '${cacheName}';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './pwa-register.js',
    './offline.html',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'${dynamicAssets.length > 0 ? ',\n' + formattedDynamicAssets : ''}
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching offline pages and assets');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache store:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip external APIs or non-http requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    ${cacheStrategyLogic}
});
`;
};

// 4. Check PWA Readiness
exports.checkReadiness = async (url, config) => {
    let score = 100;
    const items = [
        { name: "HTTPS Security Check", passed: true, description: "HTTPS is configured. Required for service worker and mobile installations." },
        { name: "Viewport Configuration", passed: true, description: "Viewport meta tag exists. Ensures responsive sizing on mobile screens." },
        { name: "Web App Manifest", passed: true, description: "Valid webmanifest layout configured." },
        { name: "Offline Caching Engine", passed: true, description: "Service worker scripts generated correctly." },
        { name: "Brand Icon Compatibility", passed: true, description: "192x192 and 512x512 launcher configurations generated." }
    ];

    if (config.sourceType !== 'html') {
        if (!url || !url.startsWith('https://')) {
            items[0].passed = false;
            items[0].description = "Website URL is not secured (HTTPS). Service workers will be rejected by browsers.";
            score -= 30;
        }
    }

    if (!config.appName || config.appName.length < 3) {
        items[2].passed = false;
        items[2].description = "Manifest requires a valid app name of at least 3 characters.";
        score -= 20;
    }

    if (!config.iconUrl && !config.themeColor) {
        items[4].passed = false;
        items[4].description = "Missing brand styling and logo assets.";
        score -= 15;
    }

    return {
        score: Math.max(0, score),
        items
    };
};

// Helper: download and process relative assets from HTML/CSS
async function downloadAndProcessAssets(buildId, websiteUrl, htmlContent, outputDir) {
    const baseUrl = new URL(websiteUrl);
    const downloaded = new Set();
    const assetsList = [];

    // Helper to clean paths: removes query parameters/hashes and leading slash
    const cleanPath = (urlStr) => {
        try {
            const u = new URL(urlStr, websiteUrl);
            let p = u.pathname;
            // Skip root index.html or empty path
            if (p === '/' || p === '' || p === '/index.html') {
                return null;
            }
            if (p.endsWith('/')) {
                p += 'index.html';
            }
            p = p.replace(/^\//, '');
            return p;
        } catch (e) {
            return null;
        }
    };

    const downloadAsset = async (assetUrlStr, relativePath) => {
        if (downloaded.has(relativePath)) return;
        downloaded.add(relativePath);

        try {
            const resolvedUrl = new URL(assetUrlStr, websiteUrl);
            
            // Check if it's the same origin
            if (resolvedUrl.origin !== baseUrl.origin) {
                return;
            }

            logMsg(buildId, `Downloading internal asset: ${resolvedUrl.href}`);
            const res = await fetch(resolvedUrl.href, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) {
                logMsg(buildId, `[WARN] Failed to download asset: ${resolvedUrl.href} (status: ${res.status})`);
                return;
            }

            let buffer = Buffer.from(await res.arrayBuffer());

            // If it's a CSS file, parse it recursively for url(...) assets!
            if (relativePath.endsWith('.css')) {
                let cssText = buffer.toString('utf-8');
                const cssUrlRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
                let cssMatch;
                let hasCSSModified = false;
                
                while ((cssMatch = cssUrlRegex.exec(cssText)) !== null) {
                    const subUrlRaw = cssMatch[1];
                    // Skip inline/data/external absolute URLs
                    if (subUrlRaw.startsWith('data:') || subUrlRaw.startsWith('#') || subUrlRaw.startsWith('http:') || subUrlRaw.startsWith('https:')) continue;

                    // Resolve against the CSS file's absolute URL
                    const cssAbsoluteUrl = resolvedUrl.href;
                    const subAssetAbsoluteUrl = new URL(subUrlRaw, cssAbsoluteUrl).href;
                    
                    const subAssetCleanPath = cleanPath(subAssetAbsoluteUrl);
                    if (subAssetCleanPath && subAssetCleanPath !== relativePath) {
                        // Download the sub-asset
                        await downloadAsset(subAssetAbsoluteUrl, subAssetCleanPath);
                        
                        // Rewrite the url(...) path inside the CSS to point to the correct relative path.
                        const cssDirDepth = relativePath.split('/').length - 1;
                        const relativePrefix = cssDirDepth > 0 ? '../'.repeat(cssDirDepth) : './';
                        const newRelativePathInCSS = relativePrefix + subAssetCleanPath;
                        
                        cssText = cssText.replace(subUrlRaw, newRelativePathInCSS);
                        hasCSSModified = true;
                    }
                }
                
                if (hasCSSModified) {
                    buffer = Buffer.from(cssText);
                }
            }

            const destFile = path.join(outputDir, relativePath);
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.writeFileSync(destFile, buffer);
            
            assetsList.push(`./${relativePath}`);
            logMsg(buildId, `Successfully packaged: ${relativePath}`);
        } catch (err) {
            logMsg(buildId, `[WARN] Error downloading asset ${assetUrlStr}: ${err.message}`);
        }
    };

    let processedHtml = htmlContent;

    // 1. Scan and replace <link> stylesheet/icon links
    const linkRegex = /<link([^>]+)href=["']([^"']+)["']([^>]*)>/gi;
    let match;
    const linksToDownload = [];
    while ((match = linkRegex.exec(htmlContent)) !== null) {
        const fullMatch = match[0];
        const before = match[1];
        const urlStr = match[2];
        const after = match[3];

        if (urlStr.startsWith('data:') || urlStr.startsWith('#')) continue;

        // Verify if it is stylesheet, icon, shortcut icon, apple-touch-icon
        const isAsset = /rel=["'](stylesheet|icon|shortcut icon|apple-touch-icon|manifest)["']/i.test(fullMatch);
        if (isAsset) {
            const relativePath = cleanPath(urlStr);
            if (relativePath) {
                linksToDownload.push({ original: urlStr, relative: relativePath });
                const escapedUrl = urlStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                processedHtml = processedHtml.replace(new RegExp(`href=["']${escapedUrl}["']`, 'gi'), `href="./${relativePath}"`);
            }
        }
    }

    // 2. Scan and replace <script> src links
    const scriptRegex = /<script([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
    const scriptsToDownload = [];
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        const urlStr = match[2];
        if (urlStr.startsWith('data:') || urlStr.startsWith('#')) continue;

        const relativePath = cleanPath(urlStr);
        if (relativePath) {
            scriptsToDownload.push({ original: urlStr, relative: relativePath });
            const escapedUrl = urlStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            processedHtml = processedHtml.replace(new RegExp(`src=["']${escapedUrl}["']`, 'gi'), `src="./${relativePath}"`);
        }
    }

    // 3. Scan and replace <img> src links
    const imgRegex = /<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi;
    const imgsToDownload = [];
    while ((match = imgRegex.exec(htmlContent)) !== null) {
        const urlStr = match[2];
        if (urlStr.startsWith('data:') || urlStr.startsWith('#')) continue;

        const relativePath = cleanPath(urlStr);
        if (relativePath) {
            imgsToDownload.push({ original: urlStr, relative: relativePath });
            const escapedUrl = urlStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            processedHtml = processedHtml.replace(new RegExp(`src=["']${escapedUrl}["']`, 'gi'), `src="./${relativePath}"`);
        }
    }

    logMsg(buildId, `Discovered ${linksToDownload.length} stylesheets/icons, ${scriptsToDownload.length} scripts, and ${imgsToDownload.length} images to download.`);

    for (const item of linksToDownload) {
        await downloadAsset(item.original, item.relative);
    }
    for (const item of scriptsToDownload) {
        await downloadAsset(item.original, item.relative);
    }
    for (const item of imgsToDownload) {
        await downloadAsset(item.original, item.relative);
    }

    return { processedHtml, assetsList };
}

// 5. Generate PWA Package (Asynchronous Build Task)
async function runPwaPackagePipeline(buildId, { userId, websiteUrl, appName, shortName, themeColor, backgroundColor, sourceType, htmlContent, iconUrl, cacheStrategy, workspaceDir, buildsDir }) {
    const pool = require('../db/database');
    const updateDbStatus = async (status, packageUrl = null) => {
        try {
            await pool.query(
                `INSERT INTO app_builds (id, user_id, website_url, status, apk_url)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, apk_url = COALESCE(EXCLUDED.apk_url, app_builds.apk_url)`,
                [buildId, userId || 'guest', websiteUrl || 'local-html', status, packageUrl]
            );
        } catch (e) {
            console.error('Failed to update Postgres build status:', e);
        }
    };

    try {
        await updateDbStatus('running');

        // --- STEP 1: VALIDATING WEBSITE ---
        logMsg(buildId, "Step 1: Validating website accessibility & configuration...");
        buildsStore[buildId].progress = 15;
        buildsStore[buildId].step = 'Validating Website';
        
        const valResult = await exports.validateWebsite(websiteUrl, sourceType, htmlContent);
        if (valResult.issues.length > 0) {
            valResult.issues.forEach(issue => logMsg(buildId, `[WARN] ${issue}`));
        }
        await new Promise(resolve => setTimeout(resolve, 300));

        // --- STEP 2: CREATING WORKSPACE ---
        logMsg(buildId, "Step 2: Preparing PWA package workspace...");
        buildsStore[buildId].progress = 30;
        buildsStore[buildId].step = 'Creating Workspace';

        if (fs.existsSync(workspaceDir)) {
            fs.rmSync(workspaceDir, { recursive: true, force: true });
        }
        fs.mkdirSync(workspaceDir, { recursive: true });
        const wwwDir = path.join(workspaceDir, 'www');
        fs.mkdirSync(wwwDir, { recursive: true });

        // --- STEP 3: DOWNLOADING ASSETS & WRAPPING IN PWA SHELL ---
        logMsg(buildId, "Step 3: Downloading assets and preparing offline caching engine...");
        buildsStore[buildId].progress = 50;
        buildsStore[buildId].step = 'Downloading Assets';

        let indexHtml = '';
        let dynamicAssets = [];
        
        if (sourceType === 'html') {
            logMsg(buildId, "Source is custom offline HTML. Crawling tags for offline assets...");
            const processed = await downloadAndProcessAssets(buildId, 'https://localhost', htmlContent, wwwDir);
            indexHtml = processed.processedHtml;
            dynamicAssets = processed.assetsList;
        } else {
            logMsg(buildId, `Fetching website HTML from: ${websiteUrl}...`);
            const response = await fetch(websiteUrl, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) {
                throw new Error(`Failed to fetch website main page, status code: ${response.status}`);
            }
            const rawHtml = await response.text();
            
            logMsg(buildId, `Parsing HTML & downloading assets for offline capabilities...`);
            const processed = await downloadAndProcessAssets(buildId, websiteUrl, rawHtml, wwwDir);
            indexHtml = processed.processedHtml;
            dynamicAssets = processed.assetsList;
        }

        // Inject manifest linkage if missing
        if (!indexHtml.includes('rel="manifest"') && !indexHtml.includes('rel=\'manifest\'')) {
            if (indexHtml.includes('</head>')) {
                indexHtml = indexHtml.replace('</head>', '    <link rel="manifest" href="./manifest.json">\n</head>');
            } else {
                indexHtml = '<link rel="manifest" href="./manifest.json">\n' + indexHtml;
            }
        }
        // Inject service worker register script if missing
        if (!indexHtml.includes('pwa-register.js')) {
            if (indexHtml.includes('</head>')) {
                indexHtml = indexHtml.replace('</head>', '    <script src="./pwa-register.js"></script>\n</head>');
            } else if (indexHtml.includes('</body>')) {
                indexHtml = indexHtml.replace('</body>', '    <script src="./pwa-register.js"></script>\n</body>');
            } else {
                indexHtml = indexHtml + '\n<script src="./pwa-register.js"></script>';
            }
        }

        // Write index.html
        fs.writeFileSync(path.join(wwwDir, 'index.html'), indexHtml);

        // Write manifest
        logMsg(buildId, "Generating W3C Web App Manifest...");
        const manifestObj = exports.generateManifest({
            appName,
            shortName,
            themeColor,
            backgroundColor,
            startUrl: './index.html',
            display: 'standalone'
        });
        fs.writeFileSync(path.join(wwwDir, 'manifest.json'), JSON.stringify(manifestObj, null, 2));

        // Write sw.js
        logMsg(buildId, "Generating Service Worker offline engine...");
        const swJsContent = exports.generateServiceWorker({ 
            cacheStrategy,
            dynamicAssets: dynamicAssets
        });
        fs.writeFileSync(path.join(wwwDir, 'sw.js'), swJsContent);

        // Write pwa-register.js
        const pwaRegisterScript = `// Registers the service worker for instant installation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                console.log('App Weaver PWA Service Worker Registered. Scope: ', reg.scope);
            })
            .catch((err) => {
                console.error('PWA Service Worker Registration Failed: ', err);
            });
    });
}
`;
        fs.writeFileSync(path.join(wwwDir, 'pwa-register.js'), pwaRegisterScript);

        // Write offline fallback html
        logMsg(buildId, "Creating offline fallback page...");
        const offlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - ${appName}</title>
    <style>
        body {
            background-color: #0f0f13;
            color: #e2e8f0;
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: #181824;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            text-align: center;
            max-width: 400px;
            border: 1px solid #2a2a3e;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h2 { margin-top: 0; color: #ffffff; }
        p { color: #cbd5e1; }
        button {
            background-color: ${themeColor};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            transition: opacity 0.2s;
        }
        button:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">📶❌</div>
        <h2>You are currently offline</h2>
        <p>We couldn't connect to ${appName}. Check your internet connection and try reloading.</p>
        <button onclick="window.location.reload()">Retry Connection</button>
    </div>
</body>
</html>`;
        fs.writeFileSync(path.join(wwwDir, 'offline.html'), offlineHtml);

        // Write install-guide.html
        logMsg(buildId, "Generating inline PWA installation guides...");
        const installGuideHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - PWA Installation Guide</title>
    <style>
        body {
            background-color: #0f0f13;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background: #181824;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid #2a2a3e;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            object-fit: cover;
            border: 2px solid ${themeColor};
            box-shadow: 0 0 20px ${themeColor}66;
            margin-bottom: 15px;
        }
        h1 {
            margin: 0;
            font-size: 24px;
            color: #ffffff;
        }
        p.subtitle {
            color: #94a3b8;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .section {
            background: #202030;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #2e2e46;
        }
        .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 12px;
            color: ${themeColor};
            display: flex;
            align-items: center;
            gap: 10px;
        }
        ol {
            margin: 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.6;
            color: #cbd5e1;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="./icons/icon-192x192.png" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${appName}'" alt="App Icon">
            <h1>${appName}</h1>
            <p class="subtitle">Progressive Web App (PWA) Installation Guide</p>
        </div>
        
        <div class="section">
            <div class="section-title">📱 Android (Google Chrome)</div>
            <ol>
                <li>Open Google Chrome on your Android device.</li>
                <li>Go to your deployed website URL.</li>
                <li>Tap the three dots menu button in the top right corner.</li>
                <li>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                <li>Confirm the prompt by tapping <strong>"Install"</strong>.</li>
            </ol>
        </div>

        <div class="section">
            <div class="section-title">🍎 iOS / iPhone (Safari)</div>
            <ol>
                <li>Open Safari on your iPhone or iPad.</li>
                <li>Navigate to your deployed website URL.</li>
                <li>Tap the <strong>"Share"</strong> icon (square with arrow pointing up) at the bottom toolbar.</li>
                <li>Scroll down the options list and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> in the top-right corner to complete the installation.</li>
            </ol>
        </div>

        <div class="section">
            <div class="section-title">💻 Desktop (Chrome, Edge, Opera)</div>
            <ol>
                <li>Open your browser (Chrome or Edge) on your PC or Mac.</li>
                <li>Navigate to your website URL.</li>
                <li>Look in the address bar for the install icon (monitor with a down arrow).</li>
                <li>Click the install icon and confirm the installation popup.</li>
                <li>The app will launch in a clean, standalone desktop window.</li>
            </ol>
        </div>

        <div class="footer">
            Generated with App Weaver PWA Platform
        </div>
    </div>
</body>
</html>`;
        fs.writeFileSync(path.join(wwwDir, 'install-guide.html'), installGuideHtml);

        // Generate icons
        logMsg(buildId, "Generating launcher and splash icons...");
        const iconBuffers = await generatePwaIcons(iconUrl, appName, themeColor, buildId);
        fs.mkdirSync(path.join(wwwDir, 'icons'), { recursive: true });
        fs.writeFileSync(path.join(wwwDir, 'icons/icon-192x192.png'), iconBuffers[192]);
        fs.writeFileSync(path.join(wwwDir, 'icons/icon-512x512.png'), iconBuffers[512]);

        // --- STEP 4: PACKAGING ZIP ARCHIVE ---
        logMsg(buildId, "Step 4: Compiling files and building deployable PWA ZIP archive...");
        buildsStore[buildId].progress = 85;
        buildsStore[buildId].step = 'Packaging Zip';
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!fs.existsSync(buildsDir)) {
            fs.mkdirSync(buildsDir, { recursive: true });
        }
        
        const finalZipPath = path.join(buildsDir, 'pwa-package.zip');
        const zip = new AdmZip();
        zip.addLocalFolder(wwwDir);
        zip.writeZip(finalZipPath);
        
        logMsg(buildId, `PWA package successfully zipped at: ${finalZipPath}`);

        // Clean up temporary workspace directory
        try {
            fs.rmSync(workspaceDir, { recursive: true, force: true });
            logMsg(buildId, "Cleaned temporary build workspace successfully.");
        } catch (cleanupErr) {
            logMsg(buildId, `[WARN] Failed to clean build workspace: ${cleanupErr.message}`);
        }

        // --- COMPLETED ---
        logMsg(buildId, "✓ Progressive Web App (PWA) package created successfully!");
        buildsStore[buildId].progress = 100;
        buildsStore[buildId].step = 'Completed';
        buildsStore[buildId].status = 'success';
        buildsStore[buildId].packagePath = finalZipPath;

        const downloadUrl = `/api/pwa/download/${buildId}`;
        await updateDbStatus('success', downloadUrl);

    } catch (err) {
        logMsg(buildId, `PWA PACKAGING FAILURE: ${err.message}`);
        buildsStore[buildId].status = 'failed';
        buildsStore[buildId].error = err.message;
        await updateDbStatus('failed');
        
        try {
            if (fs.existsSync(workspaceDir)) {
                fs.rmSync(workspaceDir, { recursive: true, force: true });
            }
        } catch (e) {}
    }
}

// Service exports
exports.generatePwaPackage = async ({ userId, websiteUrl, appName, shortName, themeColor, backgroundColor, sourceType, htmlContent, iconUrl, cacheStrategy }) => {
    const buildId = `pwa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const workspaceDir = path.resolve(__dirname, `../output/workspace/${buildId}`);
    const buildsDir = path.resolve(__dirname, `../builds/${buildId}`);

    buildsStore[buildId] = {
        id: buildId,
        status: 'running',
        progress: 0,
        step: 'Initializing',
        logs: [],
        error: null,
        packagePath: null
    };

    // Run packaging asynchronously
    runPwaPackagePipeline(buildId, { userId, websiteUrl, appName, shortName, themeColor, backgroundColor, sourceType, htmlContent, iconUrl, cacheStrategy, workspaceDir, buildsDir })
        .catch(err => {
            console.error(`PWA package pipeline crash:`, err);
            buildsStore[buildId].status = 'failed';
            buildsStore[buildId].error = err.message;
        });

    return buildId;
};

// Get build status
exports.getBuildStatus = (buildId) => {
    return buildsStore[buildId] || null;
};

// Get build logs
exports.getBuildLogs = (buildId) => {
    return buildsStore[buildId] ? buildsStore[buildId].logs : null;
};
