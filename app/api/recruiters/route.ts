import { NextRequest } from 'next/server';
import { pool } from '../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(r.name ILIKE $${idx} OR r.company ILIKE $${idx} OR r.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM recruiters r ${where}`;
  const dataQuery = `SELECT r.*,
       (SELECT COUNT(*) FROM bids b WHERE b.recruiter_id = r.id) AS total_bids,
       (SELECT COUNT(*) FROM bids b WHERE b.recruiter_id = r.id AND b.status = 'client') AS won_bids,
       (SELECT COALESCE(SUM(amount), 0) FROM earnings e WHERE e.recruiter_id = r.id AND e.currency = 'USD') AS total_earned_usd,
       (SELECT COALESCE(SUM(amount), 0) FROM earnings e WHERE e.recruiter_id = r.id AND e.currency = 'INR') AS total_earned_inr
     FROM recruiters r
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`;
  const dataParams = [...params, limit, offset];

  const [countRes, dataRes] = await Promise.all([
    pool.query(countQuery, params),
    pool.query(dataQuery, dataParams)
  ]);

  const total = parseInt(countRes.rows[0].count);

  return Response.json({ data: dataRes.rows, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { name, email, company, platform, country, notes } = body;

    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO recruiters (name, email, company, platform, country, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, email ?? null, company ?? null, platform ?? 'Upwork', country ?? null, notes ?? null]
    );

    return Response.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/recruiters]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
