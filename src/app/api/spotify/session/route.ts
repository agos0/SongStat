import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, updateSession, deleteSession } from '@/lib/session-manager';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('spotify_session')?.value;

    console.log('Session validation request for session:', sessionId);

    if (!sessionId) {
      console.log('No session found in cookies');
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      console.log('Invalid session ID:', sessionId);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log('Valid session found:', sessionId, 'User ID:', session.user_id);

    // Check if token is expired
    const now = Date.now();
    const tokenAge = now - session.created_at;
    const tokenExpiry = session.expires_in * 1000; // Convert to milliseconds

    console.log('Token age:', Math.floor(tokenAge / 1000), 'seconds, expires in:', session.expires_in, 'seconds');

    if (tokenAge >= tokenExpiry) {
      console.log('Token expired, attempting refresh');
      // Token is expired, try to refresh it
      if (session.refresh_token) {
        try {
          const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
          const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

          if (!clientId || !clientSecret) {
            console.error('Spotify credentials not configured');
            return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
          }

          const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: session.refresh_token,
            }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            
            console.log('Token refreshed successfully for session:', sessionId);
            
            // Update session with new token
            updateSession(sessionId, {
              access_token: refreshData.access_token,
              expires_in: refreshData.expires_in,
              created_at: now,
            });

            return NextResponse.json({
              access_token: refreshData.access_token,
              expires_in: refreshData.expires_in,
            });
          } else {
            const errorData = await refreshResponse.json();
            console.log('Token refresh failed for session:', sessionId, 'Error:', errorData);
            // Refresh failed, delete session
            deleteSession(sessionId);
            return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
          }
        } catch (error) {
          console.error('Token refresh error for session:', sessionId, error);
          deleteSession(sessionId);
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
        }
      } else {
        console.log('No refresh token available for session:', sessionId);
        // No refresh token, delete session
        deleteSession(sessionId);
        return NextResponse.json({ error: 'Token expired and no refresh token' }, { status: 401 });
      }
    }

    console.log('Token is still valid for session:', sessionId, 'returning access token');
    // Token is still valid
    return NextResponse.json({
      access_token: session.access_token,
      expires_in: session.expires_in - Math.floor(tokenAge / 1000), // Remaining time
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('spotify_session')?.value;

    if (sessionId) {
      deleteSession(sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('spotify_session');
    
    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
