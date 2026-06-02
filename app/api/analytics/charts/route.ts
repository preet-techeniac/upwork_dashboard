import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    // Monthly bids over last 6 months
    const monthlyBidsRes = await pool.query(
      `SELECT
         TO_CHAR(date_trunc('month', application_date), 'Mon YY') AS month,
         date_trunc('month', application_date) AS month_date,
         COUNT(*) AS bids,
         COUNT(CASE WHEN LOWER(TRIM(status)) = 'client' THEN 1 END) AS won
       FROM bids
       WHERE application_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY month_date
       ORDER BY month_date`
    );

    // Bids by status for pie chart
    const statusRes = await pool.query(
      `SELECT status, COUNT(*) AS count FROM bids WHERE status IS NOT NULL AND status != '' GROUP BY status ORDER BY count DESC`
    );

    // Merge monthly data
    const monthlyMap: Record<string, { month: string; bids: number; won: number; usd: number; inr: number }> = {};
    for (const row of monthlyBidsRes.rows) {
      monthlyMap[row.month] = {
        month: row.month,
        bids: parseInt(row.bids),
        won: parseInt(row.won),
        usd: 0,
        inr: 0,
      };
    }

    return Response.json({
      monthly: Object.values(monthlyMap),
      recruiters: [],
      statusDistribution: statusRes.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
    });
  } catch (err) {
    console.error('[Analytics Charts]', err);
    return Response.json({
      monthly: [],
      recruiters: [],
      statusDistribution: []
    });
  }
}
