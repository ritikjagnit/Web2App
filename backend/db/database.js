const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool;
let useSqlite = false;
let sqliteDb = null;

const initSqlite = () => {
    if (sqliteDb) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        useSqlite = true;
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.resolve(__dirname, '../../local_fallback.db');
        
        sqliteDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Failed to open local SQLite fallback database:', err.message);
                reject(err);
            } else {
                console.log('Opened local SQLite fallback database at:', dbPath);
                
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
                    resolve();
                });
            }
        });
    });
};

const initDb = async () => {
    // Try connecting to Postgres/Neon first if DATABASE_URL is set and not the placeholder
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'your_database_url_here') {
        try {
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                },
                connectionTimeoutMillis: 30000 // 30 seconds timeout to allow Neon database to wake up
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
        console.warn('DATABASE_URL not found or set to default placeholder. Falling back to local SQLite database...');
    }

    await initSqlite();
};

const dbInitPromise = initDb();

// Export a unified query interface that mimics the pg pool interface
module.exports = {
    query: async (sql, params = []) => {
        await dbInitPromise;
        if (!useSqlite && pool) {
            try {
                return await pool.query(sql, params);
            } catch (err) {
                const isNetworkError = 
                    err.code === 'ETIMEDOUT' || 
                    err.code === 'ECONNREFUSED' || 
                    err.code === 'ENETUNREACH' ||
                    err.code === 'EPIPE' ||
                    err.code === 'ENOTFOUND' ||
                    err.code === 'EAI_AGAIN' ||
                    err.message.includes('timeout') ||
                    err.message.includes('connection') ||
                    err.message.includes('ENOTFOUND');

                if (isNetworkError) {
                    console.warn('Postgres connection failed during query. Falling back to local SQLite dynamically...', err.message);
                    await initSqlite();
                } else {
                    throw err;
                }
            }
        }

        if (sqliteDb) {
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
            throw new Error('Database is not initialized');
        }
    }
};
