import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import Groq from 'groq-sdk'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {

    //check if user is logged in
    const { user, error } = await requireAuth()
    if (error) return error

    // parse { instruction } from request body
    const { instruction, existingTasks } = await request.json();


    // call Groq API with a prompt
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    })

    const prompt = `You are a helpful project planning assistant.

A user gave this instruction: "${instruction}"

Project context:
Existing tasks: ${existingTasks.length > 0 ? existingTasks.join(", ") : "none yet"}

Create tasks based SPECIFICALLY on what the user asked for. 
If they said "add 5 tasks for building a login system", create exactly those tasks.

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "title": "Short actionable task title",
    "description": "Brief description",
    "category": "feature | research | testing | design | infra",
    "priority": "low | medium | high",
    "reason": "Why this task matters"
  }
]`


    // Call Groq
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
    })

    // Extract the response text
    const text = completion.choices[0].message.content || "[]"

    // Remove markdown code blocks if present
    const clean = text.replace(/```json|```/g, "").trim()

    // Parse the JSON array from the response
    const tasks = JSON.parse(clean)

    // Return suggestions to the frontend
    return NextResponse.json({ suggestions: tasks })



}