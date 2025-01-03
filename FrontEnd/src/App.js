import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Appuntamenti from './Components/Appuntamenti';
import CookieBanner from './Components/CookieBanner';
import AppuntamentiDisdetti from './Components/AppuntamentiDisdetti';
import AdminDashboard from './Components/AdminDashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import AuthCallback from './Components/AuthCallback';
import UserProfile from './Components/UserProfile';
import Subscribe from './Components/Subscribe';
import PrivacyPolicy from './Components/PrivacyPolicy';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Imposta il tema iniziale
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <Router>
      <div className="App">
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        
        <Routes>
          <Route path="/" element={<Appuntamenti />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/appuntamenti-disdetti" 
            element={
              <ProtectedRoute>
                <AppuntamentiDisdetti />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscribe" 
            element={
              <ProtectedRoute>
                <Subscribe />
              </ProtectedRoute>
            } 
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
        <CookieBanner />
      </div>
    </Router>
  );
}

export default App;
