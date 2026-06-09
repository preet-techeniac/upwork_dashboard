require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Adjust based on your .env or defaults
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

async function run() {
  try {
    // Drop existing table
    await pool.query('DROP TABLE IF EXISTS earnings CASCADE');
    await pool.query('DROP TABLE IF EXISTS bids CASCADE');

    console.log('Dropped old bids and earnings tables.');

    // Create new bids table
    await pool.query(`
      CREATE TABLE bids (
        id SERIAL PRIMARY KEY,
        application_date DATE,
        job_url TEXT,
        found_by VARCHAR(100),
        cv_used TEXT,
        proposal_used TEXT,
        status VARCHAR(100),
        hires VARCHAR(50),
        interviewing VARCHAR(50),
        country VARCHAR(100),
        connects VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created new bids table.');

    // Read CSV files
    const csvDir = 'C:\\Users\\teche\\Downloads';
    const files = fs.readdirSync(csvDir).filter(f => f.startsWith('Upwork Data') && f.endsWith('.csv'));
    
    for (const file of files) {
      console.log(`Processing file: ${file}`);
      const filePath = path.join(csvDir, file);
      
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            // Check if it's the bottom section, ignore if "Total connects used" or similar
            if (data['Application Date'] && !data['Application Date'].includes('Total connects') && !data['Application Date'].match(/^\d+$/)) {
              // Ensure it's a valid row
              if (data['Job Url'] && data['Job Url'].includes('upwork.com')) {
                rows.push(data);
              }
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      console.log(`Found ${rows.length} rows in ${file}. Inserting...`);

      for (const row of rows) {
        // Parse date. CSV has format D/M/YYYY or D/M/YY or DD/MM/YYYY
        let dateStr = row['Application Date'];
        let sqlDate = null;
        if (dateStr) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let year = parts[2];
            if (year.length === 2) {
              year = '20' + year;
            }
            // JS expects YYYY-MM-DD
            sqlDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        await pool.query(`
          INSERT INTO bids (
            application_date, job_url, found_by, cv_used, proposal_used, 
            status, hires, interviewing, country, connects
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          sqlDate,
          row['Job Url'],
          row['Found By'],
          row['CV Used'],
          row['Proposal used'],
          row['Status'],
          row['Hires'],
          row['Interviewing'],
          row['Country'],
          row['Connects']
        ]);
      }
    }

    console.log('Data import complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

run();
