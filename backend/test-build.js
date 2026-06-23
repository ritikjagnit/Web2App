const fetch = require('node-fetch'); // Wait, node-fetch might not be installed, but we can use native fetch since we are on Node 22!

async function runTest() {
    console.log("Triggering test build via backend server on port 5000...");
    const response = await fetch('http://localhost:5000/api/pwa/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 'test_agent',
            website_url: 'https://google.com',
            app_name: 'Test Google App',
            short_name: 'GoogleApp',
            theme_color: '#4285F4',
            background_color: '#ffffff',
            sourceType: 'url',
            iconUrl: ''
        })
    });

    if (!response.ok) {
        console.error("Failed to start build", await response.text());
        return;
    }

    const { buildId } = await response.json();
    console.log(`Build successfully started! Build ID: ${buildId}`);

    let status = 'running';
    while (status === 'running') {
        await new Promise(r => setTimeout(r, 4000));
        const statusRes = await fetch(`http://localhost:5000/api/pwa/build/status/${buildId}`);
        const data = await statusRes.json();
        status = data.status;
        console.log(`[Status Update] Step: ${data.step} | Progress: ${data.progress}% | Status: ${data.status}`);

        if (status === 'success') {
            console.log("\n=== BUILD SUCCESSFUL ===");
            console.log(`Download URL: http://localhost:5000${data.apkUrl}`);
            break;
        } else if (status === 'failed') {
            console.error("\n=== BUILD FAILED ===");
            console.error(`Error: ${data.error}`);
            const logsRes = await fetch(`http://localhost:5000/api/pwa/build/logs/${buildId}`);
            const logsData = await logsRes.json();
            console.log("\nCompilation Logs:");
            console.log(logsData.logs.join('\n'));
            break;
        }
    }
}

runTest().catch(console.error);
