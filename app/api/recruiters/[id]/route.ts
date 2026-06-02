import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query(
    `SELECT r.*,
       COUNT(DISTINCT b.id) AS total_bids,
       COUNT(DISTINCT CASE WHEN b.status = 'client' THEN b.id END) AS won_bids,
       COALESCE(SUM(e.amount) FILTER (WHERE e.currency = 'USD'), 0) AS total_earned_usd,
       COALESCE(SUM(e.amount) FILTER (WHERE e.currency = 'INR'), 0) AS total_earned_inr
     FROM recruiters r
     LEFT JOIN bids b ON b.recruiter_id = r.id
     LEFT JOIN earnings e ON e.recruiter_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return Response.json({ error: 'Recruiter not found' }, { status: 404 });
  }

  return Response.json({ data: result.rows[0] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, email, company, platform, country, notes } = body;

    const result = await pool.query(
      `UPDATE recruiters SET name=$1, email=$2, company=$3, platform=$4, country=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, email ?? null, company ?? null, platform ?? 'Upwork', country ?? null, notes ?? null, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    return Response.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/recruiters/:id]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query('DELETE FROM recruiters WHERE id = $1 RETURNING id', [parseInt(id)]);

  if (result.rows.length === 0) {
    return Response.json({ error: 'Recruiter not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
