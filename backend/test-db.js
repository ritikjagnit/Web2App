require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testStorage() {
    try {
        console.log('1. Connecting to Neon DB...');
        const client = await pool.connect();
        
        console.log('2. Ensuring tables exist...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS admob_configs (
                user_id TEXT PRIMARY KEY,
                banner_id TEXT,
                interstitial_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('3. Inserting mock data into Neon DB...');
        const mockUserId = 'test_user_' + Date.now();
        const mockBanner = 'ca-app-pub-test-banner';
        
        await client.query(`
            INSERT INTO admob_configs (user_id, banner_id, interstitial_id) 
            VALUES ($1, $2, $3)
        `, [mockUserId, mockBanner, 'ca-app-pub-test-interstitial']);

        console.log('4. Fetching the data back from Neon DB...');
        const result = await client.query('SELECT * FROM admob_configs WHERE user_id = $1', [mockUserId]);
        
        if (result.rows.length > 0) {
            console.log('✅ SUCCESS! Data is successfully storing and retrieving from your Neon database.');
            console.log('Retrieved Row:', result.rows[0]);
            
            // Clean up test data
            console.log('5. Cleaning up test data...');
            await client.query('DELETE FROM admob_configs WHERE user_id = $1', [mockUserId]);
            console.log('✅ Test complete!');
        } else {
            console.log('❌ FAILED: Data was inserted but could not be found.');
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ STORAGE TEST FAILED:');
        console.error(err.message);
        process.exit(1);
    }
}

testStorage();
