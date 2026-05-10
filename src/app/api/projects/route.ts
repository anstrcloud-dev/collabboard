// src/app/api/projects/route.ts
//
// REST API endpoints for managing projects.
//
// GET  /api/projects — returns all projects the logged in user is a member of
// POST /api/projects — creates a new project and adds the creator as ADMIN
//
// Both routes are protected — you must be logged in to use them.
// Authentication is handled by requireAuth() from src/lib/session.ts

//flow for the Kanban:
//User opens dashboard
//→ React calls fetch("/api/projects")
//→ Next.js routes it to route.ts GET function
//→ GET function queries the database
//→ Returns projects as JSON
//→ React displays them on screen

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"
import type { Project, ProjectMember } from "@prisma/client"

// GET /api/projects — returns all projects the logged in user is a member of
export async function GET() {
    // TODO: call requireAuth() and return the error if there is one

    // TODO: query the database for all ProjectMember records
    // where userId equals the logged in user's id
    // and include the project data

    // TODO: return the projects as JSON

    // Step 1: check if user is logged in
    const { user, error } = await requireAuth();

    // Step 2: if not logged in, return the error
    if (error) return error;

    // Step 3: get all projects this user is a member of
    /* const memberships = await db.projectMember.findMany({
         where: { userId: user.id },
         include: { project: true },
     });*/
    const memberships: (ProjectMember & { project: Project })[] = await db.projectMember.findMany({
        where: { userId: user.id },
        include: { project: true },
    })

    // Step 4: extract just the project objects from the memberships
    const projects = memberships.map((m) => m.project);

    // Step 5: return them as JSON
    return NextResponse.json(projects);
}

// POST /api/projects — creates a new project
export async function POST(request: Request) {
    // TODO: call requireAuth() and return error if not logged in
    const { user, error } = await requireAuth();
    if (error) return error;

    // TODO: parse the request body to get { name, description }
    const { name, description } = await request.json();

    // TODO: create the project in the database
    const project = await db.project.create({
        data: { name, description }
    });


    // TODO: add the creator as an ADMIN member of the project
    await db.projectMember.create({
        data: { userId: user.id!, projectId: project.id, role: "ADMIN" }
    });


    // TODO: return the new project as JSON with status 201
    return NextResponse.json(project,
        { status: 201 }
    );
}