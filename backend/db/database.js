const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool;
let useSqlite = false;
let sqliteDb = null;

const initDb = async () => {
    // Try connecting to Postgres/Neon first if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
        try {
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                },
                connectionTimeoutMillis: 5000 // 5 seconds timeout
            });

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

            await client.query(`
                CREATE TABLE IF NOT EXISTS profiles (
                    id TEXT PRIMARY KEY,
                    email TEXT,
                    plan TEXT DEFAULT 'free',
                    api_key TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            client.release();
            return;
        } catch (err) {
            console.warn('Neon Database connection failed. Falling back to local SQLite database...', err.message);
        }
    } else {
        console.warn('DATABASE_URL not found. Falling back to local SQLite database...');
    }

    // Setup SQLite fallback
    useSqlite = true;
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'local_fallback.db');
    
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Failed to open local SQLite fallback database:', err.message);
        } else {
            console.log('Opened local SQLite fallback database at:', dbPath);
        }
    });

    // Initialize SQLite tables
    sqliteDb.serialize(() => {
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS admob_configs (
                user_id TEXT PRIMARY KEY,
                banner_id TEXT,
                interstitial_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS app_builds (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                website_url TEXT,
                status TEXT,
                apk_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                email TEXT,
                plan TEXT DEFAULT 'free',
                api_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });
};

initDb();

// Export a unified query interface that mimics the pg pool interface
module.exports = {
    query: (sql, params = []) => {
        if (!useSqlite && pool) {
            return pool.query(sql, params);
        } else if (sqliteDb) {
            return new Promise((resolve, reject) => {
                // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
                const sqliteSql = sql.replace(/\$\d+/g, '?');
                
                if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
                    sqliteDb.all(sqliteSql, params, (err, rows) => {
                        if (err) {
                            console.error('SQLite query error:', err);
                            reject(err);
                        } else {
                            resolve({ rows });
                        }
                    });
                } else {
                    sqliteDb.run(sqliteSql, params, function (err) {
                        if (err) {
                            console.error('SQLite exec error:', err);
                            reject(err);
                        } else {
                            resolve({ rows: [], lastID: this.lastID, changes: this.changes });
                        }
                    });
                }
            });
        } else {
            return Promise.reject(new Error('Database is not initialized'));
        }
    }
};
