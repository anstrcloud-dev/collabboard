# Flowbit

**Live demo:** https://flowbit-iota.vercel.app

![Flowbit Logo](logo.png)

A full-stack AI-powered project management app inspired by Linear and Jira. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- Register and login with secure password hashing (bcrypt)
- Create and manage projects with role-based access (admin/member)
- Invite and remove team members from projects
- Kanban board with 4 columns — Backlog, In Progress, In Review, Done
- Click any task to view, edit title/description, assign to members, or delete
- Drag and drop tasks between columns with optimistic UI updates
- Real-time collaboration — task updates sync instantly across all connected users via WebSockets
- Cross-tab session sync — login/logout reflected instantly across all open tabs
- **AI task suggestions** — Groq LLM analyzes your project and suggests relevant tasks
- **PDF upload** — upload any document and AI extracts tasks automatically
- **Task assignment** — assign tasks to team members with initials shown on cards
- Route protection — unauthenticated users redirected to login
- Glassmorphism UI

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Express + Socket.io (WebSocket server)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js + bcrypt
- **Real-time:** Socket.io
- **AI:** Groq API (llama-3.3-70b-versatile)
- **PDF parsing:** pdf-parse-fork
- **Drag and drop:** dnd-kit
- **Data fetching:** TanStack Query
- **Deployment:** Vercel (app) + Neon (database) + Render (WebSocket server)