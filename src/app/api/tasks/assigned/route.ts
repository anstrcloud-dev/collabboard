import { requireAuth } from "@/lib/session"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"




export async function GET(request: Request) {

    //check if user is logged in
    // Step 1: check if user is logged in
    const { user, error } = await requireAuth()
    // Step 2: if not logged in, return the error
    if (error) return error

   const tasks = await db.task.findMany({
        where: { assigneeId: user.id },
        include: {
            project: true,  // include project so we know which project each task belongs to
            assignee: true
        },
        orderBy: { priority: "asc" }
    })


    return NextResponse.json(tasks)
}