require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      user:     process.env.POSTGRES_USER     ?? 'postgres',
      host:     process.env.POSTGRES_HOST     ?? 'localhost',
      database: process.env.POSTGRES_DB       ?? 'upwork_dashboard',
      password: process.env.POSTGRES_PASSWORD ?? 'postgres',
      port:     Number(process.env.POSTGRES_PORT) || 5432,
    });

async function inspect() {
  try {
    console.log('Querying distinct found_by values in bids...');
    
    const res = await pool.query(`
      SELECT found_by, COUNT(*) as count 
      FROM bids 
      GROUP BY found_by 
      ORDER BY count DESC
    `);
    
    console.log('\nDistinct found_by values:');
    res.rows.forEach(r => {
      console.log(`  - "${r.found_by}": ${r.count}`);
    });

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await pool.end();
  }
}

inspect();
