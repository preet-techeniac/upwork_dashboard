import { NextRequest } from 'next/server';
import { pool } from '../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const found_by = searchParams.get('found_by');
  const month = searchParams.get('month'); // e.g. "04"
  const year = searchParams.get('year'); // e.g. "2026"
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const offset = (page - 1) * limit;

  const sortBy = searchParams.get('sortBy') || 'date';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (found_by) { conditions.push(`found_by = $${idx++}`); params.push(found_by); }
  if (month) {
    conditions.push(`EXTRACT(MONTH FROM application_date) = $${idx++}`);
    params.push(parseInt(month));
  }
  if (year) {
    conditions.push(`EXTRACT(YEAR FROM application_date) = $${idx++}`);
    params.push(parseInt(year));
  }
  if (search) {
    conditions.push(`(job_url ILIKE $${idx} OR cv_used ILIKE $${idx} OR proposal_used ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderByClause = 'ORDER BY application_date DESC NULLS LAST, created_at DESC';
  if (sortBy === 'date') {
    orderByClause = `ORDER BY application_date ${sortOrder} NULLS LAST, created_at DESC`;
  } else if (sortBy === 'country') {
    orderByClause = `ORDER BY country ${sortOrder} NULLS LAST, application_date DESC NULLS LAST`;
  } else if (sortBy === 'status') {
    orderByClause = `ORDER BY status ${sortOrder} NULLS LAST, application_date DESC NULLS LAST`;
  } else if (sortBy === 'connects') {
    // Sort numerically if possible, fallback to string sort
    orderByClause = `ORDER BY CAST(NULLIF(regexp_replace(connects, '[^0-9]', '', 'g'), '') AS integer) ${sortOrder} NULLS LAST, application_date DESC NULLS LAST`;
  }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM bids ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);

  const dataRes = await pool.query(
    `SELECT *
     FROM bids
     ${where}
     ${orderByClause}
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return Response.json({
    data: dataRes.rows,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const {
      application_date, job_url, found_by, cv_used, proposal_used, 
      status, hires, interviewing, country, connects
    } = body;

    const result = await pool.query(
      `INSERT INTO bids
         (application_date, job_url, found_by, cv_used, proposal_used, status, hires, interviewing, country, connects)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
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
        connects || null
      ]
    );

    return Response.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/bids]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
