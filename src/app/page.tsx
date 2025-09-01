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
import Image from "next/image";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Prevent multiple auth checks
      if (authChecked) {
        setIsLoading(false);
        return;
      }

      try {
        // Check session status from server
        const response = await fetch('/api/spotify/session', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setAccessToken(data.access_token);
          console.log('Authentication successful, access token received');
        } else {
          // Session is invalid, clear any stored data
          localStorage.removeItem('spotify_session_id');
          setIsAuthenticated(false);
          setAccessToken(null);
          console.log('Session validation failed, user not authenticated');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear any stored data on error
        localStorage.removeItem('spotify_session_id');
        setIsAuthenticated(false);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, [authChecked]);

  const handleLogout = async () => {
    try {
      // Delete session on server
      await fetch('/api/spotify/session', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear client-side data
      localStorage.removeItem('spotify_session_id');
      setIsAuthenticated(false);
      setAccessToken(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="SongStat Logo" width={32} height={32} />
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
              <ListeningHistory />
            </TabsContent>

            <TabsContent value="recommendations" className="w-full">
              <Recommendations />
            </TabsContent>

            <TabsContent value="stats" className="w-full">
              <DataVisualization />
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
