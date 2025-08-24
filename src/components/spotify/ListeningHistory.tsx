"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Music } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  playedAt: string;
  duration: string;
}

const ListeningHistory = ({ accessToken }: { accessToken?: string | null }) => {
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("short_term");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const mockTracks: Track[] = [
    {
      id: "1",
      name: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      albumArt: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=300&q=80",
      playedAt: "2023-06-15T14:30:00Z",
      duration: "3:20",
    },
    {
      id: "2",
      name: "Bad Guy",
      artist: "Billie Eilish",
      album: "When We All Fall Asleep, Where Do We Go?",
      albumArt: "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=300&q=80",
      playedAt: "2023-06-15T14:00:00Z",
      duration: "3:14",
    },
  ];

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("spotify_access_token") || accessToken;

        if (!token) {
          setTracks(mockTracks);
          return;
        }

        let endpoint;
        if (timeRange === "short_term") {
          endpoint = "https://api.spotify.com/v1/me/player/recently-played?limit=20";
        } else {
          endpoint = `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=20`;
        }

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch tracks");

        const data = await res.json();
        let tracksData: Track[] = [];

        if (timeRange === "short_term") {
          tracksData = data.items.map((item: any) => ({
            id: item.track?.id ?? item.track?.uri ?? Math.random().toString(),
            name: item.track.name,
            artist: item.track.artists.map((a: any) => a.name).join(", "),
            album: item.track.album.name,
            albumArt: item.track.album.images[0]?.url || "",
            playedAt: item.played_at,
            duration: formatDuration(item.track.duration_ms),
          }));
        } else {
          tracksData = data.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: any) => a.name).join(", "),
            album: track.album.name,
            albumArt: track.album.images[0]?.url || "",
            playedAt: new Date().toISOString(),
            duration: formatDuration(track.duration_ms),
          }));
        }

        setTracks(tracksData);
      } catch (error) {
        console.error(error);
        setTracks(mockTracks);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [timeRange, accessToken]);

  const timeRangeLabels = {
    short_term: "Last Week",
    medium_term: "Last Month",
    long_term: "Last 6 Months",
  };

  return (
    <div className="w-full bg-background p-6 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Listening History</h1>
        <p className="text-muted-foreground">
          Track your Spotify listening activity over time
        </p>
      </div>

      <Tabs defaultValue="short_term" onValueChange={(value) => setTimeRange(value as any)}>
        <TabsList className="mb-6">
          {Object.entries(timeRangeLabels).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(timeRangeLabels).map(([value, label]) => (
          <TabsContent key={value} value={value} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {timeRange === "short_term" ? "Listening History" : `Top Tracks from ${label}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div
                      className={`grid text-xs font-medium text-muted-foreground mb-2 px-4 ${
                        timeRange === "short_term" ? "grid-cols-12" : "grid-cols-10"
                      }`}
                    >
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">TITLE</div>
                      <div className="col-span-3">ALBUM</div>
                      {timeRange === "short_term" && <div className="col-span-2">PLAYED AT</div>}
                      {/* Duration header (Clock) is always the last column and is col-span-1 */}
                      <div className="col-span-1 flex justify-end items-center">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Tracks */}
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={`grid items-center py-2 px-4 rounded-md hover:bg-accent/50 transition-colors ${
                          timeRange === "short_term" ? "grid-cols-12" : "grid-cols-10"
                        }`}
                      >
                        <div className="col-span-1 text-muted-foreground">{index + 1}</div>

                        <div className="col-span-5 flex items-center gap-3">
                          <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={track.albumArt}
                              alt={track.album}
                              className="h-full w-full object-cover"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://api.dicebear.com/7.x/avataaars/svg?seed=music")
                              }
                            />
                          </div>
                          <div>
                            <div className="font-medium">{track.name}</div>
                            <div className="text-sm text-muted-foreground">{track.artist}</div>
                          </div>
                        </div>

                        <div className="col-span-3 text-sm text-muted-foreground truncate">{track.album}</div>

                        {timeRange === "short_term" && (
                          <div className="col-span-2 text-sm text-muted-foreground">{formatDate(track.playedAt)}</div>
                        )}

                        {/* Duration column: last column, always col-span-1 so it aligns with the Clock header */}
                        <div className="col-span-1 text-sm text-muted-foreground flex justify-end">
                          {track.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {!accessToken && (
        <div className="mt-8 p-4 border border-dashed rounded-lg flex flex-col items-center justify-center">
          <Music className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-center text-muted-foreground">
            Connect your Spotify account to see your actual listening history
          </p>
        </div>
      )}
    </div>
  );
};

export default ListeningHistory;
