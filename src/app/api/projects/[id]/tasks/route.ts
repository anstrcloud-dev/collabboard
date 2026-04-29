// src/app/api/projects/[id]/tasks/route.ts
//
// REST API endpoints for managing tasks within a project.
//
// GET  /api/projects/[id]/tasks — returns all tasks for a project
// POST /api/projects/[id]/tasks — creates a new task in a project
//
// [id] is the project ID from the URL — it's dynamic and changes per project

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  // Step 1: check if user is logged in
  const { user, error } = await requireAuth();

  // Step 2: if not logged in, return the error
  if (error) return error;

  // We get the project ID from the URL params
  const { id } = await params;

  const tasks = await db.task.findMany({
    where: { projectId: id },
    include: { assignee: true },
  });

  return NextResponse.json(tasks);
}


// POST should:

// Call requireAuth() and return error if not logged in
// Get id from params (the project ID)
// Parse the request body to get { title, description }
// Create a new task with db.task.create()  — the task needs title, description, projectId: id, and status will default to BACKLOG automatically
// Return the new task with status 201

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  //parse
  const { title, description } = await request.json();

  const task = await db.task.create({
    data: { title, description, projectId: id }
  });


  return NextResponse.json(task,
    { status: 201 }
  );

}