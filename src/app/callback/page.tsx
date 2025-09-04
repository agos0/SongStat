"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing attempts
      if (isProcessing) {
        console.log('Already processing, skipping duplicate request');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError(`Authentication failed: ${error}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      console.log('Starting token exchange for code:', code.substring(0, 10) + '...');
      setIsProcessing(true);

      try {
        // Exchange authorization code for tokens
        const response = await fetch('/api/spotify/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Token exchange failed:', errorData);
          
          // Handle specific Spotify errors
          if (errorData.error === 'invalid_grant') {
            setError('Authorization code expired or already used. Please try logging in again.');
          } else {
            const errorMessage = errorData.details?.error_description || errorData.error || 'Failed to exchange code for tokens';
            setError(errorMessage);
          }
          return;
        }

        const data = await response.json();
        
        // Store session ID in localStorage for client-side access
        if (data.sessionId) {
          localStorage.setItem('spotify_session_id', data.sessionId);
          
          // Verify session was created successfully
          console.log('Session created, verifying...');
          
          // Small delay to ensure session is properly stored
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify session is working
          const sessionCheck = await fetch('/api/spotify/session', {
            credentials: 'include',
          });
          
          if (sessionCheck.ok) {
            console.log('Session verified successfully');
            // Redirect back to the main page
            router.push('/');
          } else {
            console.error('Session verification failed');
            setError('Session verification failed. Please try again.');
          }
        } else {
          setError('No session ID received');
        }
      } catch (err) {
        console.error('Token exchange error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    // Only run once when component mounts
    handleCallback();
  }, []); // Remove dependencies to prevent multiple executions

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completing Authentication...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
