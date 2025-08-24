"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MusicIcon, HistoryIcon, BarChart3Icon, LogInIcon } from "lucide-react";
import SpotifyAuth from "@/components/spotify/SpotifyAuth";
import ListeningHistory from "@/components/spotify/ListeningHistory";
import Recommendations from "@/components/spotify/Recommendations";
import DataVisualization from "@/components/spotify/DataVisualization";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem("spotify_access_token");
      if (storedToken) {
        // Verify the token is still valid by making a test request
        try {
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            setAccessToken(storedToken);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("spotify_access_token");
            localStorage.removeItem("spotify_refresh_token");
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          // Remove invalid tokens
          localStorage.removeItem("spotify_access_token");
          localStorage.removeItem("spotify_refresh_token");
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    setIsAuthenticated(false);
    setAccessToken(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MusicIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SongStat</h1>
          </div>

          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">
                  Welcome to SongStat
                </CardTitle>
                <CardDescription className="text-center">
                  Connect your Spotify account to view your listening history
                  and get personalized recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SpotifyAuth onAuthSuccess={() => setIsAuthenticated(true)} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="recommendations"
                  className="flex items-center gap-2"
                >
                  <MusicIcon className="h-4 w-4" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3Icon className="h-4 w-4" />
                  Stats
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="w-full">
              <ListeningHistory accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="recommendations" className="w-full">
              <Recommendations accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="stats" className="w-full">
              <DataVisualization accessToken={accessToken} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} SongStat. Powered by Spotify
          API.
        </p>
      </footer>
    </div>
  );
}
