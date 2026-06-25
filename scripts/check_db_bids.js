require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function main() {
  try {
    const totalCountRes = await pool.query('SELECT COUNT(*) FROM bids');
    console.log(`Total bids in DB: ${totalCountRes.rows[0].count}`);

    const sampleBids = await pool.query('SELECT id, application_date, job_url, found_by FROM bids ORDER BY application_date DESC LIMIT 5');
    console.log('\nLast 5 bids in DB:');
    console.log(sampleBids.rows);

    const monthDistribution = await pool.query(`
      SELECT 
        TO_CHAR(application_date, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM bids
      GROUP BY month
      ORDER BY month DESC
    `);
    console.log('\nBid distribution by month in DB:');
    console.log(monthDistribution.rows);

  } catch (error) {
    console.error('Error checking DB:', error);
  } finally {
    await pool.end();
  }
}

main();
