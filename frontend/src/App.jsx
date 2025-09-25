import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PlaceBid from './pages/PlaceBid';
import MyBids from './pages/MyBids';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPanel from './pages/AdminPanel';
import { me } from './services/api';

export default function App() {
  const [token, setToken] = React.useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    if (token) {
      (async () => {
        try {
          const data = await me(token);
          setUser(data.data);
        } catch {
          setUser(null);
        }
      })();
    }
  }, [token]);

  const handleAuth = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const RequireAuth = ({ children }) => {
    if (!token) return <Navigate to="/login" />;
    return children;
  };

  // Wrap routes in a component to use useNavigate
  const AppRoutes = () => {
    const navigate = useNavigate();

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard token={token} /></RequireAuth>} />
        <Route path="/place" element={<RequireAuth><PlaceBid token={token} onRequireAuth={() => {}} /></RequireAuth>} />
        <Route path="/mybids" element={<RequireAuth><MyBids token={token} onRequireAuth={() => {}} /></RequireAuth>} />
        <Route path="/login" element={<Login onAuth={handleAuth} onGotoSignup={() => navigate('/signup')} />} />
        <Route path="/signup" element={<Signup onGotoLogin={() => navigate('/login')} />} />
        <Route path="/admin" element={<RequireAuth><AdminPanel token={token} /></RequireAuth>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    );
  };

  return (
    <Router>
      <div className="app" style={{ padding: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>BTC: Up or Down</h1>
            <nav style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/place">Place Bid</Link>
              <Link to="/mybids">My Bids</Link>
              {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
              {!token && <Link to="/signup">Signup</Link>}
              {!token && <Link to="/login">Login</Link>}
              {token && <button onClick={handleLogout}>Logout</button>}
            </nav>
          </div>
          <div>{token ? <small>Authenticated</small> : <small>Not logged in</small>}</div>
        </header>

        <main style={{ marginTop: 20 }}>
          <AppRoutes />
        </main>
      </div>
    </Router>
  );
}
