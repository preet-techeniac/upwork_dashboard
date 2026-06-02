require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user:     process.env.POSTGRES_USER     ?? 'postgres',
  host:     process.env.POSTGRES_HOST     ?? 'localhost',
  database: process.env.POSTGRES_DB       ?? 'upwork_dashboard',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  port:     Number(process.env.POSTGRES_PORT) || 5432,
});

async function run() {
  try {
    console.log('Running Migrations (JS)...');
    const sqlPath = path.join(__dirname, 'migrate.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Migrations executed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

run();
