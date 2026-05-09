import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

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
      </div>
    </header>
  );
}
