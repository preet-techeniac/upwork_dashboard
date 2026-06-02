import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    // Self-healing: Ensure earnings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS earnings (
        id            SERIAL PRIMARY KEY,
        bid_id        INTEGER,
        recruiter_id  INTEGER,
        amount        NUMERIC(12,2) NOT NULL,
        currency      VARCHAR(10) NOT NULL DEFAULT 'USD',
        payment_date  DATE NOT NULL,
        description   TEXT,
        created_by    INTEGER,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { searchParams } = new URL(req.url);
    const foundBy = searchParams.get('found_by');

    // 1. Fetch monthly bids stats
    let bidsQuery = `
      SELECT 
        TO_CHAR(date_trunc('month', application_date), 'Mon YY') AS month,
        date_trunc('month', application_date) AS month_date,
        COUNT(*) AS bids,
        COALESCE(SUM(CAST(NULLIF(regexp_replace(connects, '[^0-9]', '', 'g'), '') AS integer)), 0) AS connects,
        COUNT(CASE WHEN status ILIKE '%view%' OR status ILIKE '%seen%' THEN 1 END) AS viewed,
        COUNT(CASE WHEN status ILIKE '%conversation%' THEN 1 END) AS conversation,
        COUNT(CASE WHEN LOWER(TRIM(status)) = 'client' THEN 1 END) AS converted
      FROM bids
      WHERE application_date IS NOT NULL
    `;
    const bidsParams: any[] = [];
    if (foundBy && foundBy !== 'All') {
      bidsParams.push(foundBy);
      bidsQuery += ` AND found_by = $1`;
    }
    bidsQuery += `
      GROUP BY month_date
      ORDER BY month_date DESC
    `;
    const bidsRes = await pool.query(bidsQuery, bidsParams);

    // 2. Fetch monthly earnings in USD
    let earningsQuery = `
      SELECT 
        TO_CHAR(date_trunc('month', e.payment_date), 'Mon YY') AS month,
        date_trunc('month', e.payment_date) AS month_date,
        COALESCE(SUM(e.amount), 0) AS earnings
      FROM earnings e
    `;
    const earningsParams: any[] = [];
    if (foundBy && foundBy !== 'All') {
      earningsParams.push(foundBy);
      earningsQuery += `
        INNER JOIN bids b ON b.id = e.bid_id
        WHERE e.currency = 'USD' AND e.payment_date IS NOT NULL AND b.found_by = $1
      `;
    } else {
      earningsQuery += `
        WHERE e.currency = 'USD' AND e.payment_date IS NOT NULL
      `;
    }
    earningsQuery += `
      GROUP BY month_date
      ORDER BY month_date DESC
    `;
    const earningsRes = await pool.query(earningsQuery, earningsParams);

    // 3. Merge data by month
    const monthlyMap: Record<string, {
      month: string;
      month_date: Date;
      bids: number;
      connects: number;
      viewed: number;
      conversation: number;
      converted: number;
      earnings: number;
    }> = {};

    // Populate from bids
    for (const row of bidsRes.rows) {
      monthlyMap[row.month] = {
        month: row.month,
        month_date: new Date(row.month_date),
        bids: parseInt(row.bids),
        connects: parseInt(row.connects),
        viewed: parseInt(row.viewed),
        conversation: parseInt(row.conversation),
        converted: parseInt(row.converted),
        earnings: 0,
      };
    }

    // Merge from earnings
    for (const row of earningsRes.rows) {
      if (monthlyMap[row.month]) {
        monthlyMap[row.month].earnings = parseFloat(row.earnings);
      } else {
        monthlyMap[row.month] = {
          month: row.month,
          month_date: new Date(row.month_date),
          bids: 0,
          connects: 0,
          viewed: 0,
          conversation: 0,
          converted: 0,
          earnings: parseFloat(row.earnings),
        };
      }
    }

    // Convert map to sorted array (newest first)
    const sortedMonthly = Object.values(monthlyMap).sort((a, b) => b.month_date.getTime() - a.month_date.getTime());

    return Response.json({
      success: true,
      data: sortedMonthly,
    });
  } catch (err) {
    console.error('[GET /api/analytics/monthly]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
