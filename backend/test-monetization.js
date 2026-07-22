const pool = require('./db/database');

async function testMonetization() {
    console.log("Starting Monetization Database and API unit verification tests...");

    // Test data
    const projectId = "test-project-123";
    const userId = "test-user-abc";

    try {
        // 1. Clean existing test data
        await pool.query("DELETE FROM monetization WHERE project_id = $1", [projectId]);
        console.log("✓ Cleared old test monetization entries.");

        // 2. Insert new monetization configuration
        const insertQuery = `
            INSERT INTO monetization (
                id, user_id, project_id, provider, app_id, 
                banner_id, interstitial_id, ads_enabled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const testParams = [
            "test-mon-uuid",
            userId,
            projectId,
            "admob",
            "ca-app-pub-3940256099942544~3347511713",
            "ca-app-pub-3940256099942544/6300978111",
            "ca-app-pub-3940256099942544/1033173712",
            true
        ];
        
        await pool.query(insertQuery, testParams);
        console.log("✓ Successfully saved AdMob monetization config to local db.");

        // 3. Query settings
        const res = await pool.query("SELECT * FROM monetization WHERE project_id = $1", [projectId]);
        if (res.rows.length === 0) {
            throw new Error("Query test failed: entry not found!");
        }
        
        const row = res.rows[0];
        console.log("✓ Successfully fetched saved monetization configurations:");
        console.log(`  - Provider: ${row.provider}`);
        console.log(`  - App ID: ${row.app_id}`);
        console.log(`  - Banner Unit: ${row.banner_id}`);
        console.log(`  - Interstitial Unit: ${row.interstitial_id}`);
        console.log(`  - Ads Enabled: ${row.ads_enabled}`);

        // 4. Update
        await pool.query(
            "UPDATE monetization SET ads_enabled = $1 WHERE project_id = $2",
            [false, projectId]
        );
        const updateRes = await pool.query("SELECT ads_enabled FROM monetization WHERE project_id = $1", [projectId]);
        if (updateRes.rows[0].ads_enabled) {
            throw new Error("Update test failed: ads_enabled was not updated to false!");
        }
        console.log("✓ Successfully updated/disabled monetization settings.");

        // Clean up
        await pool.query("DELETE FROM monetization WHERE project_id = $1", [projectId]);
        console.log("✓ Cleaned up test data.");
        console.log("\nALL TESTS PASSED SUCCESSFULLY! Database integrations are fully correct.");
    } catch (e) {
        console.error("Test failed: ", e.message);
        process.exit(1);
    }
}

testMonetization().then(() => process.exit(0));
