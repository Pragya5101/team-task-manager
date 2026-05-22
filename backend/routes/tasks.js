const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const isUserProjectMember = async (projectId, userId) => {
  const member = await db.get(
    'SELECT * FROM project_members WHERE projectId = ? AND userId = ?',
    [projectId, userId]
  );
  return !!member;
};

// POST /api/tasks - Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, status, priority, dueDate, projectId, assignedToId } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: 'Title and Project ID are required.' });
  }

  if (dueDate) {
    const selectedDate = new Date(dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'Due date must be today or a future date.' });
    }
  }

  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (assignedToId) {
      const isMember = await isUserProjectMember(projectId, assignedToId);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a member of this project.' });
      }
    }

    const taskStatus = status || 'To Do';
    const taskPriority = priority || 'Medium';

    const result = await db.run(
      `INSERT INTO tasks (title, description, status, priority, dueDate, projectId, assignedToId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', taskStatus, taskPriority, dueDate || '', projectId, assignedToId || null]
    );

    res.status(201).json({
      id: result.id,
      title,
      description,
      status: taskStatus,
      priority: taskPriority,
      dueDate,
      projectId,
      assignedToId,
      message: 'Task created successfully.'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error creating task.' });
  }
});

// PUT /api/tasks/:id - Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, dueDate, assignedToId } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  if (dueDate) {
    const selectedDate = new Date(dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'Due date must be today or a future date.' });
    }
  }

  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (assignedToId) {
      const isMember = await isUserProjectMember(task.projectId, assignedToId);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a member of this project.' });
      }
    }

    await db.run(
      `UPDATE tasks 
       SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, assignedToId = ? 
       WHERE id = ?`,
      [title, description || '', status || 'To Do', priority || 'Medium', dueDate || '', assignedToId || null, taskId]
    );

    res.json({ message: 'Task updated successfully.' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error updating task.' });
  }
});

// PATCH /api/tasks/:id/status - Admin or Project Member
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const { status } = req.body;

  if (!status || !['To Do', 'In Progress', 'Done'].includes(status)) {
    return res.status(400).json({ message: 'Invalid task status.' });
  }

  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    let hasAccess = false;
    if (req.user.role === 'Admin') {
      hasAccess = true;
    } else {
      const isMember = await isUserProjectMember(task.projectId, req.user.id);
      if (isMember) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this project.' });
    }

    await db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    res.json({ message: 'Task status updated successfully.', status });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Internal server error updating task status.' });
  }
});

// DELETE /api/tasks/:id - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error deleting task.' });
  }
});

module.exports = router;
