import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifyToken, JWTPayload } from './auth';

export function getAuthUser(req: NextRequest): JWTPayload | null {
  const token = extractTokenFromHeader(req.headers.get('authorization'));
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}
