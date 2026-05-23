========================================================================
                          TEAM TASK MANAGER
========================================================================

A premium, collaborative Team Task Management System designed for modern
teams to organize workflows, track project milestones, and assign tasks
among members. The application features a secure, asynchronous Role-Based
Access Control (RBAC) architecture and supports dual database operational
modes (local SQLite for development and remote PostgreSQL / Cloud Hosted
databases for production).

------------------------------------------------------------------------
1. KEY FEATURES
------------------------------------------------------------------------

* ROLE-BASED ACCESS CONTROL (RBAC)
  - Admins: High-level privileges. Create/delete projects, invite team
    members, and perform full CRUD (Create, Read, Update, Delete)
    operations on tasks.
  - Members: Collaborative access. View projects they belong to, see
    their assigned tasks, and update task progress (e.g., transition
    state from "To Do" to "In Progress" or "Done").

* DUAL-ENGINE DATABASE ARCHITECTURE
  - SQLite Mode: Single-file local relational database setup out of the
    box. Perfect for offline sandbox environments and swift zero-config
    local development.
  - PostgreSQL Mode: Seamless switch to enterprise-ready, remote, or
    cloud-hosted database systems (e.g., Neon, Supabase, AWS RDS) via
    environment variable mapping. Includes automatic SSL configuration
    and pooled client connections.

* SECURE AUTHENTICATION & SESSION CONTROLS
  - Password Hashing: Fully encrypted storage of passwords using bcryptjs.
  - JWT Handshakes: Secure, stateless session tokens embedded inside
    client request headers.
  - Route Guards: Asynchronous backend middleware checks user identities
    (authenticateToken) and restricts administrative tasks (requireAdmin).

* VIBRANT AND MINIMALIST SLATE UI
  - Crafted with a premium Minimalist Slate Theme (slate-50 backgrounds,
    pure white cards, sleek border outlines, pastel badges, and modern
    Inter typography).
  - Interactive Kanban Board: Displays task cards categorized by lane
    states ("To Do", "In Progress", "Done"). Statuses can be altered
    using in-card dropdown selectors.
  - Data Constraints: Future-locked calendar date inputs prevent tasks
    from having past due dates (secured on both frontend and backend).

------------------------------------------------------------------------
2. PROJECT ARCHITECTURE
------------------------------------------------------------------------

The codebase is organized as a unified monorepo-style structure using
npm workspaces to easily manage and execute backend and frontend
environments concurrently.

team-task-manager/
├── backend/                  # REST API Server & Database Layer
│   ├── middleware/           # Security guards & route interceptors
│   │   └── auth.js
│   ├── routes/               # API Router Handlers
│   │   ├── auth.js           # Signup & JWT login sessions
│   │   ├── projects.js       # Project CRUD & invitations
│   │   ├── tasks.js          # Task CRUD & state mutations
│   │   └── users.js          # Team directory listings
│   ├── .env.example          # Environment variable template
│   ├── database.sqlite       # Local development SQLite file (Git ignored)
│   ├── db.js                 # Dual SQLite / Postgres connector
│   ├── package.json          # Node dependencies & setup scripts
│   └── server.js             # Express app bootstrap & port binding
├── frontend/                 # User Interface Layer (Single Page Application)
│   ├── public/               # Static assets & icons
│   ├── src/                  # React Core Files
│   │   ├── components/       # Interface views & UI modals
│   │   │   ├── Dashboard.jsx      # Workspace overview & statistics
│   │   │   ├── Login.jsx          # Secure login modal
│   │   │   ├── Signup.jsx         # Secure registration modal
│   │   │   ├── Navbar.jsx         # Brand logo & profile context
│   │   │   ├── ProjectList.jsx    # Project grid display
│   │   │   ├── ProjectDetails.jsx # Kanban board & collaborative workspace
│   │   │   └── TaskModal.jsx      # Task creator & editor module
│   │   ├── context/          # React Global State
│   │   │   └── AuthContext.jsx    # Session & token handlers
│   │   ├── utils/            # Shared utilities
│   │   │   └── api.js            # Axios-like custom fetch wrappers
│   │   ├── App.jsx           # Routing & view-switching hub
│   │   ├── index.css         # Styling system (Inter Font & Slate tokens)
│   │   └── main.jsx          # Entry point
│   ├── index.html            # Vite app template
│   ├── package.json          # Frontend packages & dev dependencies
│   └── vite.config.js        # Vite bundler options
├── package.json              # Root-level unified NPM workspace config
├── README.md                 # Primary markdown documentation
└── README.txt                # This plain text documentation file

------------------------------------------------------------------------
3. ENVIRONMENT CONFIGURATION
------------------------------------------------------------------------

To run the backend server, navigate to the backend/ directory and
configure your environment variables.

1. Copy the example env template:
   $ cp backend/.env.example backend/.env

2. Open backend/.env and update the configurations:
   
   # Port the backend server will listen on
   PORT=5000

   # Secret key used to sign and verify JSON Web Tokens (JWT)
   JWT_SECRET=your_long_and_secure_random_secret_key_here

   # Database connection string (PostgreSQL)
   # E.g., Neon: postgresql://[USER]:[PASSWORD]@ep-[HOST].neon.tech/neondb?sslmode=require
   # E.g., Supabase: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   # Leave this empty to fall back to the local SQLite database file (database.sqlite)
   DATABASE_URL=

------------------------------------------------------------------------
4. GETTING STARTED
------------------------------------------------------------------------

Prerequisites:
- Node.js (v16.x or higher)
- npm (v7.x or higher)

* STEP 1: Installation
  Install all root, backend, and frontend packages simultaneously:
  $ npm install

* STEP 2: Run in Development Mode
  Start both Express backend and Vite frontend concurrently:
  $ npm run dev

  - Backend REST API: running on http://localhost:5000
  - Frontend SPA client: running on http://localhost:5173

* STEP 3: Build for Production
  To bundle the frontend application into static assets:
  $ npm run build

  The compiled frontend bundle will be placed in frontend/dist.

* STEP 4: Running in Single-Process Production Mode
  When running the production build, the Express backend serves the
  static assets in frontend/dist directly:
  $ npm start

  The unified portal will be accessible on the port specified in your
  .env file (defaults to http://localhost:5000).

------------------------------------------------------------------------
5. API DOCUMENTATION
------------------------------------------------------------------------

All endpoints are prefixed with /api. Security-guarded endpoints require
a valid JWT token sent within the Authorization header as a Bearer
token: Authorization: Bearer <JWT_TOKEN>

* Authentication Routes (/api/auth)
  - POST /api/auth/signup - Register a new user profile.
    Body: { "name": "...", "email": "...", "password": "...", "role": "Admin" | "Member" }
  - POST /api/auth/login - Authenticate credentials and retrieve a JWT.
    Body: { "email": "...", "password": "..." }
    Response: { "token": "...", "user": { "id": 1, "name": "...", "email": "...", "role": "..." } }

* User Routes (/api/users)
  - GET /api/users (Auth required) - Fetch the list of registered team
    members to invite to projects or assign to tasks.

* Project Routes (/api/projects)
  - GET /api/projects (Auth required) - View all projects the user owns
    or belongs to.
  - POST /api/projects (Admin required) - Create a new project.
    Body: { "name": "Project Title", "description": "Details..." }
  - DELETE /api/projects/:id (Admin required) - Remove an existing project.
  - POST /api/projects/:id/members (Admin required) - Invite user to project.
    Body: { "userId": 12 }

* Task Routes (/api/tasks)
  - GET /api/tasks/project/:projectId (Auth required) - Retrieve all task
    entries mapped to a specific project.
  - POST /api/tasks (Admin required) - Create a new task in a project.
    Body: { "title": "...", "description": "...", "priority": "Low" | "Medium" | "High", "dueDate": "YYYY-MM-DD", "projectId": 1, "assignedToId": 3 }
  - PUT /api/tasks/:id (Auth required) - Modify a task. Members can only
    update the task "status". Admins can modify any task attribute.
    Body: { "title": "...", "description": "...", "status": "...", "priority": "...", "dueDate": "...", "assignedToId": ... }
  - DELETE /api/tasks/:id (Admin required) - Remove a task from the board.

------------------------------------------------------------------------
6. VERIFICATION & WALKTHROUGH
------------------------------------------------------------------------

* AUTOMATED LOCAL VERIFICATION
  Running startup commands bootstraps schemas and initializes tables
  automatically:
  $ npm run dev

  Check console output to verify active database state:
  "Connected to SQLite database at .../database.sqlite" (or PostgreSQL log)
  "SQLite database tables initialized successfully."
  "Database system initialized."
  "Backend server listening on port 5000"

* INTERACTIVE WALKTHROUGH
  1. Register as Admin: Sign up with the role "Admin". Create your first
     project boards.
  2. Add Team Members: Register another user with the role "Member". In
     your Admin account, invite this member using their email/name
     within the project member selector.
  3. Assign Tasks: Create new tasks. Select the newly added user under the
     "Assignee" field, prioritize the task, and pick a future deadline.
  4. Collaborate: Log out and sign in as the Member. Check your dashboard.
     You can access the assigned project, view task descriptions, and
     slide tasks from "To Do" to "In Progress" as you complete them!
========================================================================
