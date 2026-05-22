import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

export default function ProjectList({ setActivePage, setSelectedProjectId, user, setNotification }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setNotification({ type: 'error', message: 'Failed to load projects.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Project name is required.');
      return;
    }
    setError('');
    setCreateLoading(true);

    try {
      await fetchAPI('/api/projects', {
        method: 'POST',
        body: { name, description }
      });
      setNotification({ type: 'success', message: 'Project created successfully!' });
      setName('');
      setDescription('');
      setShowModal(false);
      loadProjects();
    } catch (err) {
      setError(err.message || 'Failed to create project.');
      setNotification({ type: 'error', message: err.message || 'Failed to create project.' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleProjectClick = (id) => {
    setSelectedProjectId(id);
    setActivePage('project-details');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading projects...</div>
      </div>
    );
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Projects Showcase</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Manage, track, and customize team project environments.' : 'Select a project to view details and update task progress.'}
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel empty-state">
          <span className="empty-icon">📁</span>
          <h3 className="empty-title">No Projects Active</h3>
          <p className="empty-desc">
            {isAdmin 
              ? 'Get started by creating your very first project workspace.' 
              : 'You are not assigned as a member of any projects. Please request assignment from an Admin.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <div 
              key={p.id} 
              className="glass-panel project-card"
              onClick={() => handleProjectClick(p.id)}
            >
              <div className="project-card-header">
                <h3 className="project-card-title">{p.name}</h3>
                <p className="project-card-desc">{p.description || 'No description provided.'}</p>
              </div>

              <div className="project-card-footer">
                <span style={{ fontSize: '0.8rem' }}>Owner: <strong>{p.ownerName || 'Admin'}</strong></span>
                <div className="project-stats">
                  <div className="project-stat-item">
                    <span>👥</span>
                    <strong>{p.memberCount}</strong>
                  </div>
                  <div className="project-stat-item">
                    <span>📋</span>
                    <strong>{p.taskCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              &times;
            </button>
            <h2 className="modal-title">Create New Project</h2>

            {error && (
              <div className="form-error" style={{ marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Alpha Release Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Summarize the core goals and timelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
