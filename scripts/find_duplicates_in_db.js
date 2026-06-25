require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function main() {
  try {
    const dupRes = await pool.query(`
      SELECT job_url, COUNT(*) as count 
      FROM bids 
      WHERE job_url IS NOT NULL AND job_url != ''
      GROUP BY job_url 
      HAVING COUNT(*) > 1
    `);
    console.log(`Number of duplicate job_urls currently in DB: ${dupRes.rows.length}`);
    if (dupRes.rows.length > 0) {
      console.log('Sample duplicates:', dupRes.rows.slice(0, 5));
    }

    // Let's check how many total non-null job URLs there are
    const nullUrlRes = await pool.query(`
      SELECT COUNT(*) as count, COUNT(job_url) as non_null_count 
      FROM bids
    `);
    console.log(`Total bids: ${nullUrlRes.rows[0].count}, Non-null job URLs: ${nullUrlRes.rows[0].non_null_count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
