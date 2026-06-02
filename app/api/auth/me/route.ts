import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '../../../../lib/middleware';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();
  return Response.json({ user });
}