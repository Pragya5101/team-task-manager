import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import TaskModal from './TaskModal';

export default function ProjectDetails({ projectId, setActivePage, user, setNotification }) {
  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInviteUserId, setSelectedInviteUserId] = useState('');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const projData = await fetchAPI(`/api/projects/${projectId}`);
      setProject(projData);

      if (user.role === 'Admin') {
        const usersList = await fetchAPI('/api/users');
        setAllUsers(usersList);
      }
    } catch (err) {
      console.error('Error loading project details:', err);
      setNotification({ type: 'error', message: 'Failed to load project details.' });
      setActivePage('projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Retrieving project details...</div>
      </div>
    );
  }

  if (!project) return null;

  const isAdmin = user.role === 'Admin';

  const inviteCandidates = allUsers.filter(
    (u) => !project.members.some((m) => m.id === u.id)
  );

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedInviteUserId) return;

    try {
      await fetchAPI(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: { userId: parseInt(selectedInviteUserId) }
      });
      setNotification({ type: 'success', message: 'Team member added successfully!' });
      setSelectedInviteUserId('');
      loadProjectData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to add member.' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member? Active tasks assigned to them will be unassigned.')) {
      return;
    }

    try {
      await fetchAPI(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE'
      });
      setNotification({ type: 'success', message: 'Member removed from project.' });
      loadProjectData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to remove member.' });
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete this project? All associated tasks will be lost.')) {
      return;
    }

    try {
      await fetchAPI(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      setNotification({ type: 'success', message: 'Project deleted successfully.' });
      setActivePage('projects');
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete project.' });
    }
  };

  const handleOpenCreateTask = () => {
    setActiveTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setActiveTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskPayload) => {
    try {
      if (activeTask) {
        await fetchAPI(`/api/tasks/${activeTask.id}`, {
          method: 'PUT',
          body: taskPayload
        });
        setNotification({ type: 'success', message: 'Task updated successfully!' });
      } else {
        await fetchAPI('/api/tasks', {
          method: 'POST',
          body: {
            ...taskPayload,
            projectId: parseInt(projectId)
          }
        });
        setNotification({ type: 'success', message: 'New task created successfully!' });
      }
      setIsTaskModalOpen(false);
      loadProjectData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to save task.' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await fetchAPI(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      setNotification({ type: 'success', message: 'Task deleted successfully.' });
      loadProjectData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete task.' });
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await fetchAPI(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      setNotification({ type: 'success', message: `Task moved to ${newStatus}` });
      loadProjectData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update task status.' });
    }
  };

  const lanes = {
    'To Do': project.tasks.filter((t) => t.status === 'To Do'),
    'In Progress': project.tasks.filter((t) => t.status === 'In Progress'),
    'Done': project.tasks.filter((t) => t.status === 'Done')
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div>
      {/* Project Header Card */}
      <div className="glass-panel project-header-panel" style={{ marginBottom: '28px' }}>
        <div className="project-header-top">
          <div className="project-meta-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="btn btn-secondary btn-sm" onClick={() => setActivePage('projects')}>
                ← Back to Projects
              </span>
            </div>
            <h1 style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
            <p>{project.description || 'No description provided.'}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Created: <strong>{new Date(project.createdAt).toLocaleDateString()}</strong> &bull; Owner: <strong>{project.ownerName || 'Admin'}</strong>
            </div>
          </div>

          {isAdmin && (
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              🗑️ Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Main Board & Members Split Grid */}
      <div className="project-detail-grid">
        {/* Kanban Board Container */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Task Board</h2>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreateTask}>
                ➕ Create Task
              </button>
            )}
          </div>

          <div className="kanban-board">
            {Object.keys(lanes).map((laneName) => {
              const laneTasks = lanes[laneName];
              const columnBadgeClass = 
                laneName === 'To Do' ? 'badge-todo' : 
                laneName === 'In Progress' ? 'badge-inprogress' : 
                'badge-done';

              return (
                <div key={laneName} className="kanban-column">
                  <div className="kanban-column-header">
                    <h3>
                      <span className={`badge ${columnBadgeClass}`} style={{ width: '8px', height: '8px', padding: '0', borderRadius: '50%' }}></span>
                      {laneName}
                    </h3>
                    <span className="kanban-column-count">{laneTasks.length}</span>
                  </div>

                  <div className="kanban-cards-wrapper">
                    {laneTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                        No tasks in this column.
                      </div>
                    ) : (
                      laneTasks.map((t) => {
                        const isOverdue = t.dueDate && new Date(t.dueDate) < today && t.status !== 'Done';
                        return (
                          <div key={t.id} className="glass-panel task-card">
                            <div className="task-card-header">
                              <span className={`badge badge-${t.priority.toLowerCase()}`}>
                                {t.priority}
                              </span>
                              
                              <select
                                className="status-quick-select"
                                value={t.status}
                                onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                            </div>

                            <h4 className="task-card-title">{t.title}</h4>
                            {t.description && <p className="task-card-desc">{t.description}</p>}

                            <div className="task-card-footer">
                              <div className="task-assignee">
                                <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem' }}>
                                  {t.assigneeName ? t.assigneeName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85px', color: 'var(--text-secondary)' }}>
                                  {t.assigneeName || 'Unassigned'}
                                </span>
                              </div>

                              {t.dueDate && (
                                <span className={`task-due-date ${isOverdue ? 'badge-overdue' : ''}`} style={{ padding: isOverdue ? '1px 6px' : '', borderRadius: isOverdue ? '4px' : '' }}>
                                  📅 {t.dueDate}
                                </span>
                              )}
                            </div>

                            {isAdmin && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                <button className="icon-btn" title="Edit Task" onClick={() => handleOpenEditTask(t)}>
                                  ✏️
                                </button>
                                <button className="icon-btn icon-btn-danger" title="Delete Task" onClick={() => handleDeleteTask(t.id)}>
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Members Panel */}
        <div className="glass-panel members-panel">
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-primary)' }}>
            👥 Teammates
          </h3>

          <div className="members-list">
            {project.members.map((m) => {
              const isOwner = project.ownerId === m.id;
              return (
                <div key={m.id} className="member-row">
                  <div className="member-info">
                    <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-details">
                      <span className="member-name">{m.name}</span>
                      <span className="member-email">{m.email}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isOwner ? (
                      <span className="user-role admin" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Owner</span>
                    ) : (
                      <span className={`user-role ${m.role.toLowerCase()}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>{m.role}</span>
                    )}

                    {isAdmin && !isOwner && (
                      <button 
                        className="icon-btn icon-btn-danger" 
                        title="Remove member"
                        style={{ width: '22px', height: '22px', fontSize: '0.8rem' }}
                        onClick={() => handleRemoveMember(m.id)}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invite Widget */}
          {isAdmin && inviteCandidates.length > 0 && (
            <form onSubmit={handleAddMember} className="invite-form" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <select
                className="invite-select"
                value={selectedInviteUserId}
                onChange={(e) => setSelectedInviteUserId(e.target.value)}
                required
              >
                <option value="">Select teammate to add...</option>
                {inviteCandidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Add Teammate
              </button>
            </form>
          )}

          {isAdmin && inviteCandidates.length === 0 && (
            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              All users are members of this project.
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={activeTask}
        members={project.members}
      />
    </div>
  );
}
