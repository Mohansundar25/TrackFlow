# TrackFlow — AI-Powered Full-Stack Workflow Tracker

TrackFlow is a MERN-stack Kanban app for tracking tasks and workflows. It uses an **LLM (Groq API)** to turn a one-line task title into a clear description, a suggested priority and a checklist of subtasks. Logins are secured with **JWT authentication and refresh-token rotation**, and every push to `main` deploys to **AWS Elastic Beanstalk** with GitHub Actions.

## 🤖 How AI Is Used

### In the product

| AI feature | What it does |
|---|---|
| **AI task breakdown** | Type a task title, click **✨ Generate with AI**, and the LLM writes a clear description and splits the work into 3–6 actionable subtasks |
| **AI priority suggestion** | The LLM suggests a priority (low / medium / high) based on the task's scope and urgency |
| **Editable AI drafts** | AI output fills the form so you can review and edit it before saving — the human stays in control |
| **JSON-mode prompting** | Structured prompts force JSON output, which is validated on the server before it reaches the UI |

### In development

This project was built with **AI-assisted development**. AI coding agents were used to speed up implementation, debugging and refactoring, while I owned the architecture, authentication design, prompt design, code review and deployment.

## Features

- Kanban board with To Do, In Progress and Done columns (drag and drop)
- Create, edit and delete tasks with priorities and subtask checklists
- ✨ AI-generated descriptions, priorities and subtasks
- JWT access tokens + httpOnly refresh-token cookie with rotation and reuse detection
- MongoDB Atlas storage
- CI/CD to AWS Elastic Beanstalk with GitHub Actions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| AI / LLM | Groq API (Llama 3.3 70B) |
| Auth | JWT (access + refresh rotation), bcrypt |
| Hosting | AWS Elastic Beanstalk |
| CI/CD | GitHub Actions |

## Architecture

```
React Frontend (Vite)
      │  REST API + Bearer access token
      ▼
Express API (Node.js) ── AWS Elastic Beanstalk
      ├── /api/auth   JWT login, refresh rotation, logout
      ├── /api/tasks  Kanban CRUD
      └── /api/ai     🤖 Groq LLM task breakdown
      │
      ▼
MongoDB Atlas
```

## Project Structure

```
TrackFlow/
├── client/                     # React frontend
│   ├── src/
│   │   ├── App.jsx             # Auth flow
│   │   ├── Board.jsx           # Kanban board + AI task form
│   │   ├── api.js              # Fetch client with automatic token refresh
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                     # Express backend
│   ├── models/                 # User, Task, RefreshToken
│   ├── routes/                 # auth.js, tasks.js, ai.js
│   ├── services/ai.js          # 🤖 Groq LLM integration
│   ├── middleware/             # requireAuth, asyncHandler
│   ├── server.js
│   └── package.json
└── .github/workflows/deploy.yml
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier works)
- A free Groq API key from https://console.groq.com

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets and GROQ_API_KEY
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 (API calls are proxied to http://localhost:5000).

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register and receive tokens |
| POST | `/api/auth/login` | Log in and receive tokens |
| POST | `/api/auth/refresh` | Rotate the refresh token and get a new access token |
| POST | `/api/auth/logout` | Revoke the refresh token |
| GET | `/api/tasks` | List the user's tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task (status, priority, subtasks…) |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/breakdown` | 🤖 AI description, priority and subtasks for a task title |

## How Refresh-Token Rotation Works

1. On login, the server issues a short-lived **access token** (15 min) and a **refresh token** in an httpOnly cookie.
2. When the access token expires, the client calls `/api/auth/refresh` automatically.
3. The server verifies the refresh token, **revokes it**, and issues a new pair.
4. If a revoked refresh token is ever reused, all of that user's sessions are revoked to block token theft.

## CI/CD (GitHub Actions → Elastic Beanstalk)

On every push to `main` the workflow builds the React app, bundles it into the Express server, and deploys to Elastic Beanstalk. Add these repository secrets to enable deployment: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EB_APP_NAME`, `EB_ENV_NAME`. Set `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GROQ_API_KEY` and `NODE_ENV=production` as Elastic Beanstalk environment properties.

## Future Improvements

- AI daily stand-up summary of board activity
- AI due-date and effort estimates
- Team boards with role-based access
- Real-time updates with WebSockets

## Author

**Mohana Sundaram B** · GitHub: [Mohansundar25](https://github.com/Mohansundar25)
