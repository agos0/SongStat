import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    console.log('Token exchange request received with code:', code ? 'PRESENT' : 'MISSING');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // Use the same redirect URI logic as the frontend
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:3000/callback'
      : 'https://song-stat.vercel.app/callback';

    console.log('Environment variables check:');
    console.log('SPOTIFY_CLIENT_ID:', clientId ? 'SET' : 'NOT SET');
    console.log('SPOTIFY_CLIENT_SECRET:', clientSecret ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', redirectUri);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Spotify credentials not configured',
        details: {
          clientId: !!clientId,
          clientSecret: !!clientSecret
        }
      }, { status: 500 });
    }

    // Exchange authorization code for tokens
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });
    
    console.log('Sending request to Spotify with:');
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Request body:', requestBody.toString());
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: requestBody,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Spotify token exchange error:', errorData);
      console.error('Response status:', tokenResponse.status);
      console.error('Response headers:', Object.fromEntries(tokenResponse.headers.entries()));
      
      return NextResponse.json({ 
        error: 'Failed to exchange authorization code',
        details: errorData,
        status: tokenResponse.status
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('Created new session:', sessionId);
    
    // Store session data
    sessions.set(sessionId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      created_at: Date.now(),
      user_id: null // Will be set when we fetch user data
    });

    console.log('Total active sessions:', sessions.size);

    // Create response with session cookie
    const response = NextResponse.json({
      sessionId: sessionId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });

    // Set HTTP-only cookie for session management
    response.cookies.set('spotify_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Session cookie set for session:', sessionId);

    return response;
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get session data
export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

// Helper function to update session
export function updateSession(sessionId: string, data: any) {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.set(sessionId, { ...session, ...data });
  }
}

// Helper function to delete session
export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}
