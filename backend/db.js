const fs = require('fs');
const path = require('path');

// Ensure environment variables are loaded
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = !!dbUrl;

let db = null;   // SQLite database instance
let pool = null; // PostgreSQL pool instance

let query, get, run, initDb;

if (isPostgres) {
  const { Pool } = require('pg');

  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const poolConfig = {
    connectionString: dbUrl,
  };

  // Cloud hosted databases like Neon, Supabase, and Render usually require SSL.
  // We enable SSL with rejectUnauthorized: false, but bypass it for local Postgres instances.
  if (!isLocalhost) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database successfully.');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  // Query helper (returns array of rows)
  query = async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  };

  // Get helper (returns single row or undefined)
  get = async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows[0];
  };

  // Run helper (executes query and returns metadata like last insert ID and rows affected)
  run = async (sql, params = []) => {
    let index = 1;
    let pgSql = sql;
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');

    if (isInsert) {
      // Append RETURNING id to insert statements to retrieve the auto-generated SERIAL ID.
      // We trim any trailing semicolon if present to avoid syntax errors.
      let trimmedSql = sql.trim();
      if (trimmedSql.endsWith(';')) {
        trimmedSql = trimmedSql.slice(0, -1);
      }
      pgSql = trimmedSql.replace(/\?/g, () => `$${index++}`) + ' RETURNING id';
    } else {
      pgSql = sql.replace(/\?/g, () => `$${index++}`);
    }

    const res = await pool.query(pgSql, params);
    return {
      id: isInsert && res.rows[0] ? res.rows[0].id : null,
      changes: res.rowCount
    };
  };

  // Initialize DB tables for PostgreSQL
  initDb = async () => {
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) CHECK(role IN ('Admin', 'Member')) NOT NULL DEFAULT 'Member',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          ownerId INTEGER REFERENCES users(id) ON DELETE SET NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS project_members (
          id SERIAL PRIMARY KEY,
          projectId INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
          joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_project_user UNIQUE(projectId, userId)
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) CHECK(status IN ('To Do', 'In Progress', 'Done')) NOT NULL DEFAULT 'To Do',
          priority VARCHAR(50) CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
          dueDate VARCHAR(50),
          projectId INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          assignedToId INTEGER REFERENCES users(id) ON DELETE SET NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('PostgreSQL database tables initialized successfully.');
    } catch (error) {
      console.error('Error during PostgreSQL database table initialization:', error);
      process.exit(1);
    }
  };

} else {
  // SQLite Mode (Default / Local Development)
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

  // Ensure the parent directory for the database exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory at:', dbDir);
    } catch (err) {
      console.error('Failed to create database directory:', err);
    }
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite database:', err);
    } else {
      console.log('Connected to SQLite database at', dbPath);
      db.run('PRAGMA foreign_keys = ON;');
    }
  });

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  initDb = async () => {
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('Admin', 'Member')) NOT NULL DEFAULT 'Member',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          ownerId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS project_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          projectId INTEGER,
          userId INTEGER,
          joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(projectId, userId)
        )
      `);

      await run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT CHECK(status IN ('To Do', 'In Progress', 'Done')) NOT NULL DEFAULT 'To Do',
          priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
          dueDate TEXT,
          projectId INTEGER,
          assignedToId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY(assignedToId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      console.log('SQLite database tables initialized successfully.');
    } catch (error) {
      console.error('Error during SQLite database table initialization:', error);
      process.exit(1);
    }
  };
}

module.exports = {
  db,
  pool,
  isPostgres,
  query,
  get,
  run,
  initDb
};
