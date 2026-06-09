import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../lib/db';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { currentPassword, newPassword, recoveryPin } = body as {
      currentPassword?: string;
      newPassword?: string;
      recoveryPin?: string;
    };

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Retrieve the user hash from the database
    const dbResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.userId]
    );

    if (dbResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const dbUser = dbResult.rows[0];

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!isCurrentValid) {
      return Response.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    if (recoveryPin && recoveryPin.trim()) {
      // Set or update recovery PIN hash
      const cleanPin = recoveryPin.trim().toLowerCase();
      const pinHash = await bcrypt.hash(cleanPin, salt);

      await pool.query(
        'UPDATE users SET password_hash = $1, recovery_pin_hash = $2 WHERE id = $3',
        [newPasswordHash, pinHash, user.userId]
      );
    } else {
      // Just update the password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, user.userId]
      );
    }

    return Response.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[POST /api/auth/change-password]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
