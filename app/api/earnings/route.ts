import { NextRequest } from 'next/server';
import { pool } from '../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency');
  const recruiter_id = searchParams.get('recruiter_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (currency) { conditions.push(`e.currency = $${idx++}`); params.push(currency); }
  if (recruiter_id) { conditions.push(`e.recruiter_id = $${idx++}`); params.push(parseInt(recruiter_id)); }
  if (from) { conditions.push(`e.payment_date >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`e.payment_date <= $${idx++}`); params.push(to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(`SELECT COUNT(*) FROM earnings e ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const dataRes = await pool.query(
    `SELECT e.*, r.name AS recruiter_name, b.job_title, u.display_name AS created_by_name
     FROM earnings e
     LEFT JOIN recruiters r ON r.id = e.recruiter_id
     LEFT JOIN bids b ON b.id = e.bid_id
     LEFT JOIN users u ON u.id = e.created_by
     ${where}
     ORDER BY e.payment_date DESC, e.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return Response.json({ data: dataRes.rows, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { bid_id, recruiter_id, amount, currency, payment_date, description } = body;

    if (!amount || !payment_date) {
      return Response.json({ error: 'amount and payment_date are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO earnings (bid_id, recruiter_id, amount, currency, payment_date, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [bid_id ?? null, recruiter_id ?? null, amount, currency ?? 'USD', payment_date, description ?? null, user.userId]
    );

    return Response.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/earnings]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
