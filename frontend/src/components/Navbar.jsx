import React from 'react';

export default function Navbar({ activePage, setActivePage, onLogout, user }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => user ? setActivePage('dashboard') : setActivePage('login')}>
          📋 TeamManager
        </div>
        
        {user ? (
          <>
            <div className="navbar-menu">
              <span 
                className={`navbar-link ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('dashboard')}
              >
                Dashboard
              </span>
              <span 
                className={`navbar-link ${activePage === 'projects' || activePage === 'project-details' ? 'active' : ''}`}
                onClick={() => setActivePage('projects')}
              >
                Projects
              </span>
            </div>
            
            <div className="navbar-user">
              <div className="user-badge">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                  <span className={`user-role ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginLeft: '8px' }} onClick={onLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-menu">
            <span 
              className={`navbar-link ${activePage === 'login' ? 'active' : ''}`}
              onClick={() => setActivePage('login')}
            >
              Login
            </span>
            <span 
              className={`navbar-link ${activePage === 'signup' ? 'active' : ''}`}
              onClick={() => setActivePage('signup')}
            >
              Register
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
