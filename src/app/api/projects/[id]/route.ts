// DELETE /api/projects/[id] — deletes a project
// Only ADMIN members can delete a project

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  //check if user is logged in
  // Step 1: check if user is logged in
  const { user, error } = await requireAuth();

  // Step 2: if not logged in, return the error
  if (error) return error;


  // get the project id from params
  const { id } = await params


  // check if the user is an ADMIN of this project
  const admin = await db.projectMember.findFirst({
    where: { projectId: id, userId: user.id, role: "ADMIN" }
  })

  //if not admin, return 403 Forbidden
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }



  // delete the project members first (foreign key constraint)
  await db.projectMember.deleteMany({ where: { projectId: id } })


  //delete the tasks
  await db.task.deleteMany({ where: { projectId: id } })

  //delete the project
  await db.project.delete({ where: { id } })

  //return 200 success
  return NextResponse.json(
    { message: "Project deleted" },
    { status: 200 })

}