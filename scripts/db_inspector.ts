import { pool } from '../lib/db';

async function inspect() {
  try {
    console.log('Inspecting Database...');
    
    // 1. Get all tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tablesRes.rows.map(r => r.table_name));

    // 2. Get columns of bids
    const bidsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bids'
    `);
    console.log('\nbids Columns:');
    bidsCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    // 3. Get columns of earnings
    const earningsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'earnings'
    `);
    console.log('\nearnings Columns:');
    earningsCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    // 4. Get distinct statuses in bids
    const statuses = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM bids 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('\nDistinct statuses in bids:');
    statuses.rows.forEach(r => console.log(`  - "${r.status}": ${r.count}`));

    // 5. Check if there are any connects/viewed/in-conversation details
    const connectsCount = await pool.query(`
      SELECT COUNT(*) as count, SUM(CAST(NULLIF(regexp_replace(connects, '[^0-9]', '', 'g'), '') AS integer)) AS total
      FROM bids
    `);
    console.log('\nConnects summary:');
    console.log(`  - Total rows: ${connectsCount.rows[0].count}`);
    console.log(`  - Total connects used: ${connectsCount.rows[0].total}`);

  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await pool.end();
  }
}

inspect();
