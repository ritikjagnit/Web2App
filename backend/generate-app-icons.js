const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function main() {
    const srcPath = path.join(__dirname, '../public/logo.png');
    const dest192 = path.join(__dirname, '../public/pwa-192x192.png');
    const dest512 = path.join(__dirname, '../public/pwa-512x512.png');

    console.log(`Reading source icon from: ${srcPath}`);
    if (!fs.existsSync(srcPath)) {
        console.error("Source icon public/logo.png does not exist!");
        process.exit(1);
    }

    try {
        const image = await Jimp.read(srcPath);
        
        console.log("Generating 192x192 icon...");
        await image.clone().resize(192, 192).writeAsync(dest192);
        
        console.log("Generating 512x512 icon...");
        await image.clone().resize(512, 512).writeAsync(dest512);

        console.log("Icons generated successfully!");
    } catch (err) {
        console.error("Error generating icons:", err);
        process.exit(1);
    }
}

main();
