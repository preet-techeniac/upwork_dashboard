import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body as { username?: string };

    if (!username || !username.trim()) {
      return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();

    const result = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [trimmedUsername]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ exists: true });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password/check-user]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
