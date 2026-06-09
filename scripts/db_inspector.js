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
    console.log('Querying Converted Jobs (status ILIKE "%client%")...');
    
    const res = await pool.query(`
      SELECT id, application_date, job_url, status 
      FROM bids 
      WHERE status ILIKE '%client%'
    `);
    
    console.log('\nConverted Jobs Result:');
    res.rows.forEach((r, idx) => {
      console.log(`${idx + 1}. ID: ${r.id}`);
      console.log(`   Date: ${r.application_date ? r.application_date.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`   Status: "${r.status}"`);
      console.log(`   URL: ${r.job_url}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await pool.end();
  }
}

inspect();
