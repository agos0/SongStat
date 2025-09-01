import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '../token/route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const genre = searchParams.get('genre');
    const limit = searchParams.get('limit') || '20';

    console.log('Recommendations API called with:', { genre, limit });

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

    // Test the access token with a simple API call
    try {
      const testResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!testResponse.ok) {
        console.error('Access token test failed:', testResponse.status);
        
        // If it's a 403, the token might be valid but the user doesn't have the required scopes
        if (testResponse.status === 403) {
          console.log('Access token is valid but user may not have required scopes');
          // Continue with the request anyway, as some endpoints might work
        } else {
          return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
        }
      } else {
        console.log('Access token is valid');
      }
    } catch (error) {
      console.error('Error testing access token:', error);
      return NextResponse.json({ error: 'Error validating access token' }, { status: 500 });
    }

    // First, get user's top tracks to use as seed tracks
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5',
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
    console.log('Top tracks response:', { itemCount: topTracksData.items?.length || 0 });
    
    if (!topTracksData.items || topTracksData.items.length === 0) {
      console.log('No top tracks found, returning empty recommendations');
      return NextResponse.json({
        recommendations: [],
        total: 0,
      });
    }
    
    const seedTracks = topTracksData.items.slice(0, 5).map((track: any) => track.id);
    console.log('Seed tracks:', seedTracks);
    
    // Validate that the track IDs are valid (they should be 22 characters long)
    const validTrackIds = seedTracks.filter((id: any) => id && id.length === 22);
    console.log('Valid track IDs:', validTrackIds);
    
    if (validTrackIds.length === 0) {
      console.log('No valid track IDs found, using genre-based recommendations');
    }

    // Get recommendations from Spotify - try a different approach
    // Let's try using the search API to find similar tracks instead of recommendations
    let recommendationsUrl;
    let useSearchAPI = false;
    
    if (genre && genre !== 'all') {
      // For genre-based, try search API instead
      useSearchAPI = true;
      recommendationsUrl = `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=${limit}`;
    } else if (validTrackIds.length > 0) {
      // For track-based, try to get track details first, then search for similar
      useSearchAPI = true;
      const firstTrackId = validTrackIds[0];
      recommendationsUrl = `https://api.spotify.com/v1/tracks/${firstTrackId}`;
    } else {
      // Fallback to pop genre search
      useSearchAPI = true;
      recommendationsUrl = `https://api.spotify.com/v1/search?q=genre:pop&type=track&limit=${limit}`;
    }
    
    console.log('Using search API approach:', useSearchAPI);
    console.log('Final URL:', recommendationsUrl);
    
    // Let's try a different approach - maybe the issue is with the API endpoint
    // Let's test with a different URL structure
    const testUrls = [
      'https://api.spotify.com/v1/recommendations?seed_genres=pop&limit=5',
      'https://api.spotify.com/v1/recommendations?seed_tracks=4cOdK2wGLETKBW3PvgPWqT&limit=5',
      'https://api.spotify.com/v1/recommendations?seed_artists=4gzpq5DPGxSnKTe4SA8HAU&limit=5'
    ];
    
    console.log('Testing multiple recommendation URLs...');
    
    for (const testUrl of testUrls) {
      try {
        console.log('Testing URL:', testUrl);
        const testResponse = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Test response status for', testUrl, ':', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('SUCCESS! Got', testData.tracks?.length || 0, 'tracks from', testUrl);
          break;
        } else {
          const errorText = await testResponse.text();
          console.log('Test failed for', testUrl, ':', errorText);
        }
      } catch (testError) {
        console.error('Test request failed for', testUrl, ':', testError);
      }
    }
    
    let recommendationsResponse;
    try {
      if (useSearchAPI) {
        // Use search API approach
        if (validTrackIds.length > 0 && !genre) {
          // First get track details, then search for similar tracks
          const trackResponse = await fetch(recommendationsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            const trackName = trackData.name;
            const artistName = trackData.artists?.[0]?.name;
            
            // Search for similar tracks
            const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName + ' ' + artistName)}&type=track&limit=${limit}`;
            console.log('Searching for similar tracks:', searchUrl);
            
            recommendationsResponse = await fetch(searchUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
          } else {
            // Fallback to genre search
            const fallbackUrl = `https://api.spotify.com/v1/search?q=genre:pop&type=track&limit=${limit}`;
            recommendationsResponse = await fetch(fallbackUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
          }
        } else {
          // Direct search API call
          recommendationsResponse = await fetch(recommendationsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
        }
      } else {
        // Original recommendations API approach
        recommendationsResponse = await fetch(recommendationsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (fetchError) {
      console.error('Network error fetching recommendations:', fetchError);
      return NextResponse.json({ 
        error: 'Network error fetching recommendations',
        details: fetchError
      }, { status: 500 });
    }

    if (!recommendationsResponse.ok) {
      let errorData;
      let responseText;
      try {
        responseText = await recommendationsResponse.text();
        console.error('Raw response text:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        errorData = { error: 'Failed to parse error response', rawResponse: responseText };
      }
      console.error('Recommendations error:', errorData);
      console.error('Response status:', recommendationsResponse.status);
      console.error('Response headers:', Object.fromEntries(recommendationsResponse.headers.entries()));
      
      // If recommendations API fails, try to return some top tracks as fallback
      console.log('Recommendations API failed, trying search API as fallback');
      
      try {
        // Try search API as fallback
        const fallbackSearchUrl = `https://api.spotify.com/v1/search?q=genre:pop&type=track&limit=${limit}`;
        const fallbackResponse = await fetch(fallbackSearchUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackRecommendations = (fallbackData.tracks?.items || []).map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists?.[0]?.name || 'Unknown Artist',
            album: track.album?.name || 'Unknown Album',
            albumArt: track.album?.images?.[0]?.url || '',
            previewUrl: track.preview_url,
            popularity: track.popularity,
            duration: track.duration_ms,
          }));
          
          return NextResponse.json({
            recommendations: fallbackRecommendations,
            total: fallbackRecommendations.length,
            note: 'Using search API as fallback due to recommendations API error'
          });
        }
      } catch (fallbackError) {
        console.error('Fallback search API also failed:', fallbackError);
      }
      
      // Final fallback to top tracks
      console.log('All APIs failed, returning top tracks as final fallback');
      const fallbackRecommendations = topTracksData.items.slice(0, 10).map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        albumArt: track.album?.images?.[0]?.url || '',
        previewUrl: track.preview_url,
        popularity: track.popularity,
        duration: track.duration_ms,
      }));
      
      return NextResponse.json({
        recommendations: fallbackRecommendations,
        total: fallbackRecommendations.length,
        note: 'Using top tracks as final fallback due to API errors'
      });
    }

    let recommendationsData;
    try {
      recommendationsData = await recommendationsResponse.json();
      console.log('Raw recommendations response structure:', {
        hasTracks: !!recommendationsData.tracks,
        tracksType: typeof recommendationsData.tracks,
        tracksKeys: recommendationsData.tracks ? Object.keys(recommendationsData.tracks) : 'no tracks',
        hasItems: !!recommendationsData.tracks?.items,
        itemsLength: recommendationsData.tracks?.items?.length || 0
      });
    } catch (parseError) {
      console.error('Error parsing recommendations response:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse recommendations response',
        details: parseError
      }, { status: 500 });
    }

    console.log('Recommendations data received:', { 
      trackCount: recommendationsData.tracks?.length || 0,
      searchTracksCount: recommendationsData.tracks?.items?.length || 0,
      useSearchAPI: useSearchAPI,
      dataKeys: Object.keys(recommendationsData)
    });

    // Process and return the recommendations
    let recommendations;
    if (useSearchAPI) {
      // Handle search API response format
      const tracks = recommendationsData.tracks?.items || recommendationsData.tracks || [];
      console.log('Processing search API tracks:', tracks.length);
      
      recommendations = tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        albumArt: track.album?.images?.[0]?.url || '',
        previewUrl: track.preview_url,
        popularity: track.popularity,
        duration: track.duration_ms,
      }));
    } else {
      // Handle recommendations API response format
      recommendations = (recommendationsData.tracks || []).map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        albumArt: track.album?.images?.[0]?.url || '',
        previewUrl: track.preview_url,
        popularity: track.popularity,
        duration: track.duration_ms,
      }));
    }

    console.log('Processed recommendations:', { count: recommendations.length });

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
