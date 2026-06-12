const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to Neon DB using the connection string in .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        require: true,
    },
});

// Initialize tables if they don't exist
const initDb = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to Neon Database successfully');

        await client.query(`
            CREATE TABLE IF NOT EXISTS admob_configs (
                user_id TEXT PRIMARY KEY,
                banner_id TEXT,
                interstitial_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_builds (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                website_url TEXT,
                status TEXT,
                apk_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        client.release();
    } catch (err) {
        console.error('Error connecting or initializing Neon Database:', err);
    }
};

initDb();

module.exports = pool;
