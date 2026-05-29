/*
Receive the PDF file from frontend
Extract text from PDF using pdf-parse
Send that text to Groq with a prompt: "extract tasks from this document"
Groq returns structured JSON with tasks
Create those tasks in the database
Return success
*/

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import Groq from 'groq-sdk'
import { db } from "@/lib/db"
import pdf from "pdf-parse-fork" // Clean import right here

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check if user is logged in
    const { user, error } = await requireAuth()
    if (error) return error
    const { id } = await params

    // For file uploads:
    const formData = await request.formData()
    const file = formData.get("pdf") as File
    const buffer = Buffer.from(await file.arrayBuffer())

    // Works flawlessly now
    const pdfResult = await pdf(buffer)
    const text = pdfResult.text



    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    })


    const prompt = `You are a project management assistant. Extract all tasks, action items, and to-dos from this document.

Document text:
${text}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "title": "Short task title",
    "description": "Brief description",
    "priority": "low | medium | high"
  }
]`


    // Call Groq
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
    })

    const responseText = completion.choices[0].message.content || "[]"
    const clean = responseText.replace(/```json|```/g, "").trim()
    const tasks = JSON.parse(clean)

    // Create all tasks in the database
    await Promise.all(
        tasks.map((task: { title: string; description: string }) =>
            db.task.create({
                data: {
                    title: task.title,
                    description: task.description,
                    status: "BACKLOG",
                    projectId: id,
                }
            })
        )
    )

    //  return NextResponse.json({ message: `${tasks.length} tasks created`, tasks })
    return NextResponse.json({ suggestions: tasks })



}

