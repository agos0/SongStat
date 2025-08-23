import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // Use the same redirect URI logic as the frontend
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:3000/callback'
      : 'https://next-spotify-song-tracker-d4lpqf11g-aryan-goswamis-projects.vercel.app/callback';

    console.log('Environment variables check:');
    console.log('SPOTIFY_CLIENT_ID:', clientId ? 'SET' : 'NOT SET');
    console.log('SPOTIFY_CLIENT_SECRET:', clientSecret ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', redirectUri);

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
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
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

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
