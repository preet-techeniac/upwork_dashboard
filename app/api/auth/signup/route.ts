import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../lib/db';
import { signToken } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, password } = body as { email?: string; displayName?: string; password?: string };

    if (!email || !displayName || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const displayNameTrimmed = displayName.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check if user already exists (case-insensitive check on username)
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [emailTrimmed]
    );

    if (checkUser.rows.length > 0) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (username, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, role`,
      [emailTrimmed, displayNameTrimmed, passwordHash, 'admin']
    );

    const newUser = result.rows[0];

    // Sign JWT token for immediate auto-login
    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      displayName: newUser.display_name,
      role: newUser.role,
    });

    return Response.json(
      {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.display_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/auth/signup]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
