import { pool } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    const migrationPath = path.join(__dirname, 'migrate.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
