const pool = require('./db/database');

async function main() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('Tables in public schema:', res.rows.map(r => r.table_name));
        process.exit(0);
    } catch (err) {
        console.error('Error listing tables:', err);
        process.exit(1);
    }
}
main();
