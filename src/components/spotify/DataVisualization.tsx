"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface GenreData {
  name: string;
  count: number;
  color: string;
}

interface TimeData {
  day: string;
  count: number;
}

const DataVisualization = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("genres");
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);

  // Spotify-inspired colors for the charts
  const chartColors = [
    "#1DB954", // Spotify green
    "#1ED760",
    "#2D46B9",
    "#F73D93",
    "#FF6B6B",
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#073B4C",
    "#7209B7",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch real data from our API
        const response = await fetch('/api/spotify/user-data?timeRange=short_term', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Session expired, redirect to login
            window.location.href = '/';
            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();

        if (!data.genreData || data.genreData.length === 0) {
          setError('No listening data available. Start listening to music to see your insights!');
          setLoading(false);
          return;
        }

        // Process genre data with colors
        const processedGenreData: GenreData[] = data.genreData.map((genre: any, index: number) => ({
          name: genre.name.charAt(0).toUpperCase() + genre.name.slice(1),
          count: genre.count,
          color: chartColors[index % chartColors.length],
        }));

        setGenreData(processedGenreData);
        setTimeData(data.timeData || []);
        setTotalTracks(data.totalTracks || 0);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load your listening data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate the maximum count for scaling the bar chart
  const maxTimeCount = timeData.length > 0 ? Math.max(...timeData.map((item) => item.count)) : 0;

  if (error) {
    return (
      <div className="w-full p-4 bg-background">
        <h1 className="text-3xl font-bold mb-6">Your Listening Insights</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-background">
      <h1 className="text-3xl font-bold mb-6">Your Listening Insights</h1>

      <Tabs
        defaultValue="genres"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="genres" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Top Genres
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Weekly Pattern
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genres" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Your Top Genres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Simplified pie chart visualization */}
                  <div className="relative w-full md:w-1/2 aspect-square max-w-[400px] mx-auto">
                    <div className="absolute inset-0 rounded-full border border-border flex items-center justify-center">
                      <div className="text-center">
                        <span className="block text-lg font-medium">Total Tracks</span>
                        <span className="block text-3xl font-bold">{totalTracks}</span>
                      </div>
                    </div>
                    {genreData.map((genre, index) => {
                      const totalCount = genreData.reduce(
                        (sum, g) => sum + g.count,
                        0,
                      );
                      const percentage = (genre.count / totalCount) * 100;
                      const rotate =
                        index > 0
                          ? genreData
                              .slice(0, index)
                              .reduce(
                                (sum, g) => sum + (g.count / totalCount) * 360,
                                0,
                              )
                          : 0;

                      return (
                        <div
                          key={genre.name}
                          className="absolute inset-0 rounded-full overflow-hidden"
                          style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((rotate + percentage * 1.8) * Math.PI) / 180)}% ${50 - 50 * Math.sin(((rotate + percentage * 1.8) * Math.PI) / 180)}%, ${50 + 50 * Math.cos((rotate * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotate * Math.PI) / 180)}%)`,
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: genre.color }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-medium mb-4">
                      Genre Breakdown
                    </h3>
                    <div className="space-y-3">
                      {genreData.map((genre) => (
                        <div
                          key={genre.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: genre.color }}
                            />
                            <span>{genre.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {genre.count} tracks
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {Math.round(
                                (genre.count /
                                  genreData.reduce(
                                    (sum, g) => sum + g.count,
                                    0,
                                  )) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Listening Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
              ) : timeData.length > 0 ? (
                <div className="pt-6">
                  {/* Bar chart visualization */}
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {timeData.map((item) => (
                      <div
                        key={item.day}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <div
                          className="w-full bg-primary rounded-t-md transition-all duration-500 ease-in-out"
                          style={{
                            height: maxTimeCount > 0 ? `${(item.count / maxTimeCount) * 250}px` : '0px',
                            maxWidth: "50px",
                          }}
                        />
                        <div className="text-xs font-medium">
                          {item.day.substring(0, 3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.count} tracks
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No listening pattern data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
