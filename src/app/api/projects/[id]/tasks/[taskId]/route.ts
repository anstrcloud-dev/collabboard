// src/app/api/projects/[id]/tasks/[taskId]/route.ts
//
// REST API endpoint for updating a specific task.
//
// PATCH /api/projects/[id]/tasks/[taskId] — updates a task (e.g. changes its status)
//
// This is called when a user drags a card between Kanban columns.

import { requireAuth } from "@/lib/session";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";


//PATCH should:

//Call requireAuth() and return error if not logged in
//Get taskId from params (this time params has { id, taskId })
//Parse the request body — it could contain { status }, { title }, or { assigneeId } — any field that needs updating
//Update the task with db.task.update({ where: { id: taskId }, data: body })
//Return the updated task as JSON

export async function PATCH(
  request: Request,
  // params is a Promise — not immediately available
  { params }: { params: Promise<{ id: string, taskId: string }> }
) {

  const { user, error } = await requireAuth();
  if (error) return error;
  //  //// await unwraps it — waits until the value is read

  const { id, taskId } = await params;

  const { status, title, assigneeId, description, priority, dueDate } = await request.json()

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      status,
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee: assigneeId
        ? { connect: { id: assigneeId } }
        : { disconnect: true }
    }
  })

  // Save training feedback if priority is set
  if (priority && priority !== "NONE" && user.id) {
  await db.trainingFeedback.create({
    data: {
      title: title as string,
      description: description as string,
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      projectId: id,
      userId: user.id,
    }
  })
}

  return NextResponse.json(task);

}



export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { taskId } = await params

  await db.task.delete({ where: { id: taskId } })

  return NextResponse.json({ message: "Task deleted" }, { status: 200 })
}