"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  BarChart3,
  PieChart,
  Clock,
  Calendar,
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

interface DataVisualizationProps {
  userId?: string;
}

const DataVisualization = ({ userId = "user123" }: DataVisualizationProps) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("genres");
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);

  // Mock colors for the genre chart
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
    // Simulate API call to fetch data
    const fetchData = async () => {
      setLoading(true);

      // In a real app, this would be an API call to fetch user's listening data
      setTimeout(() => {
        // Mock genre data
        const mockGenreData: GenreData[] = [
          { name: "Pop", count: 145, color: chartColors[0] },
          { name: "Rock", count: 98, color: chartColors[1] },
          { name: "Hip Hop", count: 87, color: chartColors[2] },
          { name: "Electronic", count: 76, color: chartColors[3] },
          { name: "R&B", count: 65, color: chartColors[4] },
          { name: "Indie", count: 54, color: chartColors[5] },
          { name: "Jazz", count: 32, color: chartColors[6] },
          { name: "Classical", count: 21, color: chartColors[7] },
        ];

        // Mock time data (listening by day of week)
        const mockTimeData: TimeData[] = [
          { day: "Monday", count: 42 },
          { day: "Tuesday", count: 38 },
          { day: "Wednesday", count: 45 },
          { day: "Thursday", count: 39 },
          { day: "Friday", count: 68 },
          { day: "Saturday", count: 82 },
          { day: "Sunday", count: 74 },
        ];

        setGenreData(mockGenreData);
        setTimeData(mockTimeData);
        setLoading(false);
      }, 1500);
    };

    fetchData();
  }, [userId]);

  // Calculate the maximum count for scaling the bar chart
  const maxTimeCount = Math.max(...timeData.map((item) => item.count));

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
            Listening Patterns
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
                  {/* Pie chart visualization (simplified) */}
                  <div className="relative w-full md:w-1/2 aspect-square max-w-[400px] mx-auto">
                    <div className="absolute inset-0 rounded-full border border-border flex items-center justify-center">
                      <span className="text-lg font-medium">Total Tracks</span>
                      <span className="block text-3xl font-bold">
                        {genreData.reduce((sum, genre) => sum + genre.count, 0)}
                      </span>
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
              ) : (
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
                            height: `${(item.count / maxTimeCount) * 250}px`,
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Listening Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[100px] w-full rounded-lg" />
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      Morning
                    </span>
                    <span className="text-2xl font-bold">23%</span>
                  </div>
                  <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      Afternoon
                    </span>
                    <span className="text-2xl font-bold">18%</span>
                  </div>
                  <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      Evening
                    </span>
                    <span className="text-2xl font-bold">42%</span>
                  </div>
                  <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                    <span className="text-muted-foreground text-sm">Night</span>
                    <span className="text-2xl font-bold">17%</span>
                  </div>
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
