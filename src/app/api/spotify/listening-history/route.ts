import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || 'short_term';
    const type = searchParams.get('type') || 'recently-played'; // 'recently-played' or 'top-tracks'

    // Get session from cookies
    const cookieStore = cookies();
    const sessionId = cookieStore.get('spotify_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const accessToken = session.access_token;

    let endpoint;
    if (type === 'recently-played') {
      endpoint = 'https://api.spotify.com/v1/me/player/recently-played?limit=20';
    } else {
      endpoint = `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`;
    }

    console.log('Fetching from Spotify API:', endpoint);

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Spotify API response status:', response.status);

    if (!response.ok) {
      // Try to get the error response as text first
      const errorText = await response.text();
      console.error('Spotify API error response:', errorText);
      
      // If it's an HTML error page, return a more specific error
      if (errorText.includes('<!DOCTYPE html>') || errorText.includes('Check sett')) {
        console.log('Spotify API returned HTML error - likely app configuration issue');
        return NextResponse.json({ 
          error: 'Spotify API returned HTML instead of JSON. This usually means the access token is invalid or expired.',
          details: 'Please try logging in again.'
        }, { status: 401 });
      }
      
      // Try to parse as JSON if it's not HTML
      try {
        const errorData = JSON.parse(errorText);
        console.error('Spotify API error data:', errorData);
        return NextResponse.json({ error: 'Failed to fetch listening history', details: errorData }, { status: response.status });
      } catch (parseError) {
        return NextResponse.json({ error: 'Failed to fetch listening history', details: errorText }, { status: response.status });
      }
    }

    const data = await response.json();
    console.log('Spotify API response data received, items count:', data.items?.length || 0);

    // Process the data based on type
    let tracksData;
    if (type === 'recently-played') {
      tracksData = data.items.map((item: any) => ({
        id: item.track?.id ?? item.track?.uri ?? Math.random().toString(),
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
        album: item.track.album.name,
        albumArt: item.track.album.images[0]?.url || "",
        playedAt: item.played_at,
        duration: Math.floor(item.track.duration_ms / 60000) + ":" + 
                 Math.floor((item.track.duration_ms % 60000) / 1000).toString().padStart(2, "0"),
      }));
    } else {
      tracksData = data.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        album: track.album.name,
        albumArt: track.album.images[0]?.url || "",
        playedAt: new Date().toISOString(),
        duration: Math.floor(track.duration_ms / 60000) + ":" + 
                 Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, "0"),
      }));
    }

    console.log('Processed tracks data, count:', tracksData.length);

    return NextResponse.json({
      tracks: tracksData,
      total: tracksData.length,
    });
  } catch (error) {
    console.error('Error fetching listening history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
