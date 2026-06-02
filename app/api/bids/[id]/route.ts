import { NextRequest } from 'next/server';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query(
    `SELECT * FROM bids WHERE id = $1`,
    [parseInt(id)]
  );

  if (result.rows.length === 0) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  return Response.json({ data: result.rows[0] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  try {
    const body = await req.json();
    const {
      application_date, job_url, found_by, cv_used, proposal_used,
      status, hires, interviewing, country, connects
    } = body;

    const result = await pool.query(
      `UPDATE bids SET
         application_date = $1, job_url = $2, found_by = $3, cv_used = $4,
         proposal_used = $5, status = $6, hires = $7, interviewing = $8,
         country = $9, connects = $10
       WHERE id = $11 RETURNING *`,
      [
        application_date || null,
        job_url || null,
        found_by || null,
        cv_used || null,
        proposal_used || null,
        status || null,
        hires || null,
        interviewing || null,
        country || null,
        connects || null,
        parseInt(id),
      ]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Bid not found' }, { status: 404 });
    }

    return Response.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[PUT /api/bids/:id]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const result = await pool.query('DELETE FROM bids WHERE id = $1 RETURNING id', [parseInt(id)]);

  if (result.rows.length === 0) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
