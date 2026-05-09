import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="login-page"><span className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return user ? <Dashboard /> : <LoginPage />;
}
