// src/app/api/projects/[id]/suggest/route.ts
// POST /api/projects/[id]/suggest
// Sends project context to Groq and returns 5 task suggestions

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import Groq from 'groq-sdk'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {

    //check if user is logged in
    const { user, error } = await requireAuth();
    if (error) return error;

    // parse { projectName, projectDescription, existingTasks } from request body
    const { projectName, projectDescription, existingTasks } = await request.json();


    // call Groq API with a prompt

    // option 1: 
    //  fetch("https://api.groq.com/openai/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     model: "llama3-8b-8192",
    //     messages: [{ role: "user", content: yourPrompt }]
    //   })
    // })


    //option 2
    //initialize groq client
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    })

    const prompt = `You are a helpful project planning assistant.

A user is planning their project using a Kanban board. Help them identify what tasks they need to complete to achieve their goal.

Project name: "${projectName}"
Project description: "${projectDescription}"
Tasks they already have: ${existingTasks.length > 0 ? existingTasks.join(", ") : "none yet"}

Suggest 5 practical, specific tasks that would help them complete this project. These are real-world tasks the person needs to do, NOT software development tasks.

For example, if the project is "Learn Spanish", suggest tasks like "Complete Duolingo lesson 1", "Watch a Spanish movie", "Practice with a native speaker".

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "title": "Short actionable task title",
    "description": "Brief description",
    "category": "research | practice | preparation | learning | admin",
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
    const suggestions = JSON.parse(clean)

    // Return suggestions to the frontend
    return NextResponse.json({ suggestions })



}