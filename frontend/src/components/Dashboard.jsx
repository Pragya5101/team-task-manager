import React, { useEffect, useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function Dashboard({
  setActivePage,
  setSelectedProjectId,
  user,
}) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardData();
  }, []);

  const getDashboardData = async () => {
    try {
      setLoading(true);

      const projectList = await fetchAPI('/api/projects');
      setProjects(projectList);

      const taskData = await Promise.all(
        projectList.map((project) =>
          fetchAPI(`/api/projects/${project.id}`)
        )
      );

      const allTasks = [];

      taskData.forEach((project) => {
        if (project.tasks?.length) {
          project.tasks.forEach((task) => {
            allTasks.push({
              ...task,
              projectName: project.name,
            });
          });
        }
      });

      setTasks(allTasks);
    } catch (err) {
      console.log(err);
      setError('Something went wrong while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  let completed = 0;
  let pending = 0;
  let inProgress = 0;
  let overdue = 0;

  const today = new Date();

  tasks.forEach((task) => {
    if (task.status === 'Done') {
      completed++;
    } else if (task.status === 'In Progress') {
      inProgress++;
    } else {
      pending++;
    }

    if (task.dueDate && task.status !== 'Done') {
      const dueDate = new Date(task.dueDate);

      if (dueDate < today) {
        overdue++;
      }
    }
  });

  const totalTasks = tasks.length;
  const progress =
    totalTasks > 0
      ? Math.round((completed / totalTasks) * 100)
      : 0;

  const importantTasks = [...tasks]
    .filter((task) => task.status !== 'Done')
    .sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 4);

  const openProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActivePage('project-details');
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          marginTop: '100px',
          fontSize: '18px',
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '10px' }}>
      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ marginBottom: '5px' }}>
          Welcome, {user.name}
        </h2>

        <p style={{ color: '#888', fontSize: '14px' }}>
          Here's a quick overview of your work.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            color: '#d32f2f',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Top Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4>Total Projects</h4>
          <h2>{projects.length}</h2>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4>Total Tasks</h4>
          <h2>{tasks.length}</h2>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4>Completed</h4>
          <h2>{completed}</h2>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4>Overdue</h4>
          <h2>{overdue}</h2>
        </div>
      </div>

      {/* Progress */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <h3>Project Progress</h3>
          <span>{progress}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: '10px',
            background: '#ddd',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#4caf50',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '15px',
            flexWrap: 'wrap',
          }}
        >
          <span>Pending: {pending}</span>
          <span>In Progress: {inProgress}</span>
          <span>Completed: {completed}</span>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h3>Tasks to Do</h3>

          <button
            onClick={() => setActivePage('projects')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#4f46e5',
            }}
          >
            View Projects
          </button>
        </div>

        {importantTasks.length === 0 ? (
          <p style={{ color: '#777' }}>
            No pending tasks available.
          </p>
        ) : (
          importantTasks.map((task) => (
            <div
              key={task.id}
              onClick={() =>
                openProject(task.projectId)
              }
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '12px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {task.title}
                </h4>

                <span
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background:
                      task.priority === 'High'
                        ? '#ffebee'
                        : '#e3f2fd',
                  }}
                >
                  {task.priority}
                </span>
              </div>

              <p
                style={{
                  color: '#777',
                  marginTop: '8px',
                  fontSize: '14px',
                }}
              >
                {task.projectName}
              </p>

              {task.dueDate && (
                <small>
                  Due: {task.dueDate}
                </small>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}