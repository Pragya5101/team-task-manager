Team-task-manager
The project is a collaborative Team Task Management System designed for teams to organize workflows, track project milestones, and assign tasks among members. The application uses a Role-Based Access Control (RBAC) system with two distinct user roles:

Admins: Have high-level management privileges. They can create or delete projects, invite teammates to join projects, and create, modify, or delete tasks on the project boards.
Members: Have collaborative access. They can view the projects they belong to, see their assigned tasks, and update task progress states (e.g., moving a task from "To Do" to "In Progress" or "Done").

Tech Stack Architecture
The system is split into two major component layers: the Backend (Server & Database) and the Frontend (User Interface).

1. The Backend Layer (/backend)
The backend is responsible for data storage, route guards, API logic, and secure authentication.
Server Engine: Built using Node.js and Express.js to handle HTTP requests and expose structured JSON REST API endpoints under the /api namespace.
Database: Uses SQLite (a lightweight, file-based relational database) managed via asynchronous, Promise-wrapped database drivers in db.js.
Relational Schema: The database includes four primary linked tables:
users: Stores user credentials (name, email, secure hashed password, and role).
projects: Stores project metadata and links them to an owner (ownerId).
project_members: Handles the many-to-many relationship linking multiple users to multiple project workspaces.
tasks: Holds individual task details, priorities (Low, Medium, High), status lanes (To Do, In Progress, Done), due dates, and foreign keys associating them to a specific project (projectId) and assignee (assignedToId).
Authentication & Security:
Password Hashing: User passwords are encrypted using bcryptjs before storage to protect credentials.
JSON Web Tokens (JWT): Implements secure, stateless sessions. When users log in, the server generates a signed token containing their identity and role, which the client includes in subsequent request headers.
Access Controls: Middleware functions like authenticateToken and requireAdmin guard sensitive endpoints, verifying JWT signatures and restricting administrative operations.

2. The Frontend Layer (/frontend)
The frontend is a fast, responsive Single Page Application (SPA) that provides a premium user experience.
UI Framework: Built with React and bundled using Vite for fast, optimized compilation.
Visual Design (Minimalist Slate Theme):
Uses a human-written, clean flat slate theme. It avoids busy glowing components in favor of clean slate-50 (#f8fafc) page backgrounds, solid white card modules (#ffffff), slate-900 primary text, and clean borders (#e2e8f0).
Features soft pastel-colored badges and clear typography (using Google's Inter font family) for maximum readability.
Dynamic Kanban Board: Inside project details, tasks are arranged in a flat visual board categorized into columns ("To Do", "In Progress", "Done"). Users can instantly change task states using quick-select dropdown selectors.
State & Session Context: A custom React Context provider (AuthContext.jsx) stores the active logged-in user state and handles token storage in the browser's localStorage so sessions persist across page refreshes.
Input Constraints: Enforces that task due dates must be today or in the future only. This is locked on the frontend calendar UI via a dynamic min attribute on the HTML date picker and secured by secondary validation rules in the form submit handler.

Development Execution Flow
The project is unified at the root folder so developers can start both servers concurrently with a single command:

Unified Package Controller: A root package.json file uses a utility called concurrently to run two prefixes simultaneously.
Launching Server Env: Running npm run dev kicks off:
The Backend Server: Boots up on port 5000.
The Frontend Client: Starts the Vite dev server on port 5173 (or 5174 if in use).
