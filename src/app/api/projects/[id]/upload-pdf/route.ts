import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import Groq from 'groq-sdk'
import { db } from "@/lib/db"
import pdf from "pdf-parse-fork"
import { HfInference } from "@huggingface/inference"

// ── Helper: split text into chunks of ~500 words ──
function chunkText(text: string, chunkSize: number = 500): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(" ")
        if (chunk.trim()) chunks.push(chunk)
    }
    return chunks
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// ── Helper: generate embedding via HuggingFace ──
async function generateEmbedding(text: string): Promise<number[]> {
    const data = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
    })
    return data as number[]
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await requireAuth()
    if (error) return error
    const { id } = await params

    const formData = await request.formData()
    const file = formData.get("pdf") as File
    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Step 1: Extract text
    const pdfResult = await pdf(buffer)
    const text = pdfResult.text

    // Step 2: Delete old chunks for this project
    await db.$executeRaw`DELETE FROM "DocumentChunk" WHERE "projectId" = ${id}`

    // Step 3: Chunk the text
    const chunks = chunkText(text, 500)
    console.log(`Split into ${chunks.length} chunks`)

    let successfulChunks = 0

    // Step 4: Generate embeddings and store in DB
    for (const chunk of chunks) {
        try {
            const embedding = await generateEmbedding(chunk)
            await db.$executeRaw`
                INSERT INTO "DocumentChunk" (id, content, embedding, "projectId", "fileName", "createdAt")
                VALUES (
                    gen_random_uuid()::text,
                    ${chunk},
                    ${`[${embedding.join(",")}]`}::vector,
                    ${id},
                    ${file.name},
                    NOW()
                )
            `
            successfulChunks++
        } catch (e) {
            console.error("Failed to store chunk:", e)
        }
    }

    if (successfulChunks === 0) {
        return NextResponse.json({ error: "Failed to process any document chunks." }, { status: 500 })
    }

    // Step 5: Find most relevant chunks using cosine similarity
    let context = ""
    try {
        const queryEmbedding = await generateEmbedding("action items tasks todo things to do")
        const relevantChunks = await db.$queryRaw<{ content: string }[]>`
            SELECT content
            FROM "DocumentChunk"
            WHERE "projectId" = ${id}
            ORDER BY embedding <=> ${`[${queryEmbedding.join(",")}]`}::vector
            LIMIT 5
        `
        context = relevantChunks.map(c => c.content).join("\n\n")
    } catch (e) {
        console.error("Failed querying vector database:", e)
        return NextResponse.json({ error: "Failed retrieving relevant document context." }, { status: 500 })
    }

    // Step 6: Send relevant chunks to Groq
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        const prompt = `You are a project management assistant. Extract all tasks, action items, and to-dos from this document excerpt.

Document excerpt:
${context}

Return ONLY a valid JSON array, no markdown wrappers, no explanation:
[
  {
    "title": "Short task title",
    "description": "Brief description",
    "priority": "low | medium | high"
  }
]`

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
        })

        const responseText = completion.choices[0].message.content || "[]"
        const clean = responseText.replace(/```json|```/g, "").trim()
        const tasks = JSON.parse(clean)
        return NextResponse.json({ suggestions: tasks })
    } catch (e) {
        console.error("Groq generation or parsing failed:", e)
        return NextResponse.json({ error: "Failed to generate task suggestions." }, { status: 500 })
    }
}