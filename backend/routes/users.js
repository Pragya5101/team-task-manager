const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, email, role FROM users ORDER BY name ASC');
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Internal server error listing users.' });
  }
});

module.exports = router;
