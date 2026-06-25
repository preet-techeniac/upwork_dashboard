const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvDir = 'C:\\Users\\teche\\Downloads';
const files = [
  'Upwork Data(May, 2026) (1).csv',
  'Upwork Data(June, 2026).csv'
];

async function inspectFile(file) {
  const filePath = path.join(csvDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`\n=== Inspecting: ${file} ===`);
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rows.push(data);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Total rows in CSV: ${rows.length}`);
  if (rows.length > 0) {
    console.log('Columns found:', Object.keys(rows[0]));
    console.log('Sample row (first):', rows[0]);
    console.log('Sample row (last):', rows[rows.length - 1]);
  }
}

async function main() {
  for (const file of files) {
    await inspectFile(file);
  }
}

main().catch(console.error);
