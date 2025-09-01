"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Music, Plus, RefreshCw, Filter } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
}

const genres = [
  "acoustic",
  "afrobeat",
  "alt-rock",
  "alternative",
  "ambient",
  "blues",
  "classical",
  "country",
  "dance",
  "electronic",
  "folk",
  "funk",
  "hip-hop",
  "indie",
  "jazz",
  "metal",
  "pop",
  "r-n-b",
  "rock",
  "soul",
];

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Mock data for UI scaffolding
  const mockRecommendations: Track[] = [
    {
      id: "1",
      name: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      albumArt:
        "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=300&q=80",
      previewUrl: "https://p.scdn.co/mp3-preview/sample1.mp3",
    },
    {
      id: "2",
      name: "Good Days",
      artist: "SZA",
      album: "Good Days",
      albumArt:
        "https://images.unsplash.com/photo-1581375074612-d1fd0e661aeb?w=300&q=80",
      previewUrl: "https://p.scdn.co/mp3-preview/sample2.mp3",
    },
    {
      id: "3",
      name: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      albumArt:
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80",
      previewUrl: null,
    },
    {
      id: "4",
      name: "Leave The Door Open",
      artist: "Bruno Mars, Anderson .Paak",
      album: "An Evening With Silk Sonic",
      albumArt:
        "https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=300&q=80",
      previewUrl: "https://p.scdn.co/mp3-preview/sample4.mp3",
    },
    {
      id: "5",
      name: "Peaches",
      artist: "Justin Bieber",
      album: "Justice",
      albumArt:
        "https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&q=80",
      previewUrl: "https://p.scdn.co/mp3-preview/sample5.mp3",
    },
    {
      id: "6",
      name: "drivers license",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      albumArt:
        "https://images.unsplash.com/photo-1621153350296-de0d1a4a4092?w=300&q=80",
      previewUrl: null,
    },
  ];

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async (genre?: string) => {
    setIsLoading(true);

    try {
      // Fetch real recommendations from our API
      const params = new URLSearchParams({
        limit: '20',
      });

      if (genre && genre !== 'all') {
        params.append('genre', genre);
      }

      const response = await fetch(`/api/spotify/recommendations?${params.toString()}`, {
        credentials: 'include', // Include cookies for session
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, redirect to login
          window.location.href = '/';
          return;
        }
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error fetching recommendations",
        description: "Using sample data instead. Please try again later.",
        variant: "destructive",
      });
      // Fallback to mock data on error
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }
  };

  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    fetchRecommendations(value === "all" ? "" : value);
  };

  const handleRefresh = () => {
    fetchRecommendations(selectedGenre === "all" ? "" : selectedGenre);
  };

  const addToPlaylist = (track: Track) => {
    // In a real implementation, this would call Spotify API to add to playlist
    toast({
      title: "Added to playlist",
      description: `${track.name} by ${track.artist} has been added to your playlist.`,
    });
  };

  const playPreview = (track: Track) => {
    if (audioPlayer) {
      audioPlayer.pause();
      if (playingTrackId === track.id) {
        setPlayingTrackId(null);
        return;
      }
    }

    if (track.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.play();
      setAudioPlayer(audio);
      setPlayingTrackId(track.id);

      audio.addEventListener("ended", () => {
        setPlayingTrackId(null);
      });
    } else {
      toast({
        title: "Preview unavailable",
        description: "No preview available for this track.",
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-background">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Recommendations</CardTitle>
              <CardDescription>
                Discover new music based on your listening history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((track) => (
                <Card
                  key={track.id}
                  className="overflow-hidden flex flex-col h-full"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={track.albumArt}
                      alt={`${track.album} cover`}
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {track.name}
                    </h3>
                    <p className="text-muted-foreground line-clamp-1">
                      {track.artist}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {track.album}
                    </p>
                    <div className="mt-auto pt-4 flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 mr-2"
                        onClick={() => playPreview(track)}
                      >
                        <Music className="h-4 w-4 mr-2" />
                        {playingTrackId === track.id ? "Stop" : "Preview"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => addToPlaylist(track)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                No recommendations found
              </h3>
              <p className="text-muted-foreground">
                Try selecting a different genre or refreshing
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <h3 className="text-sm font-medium mb-2">Popular Genres</h3>
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 10).map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleGenreChange(genre)}
              >
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
