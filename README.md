# CollabBoard

**Live demo:** https://collabboard-qh8k.vercel.app

A full-stack project management app inspired by Linear and Jira. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- Register and login with secure password hashing (bcrypt)
- Create and manage projects
- Kanban board with 4 columns — Backlog, In Progress, In Review, Done
- Drag and drop tasks between columns with optimistic UI updates
- Route protection — unauthenticated users redirected to login
- Fully responsive glassmorphism UI

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js + bcrypt
- **Drag and drop:** dnd-kit
- **Data fetching:** TanStack Query
- **Deployment:** Vercel + Neon
