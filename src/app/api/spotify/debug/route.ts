import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '../token/route';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('spotify_session')?.value;

    const debugInfo = {
      hasSessionCookie: !!sessionId,
      sessionId: sessionId || 'none',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasClientId: !!(process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID),
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    };

    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        const now = Date.now();
        const tokenAge = now - session.created_at;
        const tokenExpiry = session.expires_in * 1000;
        const isExpired = tokenAge >= tokenExpiry;

        debugInfo.session = {
          exists: true,
          tokenAge: Math.floor(tokenAge / 1000) + ' seconds',
          expiresIn: session.expires_in + ' seconds',
          isExpired,
          hasRefreshToken: !!session.refresh_token,
          hasAccessToken: !!session.access_token,
        };
      } else {
        debugInfo.session = {
          exists: false,
          error: 'Session not found in memory',
        };
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
