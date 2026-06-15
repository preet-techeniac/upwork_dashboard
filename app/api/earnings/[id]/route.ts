import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query(
    `SELECT e.*, r.name AS recruiter_name, NULL AS job_title, u.display_name AS created_by_name
     FROM earnings e
     LEFT JOIN recruiters r ON r.id = e.recruiter_id
     LEFT JOIN bids b ON b.id = e.bid_id
     LEFT JOIN users u ON u.id = e.created_by
     WHERE e.id = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return Response.json({ error: 'Earning not found' }, { status: 404 });
  }

  return Response.json({ data: result.rows[0] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const body = await req.json();
    const { bid_id, recruiter_id, amount, currency, payment_date, description } = body;

    const result = await pool.query(
      `UPDATE earnings SET
         bid_id = $1, recruiter_id = $2, amount = $3, currency = $4,
         payment_date = $5, description = $6
       WHERE id = $7 RETURNING *`,
      [bid_id ?? null, recruiter_id ?? null, amount, currency ?? 'USD', payment_date, description ?? null, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Earning not found' }, { status: 404 });
    }

    return Response.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/earnings/:id]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query('DELETE FROM earnings WHERE id = $1 RETURNING id', [parseInt(id)]);

  if (result.rows.length === 0) {
    return Response.json({ error: 'Earning not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
