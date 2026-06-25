require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

const csvDir = 'C:\\Users\\teche\\Downloads';
const files = [
  'Upwork Data(May, 2026) (1).csv',
  'Upwork Data(June, 2026).csv'
];

async function parseCSV(filePath) {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Only keep rows that have an application date and a valid job url
        const dateStr = data['Application Date'];
        const jobUrl = data['Job Url'];
        
        if (dateStr && !dateStr.includes('Total connects') && !dateStr.match(/^\d+$/)) {
          if (jobUrl && jobUrl.includes('upwork.com')) {
            rows.push(data);
          }
        }
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let year = parts[2].trim();
    if (year.length === 2) {
      year = '20' + year;
    }
    const month = parts[1].trim().padStart(2, '0');
    const day = parts[0].trim().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

async function run() {
  try {
    console.log('Starting May and June CSV import...');
    
    // Fetch all existing job URLs from database for fast lookups
    const existingRes = await pool.query('SELECT job_url FROM bids WHERE job_url IS NOT NULL');
    const existingUrls = new Set(existingRes.rows.map(r => r.job_url.trim().toLowerCase()));
    console.log(`Loaded ${existingUrls.size} existing job URLs from the database.`);

    let totalProcessed = 0;
    let totalInserted = 0;
    let totalDuplicates = 0;

    for (const file of files) {
      const filePath = path.join(csvDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      console.log(`\nProcessing file: ${file}`);
      const rows = await parseCSV(filePath);
      console.log(`Found ${rows.length} valid rows in ${file}`);

      for (const row of rows) {
        totalProcessed++;
        const jobUrl = row['Job Url'].trim();
        const normalizedUrl = jobUrl.toLowerCase();

        if (existingUrls.has(normalizedUrl)) {
          totalDuplicates++;
          // Optional: log duplicates or skip
          // console.log(`[Duplicate] Skipped URL: ${jobUrl}`);
          continue;
        }

        // Parse date
        const sqlDate = formatDate(row['Application Date']);
        if (!sqlDate) {
          console.warn(`[Invalid Date] Row skipped because date format was invalid: ${row['Application Date']}`);
          continue;
        }

        // Insert new bid
        await pool.query(`
          INSERT INTO bids (
            application_date, job_url, found_by, cv_used, proposal_used, 
            status, hires, interviewing, country, connects
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          sqlDate,
          jobUrl,
          row['Found By'] ? row['Found By'].trim() : null,
          row['CV Used'] ? row['CV Used'].trim() : null,
          row['Proposal used'] ? row['Proposal used'].trim() : null,
          row['Status'] ? row['Status'].trim() : null,
          row['Hires'] ? row['Hires'].trim() : null,
          row['Interviewing'] ? row['Interviewing'].trim() : null,
          row['Country'] ? row['Country'].trim() : null,
          row['Connects'] ? row['Connects'].trim() : null
        ]);

        // Add to set to prevent duplicating within the same run/files
        existingUrls.add(normalizedUrl);
        totalInserted++;
      }
    }

    console.log('\n=========================================');
    console.log(`Import finished!`);
    console.log(`Total rows processed from CSVs: ${totalProcessed}`);
    console.log(`Total duplicates skipped: ${totalDuplicates}`);
    console.log(`Total new entries inserted: ${totalInserted}`);
    console.log('=========================================');

  } catch (error) {
    console.error('Error importing CSV files:', error);
  } finally {
    await pool.end();
  }
}

run();
