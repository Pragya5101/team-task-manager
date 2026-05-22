const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
db.initDb().then(() => {
  console.log('Database system initialized.');
});

// REST API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// Static Client assets support (Single Process Mode)
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback SPA routing support
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({
        message: 'Team Task Manager REST API is running successfully. Build the frontend to view the complete client UI.'
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
