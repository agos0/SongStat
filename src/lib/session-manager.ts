// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, any>();

// Helper function to get session data
export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

// Helper function to update session
export function updateSession(sessionId: string, data: any) {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.set(sessionId, { ...session, ...data });
  }
}

// Helper function to delete session
export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}

// Helper function to create session
export function createSession(sessionId: string, sessionData: any) {
  sessions.set(sessionId, sessionData);
}

// Helper function to get all sessions (for debugging)
export function getAllSessions() {
  return Array.from(sessions.entries());
}
