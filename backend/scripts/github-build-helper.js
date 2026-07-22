const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Jimp = require('jimp');
const https = require('https');
const http = require('http');

let buildId = process.env.BUILD_ID;
let appName = process.env.APP_NAME || 'My PWA App';
let shortName = process.env.SHORT_NAME || appName;
let themeColor = process.env.THEME_COLOR || '#7c3aed';
let backgroundColor = process.env.BACKGROUND_COLOR || '#ffffff';
let sourceType = process.env.SOURCE_TYPE || 'url';
let htmlContent = process.env.HTML_CONTENT || '';
let iconUrl = process.env.ICON_URL || '';
let websiteUrl = process.env.WEBSITE_URL || '';
let includeBottomNav = false;
let customNavigation = [];

const eventPath = process.env.GITHUB_EVENT_PATH;
if (eventPath && fs.existsSync(eventPath)) {
    try {
        const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
        const payload = eventData.client_payload || {};
        buildId = payload.buildId || buildId;
        const config = payload.config || {};
        appName = config.appName || appName;
        shortName = config.shortName || shortName;
        themeColor = config.themeColor || themeColor;
        backgroundColor = config.backgroundColor || backgroundColor;
        sourceType = config.sourceType || sourceType;
        htmlContent = config.htmlContent || htmlContent;
        iconUrl = config.iconUrl || iconUrl;
        websiteUrl = config.websiteUrl || websiteUrl;
        includeBottomNav = config.includeBottomNav === true || config.includeBottomNav === 'true';
        customNavigation = config.customNavigation || [];
    } catch (err) {
        console.error("Failed to parse GitHub event JSON:", err);
    }
}

const projectRootDir = path.resolve(__dirname, '../..');
const workspaceDir = path.join(projectRootDir, `output/workspace/${buildId}`);
const templateDir = path.join(projectRootDir, 'backend/templates/android-project');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function run() {
    try {
        console.log(`Starting configuration for Build ID: ${buildId}`);
        
        // Create workspace
        if (fs.existsSync(workspaceDir)) {
            fs.rmSync(workspaceDir, { recursive: true, force: true });
        }
        
        console.log(`Copying template files to: ${workspaceDir}`);
        fs.cpSync(templateDir, workspaceDir, {
            recursive: true,
            filter: (src) => {
                const name = path.basename(src);
                return name !== 'build' && name !== '.gradle' && name !== '.cxx';
            }
        });
        
        const wwwDir = path.join(workspaceDir, 'www');
        if (!fs.existsSync(wwwDir)) {
            fs.mkdirSync(wwwDir, { recursive: true });
        }

        // Configure Package Details
        const cleanName = appName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'app';
        const packageName = `com.appweaver.${cleanName}_${buildId.split('_').pop()}`;
        console.log(`App Package ID generated: ${packageName}`);

        let normalizedUrl = websiteUrl;
        if (sourceType !== 'html' && websiteUrl && !websiteUrl.startsWith('http')) {
            normalizedUrl = `https://${websiteUrl}`;
        }

        if (sourceType === 'html') {
            console.log("Packaging local custom HTML content...");
            fs.writeFileSync(path.join(wwwDir, 'index.html'), htmlContent || '<html><body>App Weaver App</body></html>');
        } else {
            console.log(`Setting WebView source URL wrapper: ${normalizedUrl}`);
            fs.writeFileSync(path.join(wwwDir, 'index.html'), `<html><head><meta http-equiv="refresh" content="0;url=${normalizedUrl}"></head><body>Redirecting to ${normalizedUrl}</body></html>`);
        }

        // Update capacitor.config.ts
        const capConfigPath = path.join(workspaceDir, 'capacitor.config.ts');
        let capConfig = fs.readFileSync(capConfigPath, 'utf8');
        capConfig = capConfig.replace(/appId:\s*['"][^'"]+['"]/g, `appId: '${packageName}'`);
        capConfig = capConfig.replace(/appName:\s*['"][^'"]+['"]/g, `appName: '${appName}'`);
        
        if (sourceType !== 'html') {
            capConfig = capConfig.replace(
                /server:\s*\{[^}]*\}/g,
                `server: {
    androidScheme: 'https',
    url: '${normalizedUrl}',
    cleartext: true
  }`
            );
        }
        fs.writeFileSync(capConfigPath, capConfig, 'utf8');
        console.log("Capacitor config customized successfully.");

        // Process custom navigation tabs
        let processedNavigation = [];
        if (includeBottomNav && Array.isArray(customNavigation) && customNavigation.length > 0) {
            for (let i = 0; i < customNavigation.length; i++) {
                const item = customNavigation[i];
                let iconValue = item.icon || 'home';
                
                if (iconValue) {
                    if (iconValue.startsWith('http://') || iconValue.startsWith('https://')) {
                        try {
                            const drawableName = `custom_icon_${i}`;
                            const destPath = path.join(workspaceDir, `android/app/src/main/res/drawable/${drawableName}.png`);
                            console.log(`Downloading custom tab icon ${i} from: ${iconValue}`);
                            await downloadFile(iconValue, destPath);
                            iconValue = drawableName;
                        } catch (err) {
                            console.error(`Failed to download custom tab icon ${i}:`, err);
                            iconValue = 'home';
                        }
                    } else if (iconValue.startsWith('data:image/')) {
                        try {
                            const matches = iconValue.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                            if (matches && matches.length === 3) {
                                const base64Data = matches[2];
                                const buffer = Buffer.from(base64Data, 'base64');
                                const drawableName = `custom_icon_${i}`;
                                const iconPath = path.join(workspaceDir, `android/app/src/main/res/drawable/${drawableName}.png`);
                                fs.writeFileSync(iconPath, buffer);
                                iconValue = drawableName;
                                console.log(`Decoded custom navigation icon for tab ${i}`);
                            }
                        } catch (err) {
                            console.error('Failed to write custom navigation icon:', err);
                            iconValue = 'home';
                        }
                    }
                }
                
                processedNavigation.push({
                    label: item.label || '',
                    url: item.url || '',
                    icon: iconValue
                });
            }
        }

        const navJsonString = processedNavigation.length > 0 
            ? JSON.stringify(processedNavigation)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '\\"')
            : 'none';

        // Monetization parameters from client payload
        let monetization = (payload && payload.config && payload.config.monetization) || {};
        let adsEnabled = false;
        let provider = 'none';
        let appId = '';
        let bannerId = '';
        let interstitialId = '';
        let rewardedId = '';
        let nativeId = '';
        let appOpenId = '';

        if (monetization && monetization.provider !== 'none') {
            adsEnabled = true;
            provider = monetization.provider;
            appId = monetization.app_id || '';
            bannerId = monetization.banner_id || '';
            interstitialId = monetization.interstitial_id || '';
            rewardedId = monetization.rewarded_id || '';
            nativeId = monetization.native_id || '';
            appOpenId = monetization.app_open_id || '';
        }

        // Update strings.xml
        const stringsXmlPath = path.join(workspaceDir, 'android/app/src/main/res/values/strings.xml');
        let stringsXml = fs.readFileSync(stringsXmlPath, 'utf8');
        stringsXml = stringsXml.replace(/<string name="app_name">[^<]+<\/string>/g, `<string name="app_name">${appName}</string>`);
        stringsXml = stringsXml.replace(/<string name="title_activity_main">[^<]+<\/string>/g, `<string name="title_activity_main">${appName}</string>`);
        stringsXml = stringsXml.replace(/<string name="package_name">[^<]+<\/string>/g, `<string name="package_name">${packageName}</string>`);
        stringsXml = stringsXml.replace(/<string name="custom_url_scheme">[^<]+<\/string>/g, `<string name="custom_url_scheme">${packageName}</string>`);
        stringsXml = stringsXml.replace(/<string name="show_bottom_nav">[^<]+<\/string>/g, `<string name="show_bottom_nav">${includeBottomNav ? 'true' : 'false'}</string>`);
        stringsXml = stringsXml.replace(/<string name="custom_navigation_json">[^<]+<\/string>/g, `<string name="custom_navigation_json">${navJsonString}</string>`);
        
        stringsXml = stringsXml.replace('</resources>', `
    <string name="admob_enabled">${adsEnabled}</string>
    <string name="admob_provider">${provider}</string>
    <string name="admob_app_id">${appId}</string>
    <string name="admob_banner_id">${bannerId}</string>
    <string name="admob_interstitial_id">${interstitialId}</string>
    <string name="admob_rewarded_id">${rewardedId}</string>
    <string name="admob_native_id">${nativeId}</string>
    <string name="admob_app_open_id">${appOpenId}</string>
</resources>`);
        fs.writeFileSync(stringsXmlPath, stringsXml, 'utf8');

        // Update AndroidManifest.xml (Inject Application ID if ads enabled)
        if (adsEnabled && appId) {
            const manifestPath = path.join(workspaceDir, 'android/app/src/main/AndroidManifest.xml');
            let manifest = fs.readFileSync(manifestPath, 'utf8');
            manifest = manifest.replace('android:theme="@style/AppTheme">', `android:theme="@style/AppTheme">
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${appId}"/>`);
            fs.writeFileSync(manifestPath, manifest, 'utf8');
        }

        // Update build.gradle
        const buildGradlePath = path.join(workspaceDir, 'android/app/build.gradle');
        let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        buildGradle = buildGradle.replace(/namespace\s+['"][^'"]+['"]/g, `namespace "${packageName}"`);
        buildGradle = buildGradle.replace(/applicationId\s+['"][^'"]+['"]/g, `applicationId "${packageName}"`);
        if (adsEnabled) {
            buildGradle = buildGradle.replace('dependencies {', `dependencies {
    implementation 'com.google.android.gms:play-services-ads:22.6.0'`);
        }
        fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');

        // Move and namespace ALL Java files from com/appweaver/template
        const templateJavaDir = path.join(workspaceDir, 'android/app/src/main/java/com/appweaver/template');
        if (fs.existsSync(templateJavaDir)) {
            const javaPackageDir = path.join(workspaceDir, 'android/app/src/main/java', packageName.replace(/\./g, '/'));
            fs.mkdirSync(javaPackageDir, { recursive: true });
            
            const files = fs.readdirSync(templateJavaDir);
            for (const file of files) {
                if (file.endsWith('.java')) {
                    const srcPath = path.join(templateJavaDir, file);
                    const destPath = path.join(javaPackageDir, file);
                    let content = fs.readFileSync(srcPath, 'utf8');
                    content = content.replace(/package\s+com\.appweaver\.template;/g, `package ${packageName};`);
                    content = content.replace(/import\s+com\.appweaver\.template\./g, `import ${packageName}.`);
                    fs.writeFileSync(destPath, content, 'utf8');
                }
            }
            
            if (packageName !== 'com.appweaver.template') {
                fs.rmSync(templateJavaDir, { recursive: true, force: true });
            }
            console.log(`Relocated and namespaced all Java template files to: ${packageName}`);
        }

        // Generate mipmap launcher icons
        const resDir = path.join(workspaceDir, 'android/app/src/main/res');
        await generateAndroidIcons(iconUrl, appName, themeColor, resDir);

        // Install Capacitor dependencies in the workspace
        console.log("Installing Capacitor CLI and platform libraries in workspace...");
        execSync('npm install', { cwd: workspaceDir, stdio: 'inherit' });

        const buildPlatform = process.env.PLATFORM || 'android';
        if (buildPlatform === 'ios') {
            console.log("Installing @capacitor/ios platform dependency...");
            execSync('npm install @capacitor/ios', { cwd: workspaceDir, stdio: 'inherit' });
        } else {
            // Run Capacitor Sync
            console.log("Syncing web assets into Android project shell...");
            execSync('npx cap sync android', { cwd: workspaceDir, stdio: 'inherit' });
        }
        
        console.log("Configuration completed successfully.");
    } catch (err) {
        console.error("Configuration failed:", err);
        process.exit(1);
    }
}

async function generateAndroidIcons(iconUrl, appName, themeColor, resDir) {
    let baseImage;

    if (iconUrl) {
        console.log(`Processing icon: ${iconUrl.substring(0, 50)}...`);
        const tempIconPath = path.join(projectRootDir, `output/temp_icon_${buildId}.png`);
        const outputDir = path.dirname(tempIconPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        try {
            if (iconUrl.startsWith('data:') && iconUrl.includes(';base64,')) {
                const matches = iconUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                let buffer;
                if (matches && matches.length === 3) {
                    buffer = Buffer.from(matches[2], 'base64');
                } else {
                    buffer = Buffer.from(iconUrl, 'base64');
                }
                baseImage = await Jimp.read(buffer);
                console.log("Icon decoded successfully from Base64.");
            } else {
                await downloadFile(iconUrl, tempIconPath);
                baseImage = await Jimp.read(tempIconPath);
                console.log("Icon downloaded successfully for Android app.");
                fs.unlinkSync(tempIconPath);
            }
        } catch (downloadErr) {
            console.warn(`Failed to process icon: ${downloadErr.message}. Falling back to default generated icon.`);
        }
    }

    if (!baseImage) {
        console.log(`Generating default icon with theme color: ${themeColor || '#7c3aed'}`);
        baseImage = new Jimp(512, 512, themeColor || '#7c3aed');
        try {
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
            const text = appName.substring(0, 2).toUpperCase() || 'AW';
            const textWidth = Jimp.measureText(font, text);
            const textHeight = Jimp.measureTextHeight(font, text, 512);

            const x = (512 - textWidth) / 2;
            const y = (512 - textHeight) / 2;
            baseImage.print(font, x, y, text);
        } catch (fontErr) {
            console.warn(`Font load error: ${fontErr.message}.`);
        }
    }

    const sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    };

    for (const [folder, size] of Object.entries(sizes)) {
        const targetDir = path.join(resDir, folder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const resized = baseImage.clone().resize(size, size);
        await resized.writeAsync(path.join(targetDir, 'ic_launcher.png'));
        await resized.writeAsync(path.join(targetDir, 'ic_launcher_round.png'));
        await resized.writeAsync(path.join(targetDir, 'ic_launcher_foreground.png'));
    }
    console.log("Android launcher icons generated in all resolutions.");
}

run();
