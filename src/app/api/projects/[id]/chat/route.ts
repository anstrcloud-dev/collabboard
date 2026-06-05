import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { db } from "@/lib/db"
import Groq from "groq-sdk"


// ── Types ──
type Intent = "OVERDUE_TASKS" | "PRIORITY_TASKS" | "SPRINT_SUMMARY" | "MEMBER_WORKLOAD" | "BLOCKERS" | "GENERAL"

type Message = {
    role: "user" | "assistant"
    content: string
}


// ── Intent Router ──
//reads the user's message and returns a string 
function detectIntent(message: string): Intent {
    const msg = message.toLowerCase()

    if (msg.includes("overdue") || msg.includes("late") || msg.includes("missed deadline") || msg.includes("past due"))
        return "OVERDUE_TASKS"

    if (msg.includes("priorit") || msg.includes("important") || msg.includes("urgent") || msg.includes("first") || msg.includes("tackle") || msg.includes("focus"))
        return "PRIORITY_TASKS"

    if (msg.includes("sprint") || msg.includes("summary") || msg.includes("progress") || msg.includes("overview") || msg.includes("status") || msg.includes("how are we"))
        return "SPRINT_SUMMARY"

    if (msg.includes("who") || msg.includes("member") || msg.includes("workload") || msg.includes("assigned") || msg.includes("person") || msg.includes("team"))
        return "MEMBER_WORKLOAD"

    if (msg.includes("block") || msg.includes("stuck") || msg.includes("review") || msg.includes("waiting") || msg.includes("depend"))
        return "BLOCKERS"

    return "GENERAL"
}


// ── Retrieval Layer ──
//takes the intent and fetches ONLY the relevant data from the database
async function fetchContext(intent: Intent, projectId: string) {
    const now = new Date()

    switch (intent) {
        case "OVERDUE_TASKS":
            return db.task.findMany({
                where: {
                    projectId,
                    dueDate: { lt: now },
                    status: { not: "DONE" }
                },
                include: { assignee: true },
                orderBy: { dueDate: "asc" }
            })

        case "PRIORITY_TASKS":
            return db.task.findMany({
                where: { projectId, status: { not: "DONE" } },
                include: { assignee: true },
                orderBy: [{ priority: "asc" }, { dueDate: "asc" }]
            })

        case "SPRINT_SUMMARY":
            return db.task.findMany({
                where: { projectId },
                include: { assignee: true },
                orderBy: { status: "asc" }
            })

        case "MEMBER_WORKLOAD":
            return db.task.findMany({
                where: { projectId, status: { not: "DONE" } },
                include: { assignee: true }
            })

        case "BLOCKERS":
            return db.task.findMany({
                where: {
                    projectId,
                    OR: [
                        { status: "IN_REVIEW" },
                        { priority: "HIGH", status: { not: "DONE" } }
                    ]
                },
                include: { assignee: true }
            })

        case "GENERAL":
        default:
            return db.task.findMany({
                where: { projectId },
                include: { assignee: true }
            })
    }
}

// ── Context Builder ──
type Task = {
    id: string
    title: string
    status: string
    priority: string
    dueDate: Date | null
    assignee: { name: string } | null
}

type Member = {
    role: string
    user: { name: string }
}

type Project = {
    name: string
    description: string | null
}

//Takes the raw database data and formats it into a readable text string that Groq can understand
function buildContext(tasks: Task[], members: Member[], project: Project | null, intent: Intent): string {
    const now = new Date()

    const taskLines = tasks.map(t => {
        const due = t.dueDate ? new Date(t.dueDate) : null
        const overdue = due && due < now && t.status !== "DONE"
        const dueStr = due ? ` | Due: ${due.toLocaleDateString()}${overdue ? " (OVERDUE)" : ""}` : ""
        const assignee = t.assignee ? ` | Assigned to: ${t.assignee.name}` : " | Unassigned"
        return `- ${t.title} [${t.status}] [Priority: ${t.priority}]${dueStr}${assignee}`
    }).join("\n")

    const memberLines = members.map((m: Member) => `- ${m.user.name} (${m.role})`).join("\n")
    return `
Project: ${project?.name}
Description: ${project?.description || "No description"}
Today: ${now.toLocaleDateString()}

Team Members:
${memberLines}

Relevant Tasks (${intent}):
${taskLines || "No tasks found"}
  `.trim()
}


export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const { message, history = [] } = await request.json()

    // ── Get project ──
    const project = await db.project.findUnique({ where: { id } })
    const members = await db.projectMember.findMany({
        where: { projectId: id },
        include: { user: true }
    })

    // ── Intent Router ──
    const intent = detectIntent(message)

    // ── Retrieval Layer ──
    const tasks = await fetchContext(intent, id)

    // ── Context Builder ──
    const context = buildContext(tasks, members, project, intent)

    // ── System prompt ──
    const systemPrompt = `You are Flowbit AI, an intelligent project management assistant.

You have access to real-time project data provided below. Use it to answer questions accurately and concisely.

${context}

Guidelines:
- Be concise and actionable
- Reference specific task names and team members
- If asked to create tasks, list them clearly
- If asked for recommendations, be specific
- Today's date is ${new Date().toLocaleDateString()}`

    // ── Build messages for Groq ──
    const messages = [
        ...history.map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content
        })),
        { role: "user" as const, content: message }
    ]

    // ── Call Groq ──
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            ...messages
        ],
        max_tokens: 1000
    })

    const reply = completion.choices[0].message.content || "I couldn't generate a response."

    // ── Save to DB ──
    await db.conversationMessage.create({
        data: { role: "user", content: message, projectId: id, userId: user.id! }
    })
    await db.conversationMessage.create({
        data: { role: "assistant", content: reply, projectId: id, userId: user.id! }
    })

    return NextResponse.json({ reply, intent })
}



// ── GET conversation history ──
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params

    const messages = await db.conversationMessage.findMany({
        where: { projectId: id, userId: user.id! },
        orderBy: { createdAt: "asc" },
        take: 50
    })

    return NextResponse.json(messages)
}