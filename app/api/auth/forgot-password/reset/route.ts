import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, pin, newPassword } = body as {
      username?: string;
      pin?: string;
      newPassword?: string;
    };

    if (!username || !pin || !newPassword) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim().toLowerCase();

    // Find the user
    const result = await pool.query(
      'SELECT id, recovery_pin_hash FROM users WHERE LOWER(username) = $1',
      [trimmedUsername]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    let isPinCorrect = false;

    if (user.recovery_pin_hash) {
      // Compare with stored hash
      isPinCorrect = await bcrypt.compare(cleanPin, user.recovery_pin_hash);
    } else {
      // Fallback for pre-existing accounts (preet/sandeep) that haven't set their recovery pins yet
      isPinCorrect = cleanPin === 'bidtrack' || cleanPin === 'techeniac';
    }

    if (!isPinCorrect) {
      return Response.json({ error: 'Incorrect Recovery PIN' }, { status: 400 });
    }

    // Generate hash for new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // If the recovery PIN hash wasn't stored, let's also store it now
    if (!user.recovery_pin_hash) {
      const pinHash = await bcrypt.hash(cleanPin, salt);
      await pool.query(
        'UPDATE users SET password_hash = $1, recovery_pin_hash = $2 WHERE id = $3',
        [passwordHash, pinHash, user.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, user.id]
      );
    }

    return Response.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password/reset]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
