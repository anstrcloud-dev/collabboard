/*
Check if user is logged in (requireAuth)
Check if the requesting user is an ADMIN of this project (only admins can invite)
Parse { email, role } from request body
Find the user with that email in the database
If not found → return 404 with error message
Check if they're already a member → return 400 if so
Create a ProjectMember record
Return 201 success
*/


import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function POST(
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

    //Parse { email, role } from request body
    const { email, role } = await request.json()

    const invitedUser = await db.user.findUnique({ where: { email } })

    if (!invitedUser) {
        return NextResponse.json(
            { message: "User not found" },
            { status: 404 })
    }

    //check if already a member
    const alreadyMember = await db.projectMember.findFirst({
        where: { projectId: id, userId: invitedUser.id }
    })
    if (alreadyMember) {
        return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    //create proj memeber record
    await db.projectMember.create({
        data: { projectId: id, userId: invitedUser.id, role }
    })

    //return 201 success
    return NextResponse.json(
        { message: "Success" },
        { status: 201 })

}


// GET /api/projects/[id]/members — returns all members of a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const members = await db.projectMember.findMany({
    where: { projectId: id },
    include: { user: true }, // include user data (name, email) ; fetches the full User object for each member, we get the name and email to display in the UI
  })

  return NextResponse.json(members)
}