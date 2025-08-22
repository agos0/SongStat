"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "lucide-react";

interface SpotifyAuthProps {
  onAuthSuccess?: () => void;
}

const SpotifyAuth = ({ onAuthSuccess = () => {} }: SpotifyAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      // In a real implementation, this would redirect to Spotify OAuth flow
      // For now, we're just simulating the auth flow with a timeout

      // Spotify auth would typically look like:
      // 1. Redirect to Spotify authorization URL with client ID, redirect URI, and scopes
      // 2. Spotify redirects back to your app with an authorization code
      // 3. Your backend exchanges the code for access and refresh tokens

      const clientId =
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "your-client-id";
      const redirectUri = encodeURIComponent(
        window.location.origin + "/callback",
      );
      const scopes = encodeURIComponent(
        "user-read-private user-read-email user-read-recently-played user-top-read playlist-modify-public playlist-modify-private",
      );

      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;

      // In a real implementation, we would redirect to authUrl
      // window.location.href = authUrl;

      // For demo purposes, simulate successful auth after a delay
      setTimeout(() => {
        setIsLoading(false);
        onAuthSuccess();
      }, 2000);
    } catch (error) {
      console.error("Authentication error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[300px] w-full bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Connect to Spotify
          </CardTitle>
          <CardDescription>
            Log in with your Spotify account to track your listening history and
            get personalized recommendations.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center">
          <img
            src="/spotify-logo.png"
            alt="Spotify Logo"
            className="h-24 w-24 mb-4"
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.src =
                "https://api.dicebear.com/7.x/avataaars/svg?seed=spotify";
            }}
          />
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold py-2 px-6 rounded-full"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect with Spotify"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SpotifyAuth;
