# NextSpotifySongTracker

A Next.js application that tracks your Spotify listening history and provides personalized music recommendations.

## Features

- **Multi-User Support**: Multiple users can now log in simultaneously with their own Spotify accounts
- **Session Management**: Secure server-side session management with automatic token refresh
- **Listening History**: View your recently played tracks and top tracks over different time periods
- **Music Recommendations**: Get personalized music recommendations based on your listening history
- **Data Visualization**: Visualize your listening patterns and genre preferences
- **Real-time Authentication**: Secure OAuth flow with Spotify

## Recent Improvements

### Multi-User Support
- **Problem**: Previously, only one user could log in at a time due to localStorage-based token storage
- **Solution**: Implemented server-side session management with HTTP-only cookies
- **Benefits**: 
  - Multiple users can now use the app simultaneously
  - Works across different browsers and incognito sessions
  - Secure token storage on the server
  - Automatic token refresh handling

### Session Management
- **Server-side Sessions**: Tokens are now stored securely on the server
- **HTTP-only Cookies**: Session IDs are stored in secure, HTTP-only cookies
- **Automatic Token Refresh**: Tokens are automatically refreshed when they expire
- **Session Cleanup**: Invalid sessions are automatically cleaned up

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Spotify Developer Account

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NextSpotifySongTracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add the following redirect URIs:
   - `http://127.0.0.1:3000/callback` (for development)
   - `https://your-domain.com/callback` (for production)
4. Copy the Client ID and Client Secret to your environment variables

## API Routes

### Authentication
- `POST /api/spotify/token` - Exchange authorization code for tokens
- `GET /api/spotify/session` - Validate session and get access token
- `DELETE /api/spotify/session` - Logout and delete session

### Data
- `GET /api/spotify/user-data` - Get user's top tracks and genre data
- `GET /api/spotify/recommendations` - Get music recommendations
- `GET /api/spotify/listening-history` - Get recently played and top tracks

## Architecture

### Session Management
- **In-Memory Storage**: Sessions are stored in memory (use Redis in production)
- **Cookie-based**: Session IDs are stored in HTTP-only cookies
- **Automatic Refresh**: Tokens are refreshed automatically when they expire
- **Security**: Tokens are never exposed to the client

### Multi-User Support
- Each user gets a unique session ID
- Sessions are isolated per user
- No token conflicts between users
- Works across different browsers and sessions

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Ensure your platform supports HTTP-only cookies
- Set up environment variables
- Configure redirect URIs in Spotify app settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
