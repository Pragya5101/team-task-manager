import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activePage, setActivePage] = useState('login');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (activePage === 'login' || activePage === 'signup') {
          setActivePage('dashboard');
        }
      } else {
        if (activePage !== 'signup') {
          setActivePage('login');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <h2 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>📋 TeamManager</h2>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading application details...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setNotification({ type: 'info', message: 'Logged out successfully.' });
    setActivePage('login');
  };

  return (
    <div className="app-container">
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={handleLogout} 
        user={user} 
      />

      <main className="main-content">
        {!user ? (
          <>
            {activePage === 'login' && (
              <Login 
                setActivePage={setActivePage} 
                setNotification={setNotification} 
              />
            )}
            {activePage === 'signup' && (
              <Signup 
                setActivePage={setActivePage} 
                setNotification={setNotification} 
              />
            )}
          </>
        ) : (
          <>
            {activePage === 'dashboard' && (
              <Dashboard 
                setActivePage={setActivePage} 
                setSelectedProjectId={setSelectedProjectId} 
                user={user} 
              />
            )}
            {activePage === 'projects' && (
              <ProjectList 
                setActivePage={setActivePage} 
                setSelectedProjectId={setSelectedProjectId} 
                user={user} 
                setNotification={setNotification} 
              />
            )}
            {activePage === 'project-details' && (
              <ProjectDetails 
                projectId={selectedProjectId} 
                setActivePage={setActivePage} 
                user={user} 
                setNotification={setNotification} 
              />
            )}
          </>
        )}
      </main>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </span>
          <div>{notification.message}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
