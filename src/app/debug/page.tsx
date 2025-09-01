"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/spotify/debug', {
        credentials: 'include',
      });
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error fetching debug info:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const clearSession = async () => {
    try {
      await fetch('/api/spotify/session', {
        method: 'DELETE',
        credentials: 'include',
      });
      localStorage.removeItem('spotify_session_id');
      fetchDebugInfo();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Debug Information</h1>
          <div className="space-x-2">
            <Button onClick={fetchDebugInfo} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={clearSession}>
              Clear Session
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <Badge variant={debugInfo.environment === 'development' ? 'default' : 'secondary'}>
                    {debugInfo.environment}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Client ID:</span>
                  <Badge variant={debugInfo.hasClientId ? 'default' : 'destructive'}>
                    {debugInfo.hasClientId ? 'Set' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Client Secret:</span>
                  <Badge variant={debugInfo.hasClientSecret ? 'default' : 'destructive'}>
                    {debugInfo.hasClientSecret ? 'Set' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span className="text-sm text-muted-foreground">{debugInfo.timestamp}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Session Cookie:</span>
                  <Badge variant={debugInfo.hasSessionCookie ? 'default' : 'destructive'}>
                    {debugInfo.hasSessionCookie ? 'Present' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="text-sm font-mono">{debugInfo.sessionId}</span>
                </div>
                
                {debugInfo.session && (
                  <>
                    <div className="flex justify-between">
                      <span>Session Exists:</span>
                      <Badge variant={debugInfo.session.exists ? 'default' : 'destructive'}>
                        {debugInfo.session.exists ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {debugInfo.session.exists && (
                      <>
                        <div className="flex justify-between">
                          <span>Token Age:</span>
                          <span className="text-sm">{debugInfo.session.tokenAge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expires In:</span>
                          <span className="text-sm">{debugInfo.session.expiresIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Is Expired:</span>
                          <Badge variant={debugInfo.session.isExpired ? 'destructive' : 'default'}>
                            {debugInfo.session.isExpired ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Has Refresh Token:</span>
                          <Badge variant={debugInfo.session.hasRefreshToken ? 'default' : 'secondary'}>
                            {debugInfo.session.hasRefreshToken ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Has Access Token:</span>
                          <Badge variant={debugInfo.session.hasAccessToken ? 'default' : 'destructive'}>
                            {debugInfo.session.hasAccessToken ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </>
                )}
                
                {debugInfo.session?.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <span className="text-destructive text-sm">{debugInfo.session.error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {debugInfo.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive">{debugInfo.error}</p>
                  {debugInfo.details && (
                    <p className="text-sm text-muted-foreground mt-2">{debugInfo.details}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
