import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    // Execute all overview queries in parallel to significantly reduce total load time
    const [bidsRes, statusRes, wonRes, monthBidsRes, connectsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM bids'),
      pool.query(
        `SELECT status, COUNT(*) AS count FROM bids WHERE status IS NOT NULL AND status != '' GROUP BY status`
      ),
      pool.query(
        `SELECT COUNT(*) AS won FROM bids WHERE LOWER(TRIM(status)) = 'client'`
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM bids
         WHERE date_trunc('month', application_date) = date_trunc('month', CURRENT_DATE)`
      ),
      pool.query(`
        SELECT SUM(CAST(NULLIF(regexp_replace(connects, '[^0-9]', '', 'g'), '') AS integer)) AS total 
        FROM bids
      `)
    ]);

    const total = parseInt(bidsRes.rows[0].total);
    const won = parseInt(wonRes.rows[0].won);
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';

    const statusMap: Record<string, number> = {};
    for (const row of statusRes.rows) {
      statusMap[row.status] = parseInt(row.count);
    }

    return Response.json({
      totalBids: total,
      wonBids: won,
      winRate: parseFloat(winRate),
      earningsByCurrency: { USD: 0, INR: 0 },
      monthBids: parseInt(monthBidsRes.rows[0].count),
      monthEarnings: { USD: 0, INR: 0 },
      totalConnects: parseInt(connectsRes.rows[0].total ?? '0'),
      totalRecruiters: 0,
      bidsByStatus: statusMap,
    });
  } catch (err) {
    console.error('[Analytics Overview]', err);
    return Response.json({
      totalBids: 0, wonBids: 0, winRate: 0, earningsByCurrency: {},
      monthBids: 0, monthEarnings: {}, totalConnects: 0, totalRecruiters: 0,
      bidsByStatus: {}
    });
  }
}
