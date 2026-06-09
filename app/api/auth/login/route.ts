import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../lib/db';
import { signToken } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as { username: string; password: string };
    console.log(username, password);
    if (!username || !password) {
      return Response.json({ error: 'Username and password are required' }, { status: 400 });
    }
    console.log(process.env.DATABASE_URL)

    const result = await pool.query(
      'SELECT id, username, display_name, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    });

    return Response.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
