import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="dot" />
        <h1>ScoutAI</h1>
      </div>
      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme" id="theme-toggle">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && (
          <div className="user-menu" style={{ cursor: 'pointer' }} onClick={signOut}>
            <div className="user-avatar">{user.email?.charAt(0).toUpperCase() || 'U'}</div>
            <span>Sign Out</span>
          </div>
        )}
      </div>
    </header>
  );
}
