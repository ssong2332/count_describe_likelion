import { useState, useEffect } from 'react';
import { UserSession } from './domain/types';
import { JoinScreen } from './components/join/JoinScreen';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { UserControlPanel } from './components/user-panel/UserControlPanel';

const SESSION_STORAGE_KEY = 'count_status_user_session';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved session', e);
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const handleJoinSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  return (
    <div className="app-container">
      {!session ? (
        <JoinScreen onJoinSuccess={handleJoinSuccess} />
      ) : session.role === 'admin' ? (
        <AdminDashboard
          roomId={session.roomId}
          onLogout={handleLogout}
          onSwitchRoom={(newRoomId) => setSession({ role: 'admin', roomId: newRoomId })}
        />
      ) : (
        <UserControlPanel
          roomId={session.roomId}
          memberId={session.memberId || ''}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
