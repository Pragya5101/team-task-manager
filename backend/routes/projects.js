const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await db.query(`
        SELECT p.*, u.name as ownerName 
        FROM projects p 
        LEFT JOIN users u ON p.ownerId = u.id
        ORDER BY p.createdAt DESC
      `);
    } else {
      projects = await db.query(`
        SELECT DISTINCT p.*, u.name as ownerName 
        FROM projects p 
        LEFT JOIN users u ON p.ownerId = u.id
        INNER JOIN project_members pm ON p.id = pm.projectId
        WHERE pm.userId = ?
        ORDER BY p.createdAt DESC
      `, [req.user.id]);
    }

    for (let proj of projects) {
      const taskCount = await db.get('SELECT COUNT(*) as count FROM tasks WHERE projectId = ?', [proj.id]);
      const memberCount = await db.get('SELECT COUNT(*) as count FROM project_members WHERE projectId = ?', [proj.id]);
      proj.taskCount = taskCount.count;
      proj.memberCount = memberCount.count;
    }

    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Internal server error listing projects.' });
  }
});

// POST /api/projects - Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required.' });
  }

  try {
    const result = await db.run(
      'INSERT INTO projects (name, description, ownerId) VALUES (?, ?, ?)',
      [name, description || '', req.user.id]
    );

    // Owner is automatically a member
    await db.run(
      'INSERT INTO project_members (projectId, userId) VALUES (?, ?)',
      [result.id, req.user.id]
    );

    res.status(201).json({
      id: result.id,
      name,
      description,
      ownerId: req.user.id,
      message: 'Project created successfully.'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error creating project.' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const projectId = req.params.id;

  try {
    let hasAccess = false;
    if (req.user.role === 'Admin') {
      hasAccess = true;
    } else {
      const membership = await db.get(
        'SELECT * FROM project_members WHERE projectId = ? AND userId = ?',
        [projectId, req.user.id]
      );
      if (membership) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this project.' });
    }

    const project = await db.get(`
      SELECT p.*, u.name as ownerName 
      FROM projects p 
      LEFT JOIN users u ON p.ownerId = u.id
      WHERE p.id = ?
    `, [projectId]);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const members = await db.query(`
      SELECT u.id, u.name, u.email, u.role, pm.joinedAt 
      FROM users u
      INNER JOIN project_members pm ON u.id = pm.userId
      WHERE pm.projectId = ?
      ORDER BY u.name ASC
    `, [projectId]);

    const tasks = await db.query(`
      SELECT t.*, u.name as assigneeName, u.email as assigneeEmail 
      FROM tasks t
      LEFT JOIN users u ON t.assignedToId = u.id
      WHERE t.projectId = ?
      ORDER BY t.createdAt DESC
    `, [projectId]);

    res.json({
      ...project,
      members,
      tasks
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    res.status(500).json({ message: 'Internal server error fetching project.' });
  }
});

// DELETE /api/projects/:id - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const projectId = req.params.id;

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error deleting project.' });
  }
});

// POST /api/projects/:id/members - Admin only
router.post('/:id/members', authenticateToken, requireAdmin, async (req, res) => {
  const projectId = req.params.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existing = await db.get(
      'SELECT * FROM project_members WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );
    if (existing) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    await db.run(
      'INSERT INTO project_members (projectId, userId) VALUES (?, ?)',
      [projectId, userId]
    );

    res.status(201).json({ message: 'Member added to project successfully.' });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ message: 'Internal server error adding project member.' });
  }
});

// DELETE /api/projects/:id/members/:userId - Admin only
router.delete('/:id/members/:userId', authenticateToken, requireAdmin, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.params.userId;

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.ownerId === parseInt(userId)) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    const existing = await db.get(
      'SELECT * FROM project_members WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );
    if (!existing) {
      return res.status(404).json({ message: 'User is not a member of this project.' });
    }

    await db.run(
      'DELETE FROM project_members WHERE projectId = ? AND userId = ?',
      [projectId, userId]
    );

    // Unassign tasks assigned to this user inside this project
    await db.run(
      'UPDATE tasks SET assignedToId = NULL WHERE projectId = ? AND assignedToId = ?',
      [projectId, userId]
    );

    res.json({ message: 'Member removed from project successfully.' });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ message: 'Internal server error removing project member.' });
  }
});

module.exports = router;
