import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Every ledger route is noindex (A7) — enforced here rather than only via
 * page metadata, so it holds even for routes that don't set their own.
 *
 * Auth gating deliberately isn't done here: it would require importing
 * auth.ts's Node-only DB clients (PGlite/postgres-js) into the Edge
 * runtime middleware runs on by default. Each protected page/action calls
 * auth() itself instead — same guarantee, no runtime conflict.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: '/:path*',
};
