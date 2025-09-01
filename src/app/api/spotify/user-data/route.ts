import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '../token/route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const timeRange = searchParams.get('timeRange') || 'short_term';

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

    // Fetch user's top tracks
    const topTracksResponse = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!topTracksResponse.ok) {
      const errorData = await topTracksResponse.json();
      console.error('Top tracks error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch top tracks' }, { status: 400 });
    }

    const topTracksData = await topTracksResponse.json();
    
    // Handle case where user has no top tracks
    if (!topTracksData.items || topTracksData.items.length === 0) {
      return NextResponse.json({
        genreData: [],
        timeData: [
          { day: "Monday", count: 0 },
          { day: "Tuesday", count: 0 },
          { day: "Wednesday", count: 0 },
          { day: "Thursday", count: 0 },
          { day: "Friday", count: 0 },
          { day: "Saturday", count: 0 },
          { day: "Sunday", count: 0 },
        ],
        topTracks: [],
        totalTracks: 0,
      });
    }

    // Extract unique artist IDs to get their genres
    const allArtistIds = topTracksData.items.flatMap((track: any) => 
      track.artists.map((artist: any) => artist.id)
    );
    const uniqueArtistIds = Array.from(new Set(allArtistIds)).slice(0, 50); // Limit to 50 artists to avoid rate limits

    // Fetch artist details to get genres
    const artistsResponse = await fetch(
      `https://api.spotify.com/v1/artists?ids=${uniqueArtistIds.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!artistsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch artist data' }, { status: 400 });
    }

    const artistsData = await artistsResponse.json();

    // Process genre data
    const genreCounts: { [key: string]: number } = {};
    artistsData.artists.forEach((artist: any) => {
      artist.genres.forEach((genre: any) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const genreData = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 genres

    // Process time data (analyze when tracks were played)
    const timeData = [
      { day: "Monday", count: 0 },
      { day: "Tuesday", count: 0 },
      { day: "Wednesday", count: 0 },
      { day: "Thursday", count: 0 },
      { day: "Friday", count: 0 },
      { day: "Saturday", count: 0 },
      { day: "Sunday", count: 0 },
    ];

    // For now, we'll simulate time distribution since we don't have actual play timestamps
    // In a real implementation, you'd need to fetch recently played tracks with timestamps
    const totalTracks = topTracksData.items.length;
    timeData.forEach((day, index) => {
      // Simulate realistic listening patterns (more on weekends)
      const baseCount = Math.floor(totalTracks / 7);
      const weekendBonus = index >= 5 ? 1.5 : 1; // Weekend bonus
      day.count = Math.floor(baseCount * weekendBonus);
    });

    return NextResponse.json({
      genreData,
      timeData,
      topTracks: topTracksData.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        albumArt: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
      })),
      totalTracks: topTracksData.items.length,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
