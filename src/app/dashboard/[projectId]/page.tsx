"use client"

// ─── Imports ───────────────────────────────────────────────────────────────
import { useParams, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { io } from "socket.io-client"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { TaskCard } from "@/components/TaskCard"
import { Column } from "@/components/Column"
import { TaskModal } from "@/components/TaskModal"
import { MembersModal } from "@/components/MembersModal"

// ─── Types ─────────────────────────────────────────────────────────────────
type Task = {
    id: string
    title: string
    description: string | null
    status: "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
    priority: "LOW" | "MEDIUM" | "HIGH" | "NONE"
    assigneeId: string | null
    dueDate: string | null
    assignee: { id: string; name: string } | null
}

type SpeechRecognitionEvent = {
    results: { [key: number]: { [key: number]: { transcript: string } } }
}

// ─── Constants ─────────────────────────────────────────────────────────────
const COLUMNS = [
    { id: "BACKLOG", label: "Backlog" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "IN_REVIEW", label: "In Review" },
    { id: "DONE", label: "Done" },
]

// ─── Component ─────────────────────────────────────────────────────────────
export default function BoardPage() {

    // ── URL params ──
    const { projectId } = useParams<{ projectId: string }>()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()
    const { data: session } = useSession()

    // ── Task modal state ──
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editAssigneeId, setEditAssigneeId] = useState<string | null>(null)
    const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "NONE">("NONE")
    const [editDueDate, setEditDueDate] = useState<string>("")
    const [saveLoading, setSaveLoading] = useState(false)

    // ── Column/task creation state ──
    const [activeColumn, setActiveColumn] = useState<string | null>(null)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [createLoading, setCreateLoading] = useState(false)

    // ── Members panel state ──
    const [membersOpen, setMembersOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("MEMBER")
    const [inviteError, setInviteError] = useState("")

    // ── AI/NL state ──
    const [suggestions, setSuggestions] = useState<Array<{
        title: string; description: string; category: string; priority: string; reason: string
    }>>([])
    const [suggestLoading, setSuggestLoading] = useState(false)
    const [naturalInput, setNaturalInput] = useState("")
    const [isListening, setIsListening] = useState(false)
    const [nlLoading, setNlLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)

    // ── Local tasks (optimistic updates) ──
    const [localTasks, setLocalTasks] = useState<Task[]>([])

    // ── Socket ref ──
    const socketRef = useRef<ReturnType<typeof io> | null>(null)

    // ─── Queries ───────────────────────────────────────────────────────────
    const { data: serverTasks, isLoading } = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () => fetch(`/api/projects/${projectId}/tasks`).then(res => res.json()),
    })

    const { data: project } = useQuery({
        queryKey: ["project", projectId],
        queryFn: () =>
            fetch(`/api/projects`).then(res => res.json())
                .then(projects => projects.find((p: { id: string }) => p.id === projectId)),
    })

    const { data: members = [] } = useQuery({
        queryKey: ["members", projectId],
        queryFn: () => fetch(`/api/projects/${projectId}/members`).then(res => res.json()),
    })



    // ─── Effects ───────────────────────────────────────────────────────────

    // Sync server tasks to local tasks
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (serverTasks) setLocalTasks(serverTasks)
    }, [serverTasks])

    // Open task modal from URL param (e.g. from profile page)
    useEffect(() => {
        const taskId = searchParams.get("taskId")
        if (taskId && serverTasks) {
            const task = serverTasks.find((t: Task) => t.id === taskId)
            if (task) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedTask(task)
                setEditTitle(task.title)
                setEditDescription(task.description || "")
                setEditAssigneeId(task.assigneeId || null)
                setEditPriority(task.priority || "NONE")
                setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
            }
        }
    }, [searchParams, serverTasks])

    // Socket.io connection
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
        socketRef.current = socket

        socket.emit("join:board", { projectId })

        socket.on("task:moved", (data: { taskId: string; newStatus: string }) => {
            setLocalTasks(prev =>
                prev.map(task =>
                    task.id === data.taskId
                        ? { ...task, status: data.newStatus as Task["status"] }
                        : task
                )
            )
        })

        socket.on("task:created", () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        })

        return () => { socket.disconnect() }
    }, [projectId])

    if (isLoading) return <p className="p-8">Loading...</p>

    // ─── Handlers ──────────────────────────────────────────────────────────

    function openTaskModal(task: Task) {
        setSelectedTask(task)
        setEditTitle(task.title)
        setEditDescription(task.description || "")
        setEditAssigneeId(task.assigneeId || null)
        setEditPriority(task.priority || "NONE")
        setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "")
    }

    async function handleCreateTask(status: string) {
        if (!newTaskTitle.trim()) return
        setCreateLoading(true)
        await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTaskTitle, status }),
        })
        socketRef.current?.emit("task:created", { projectId })
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setNewTaskTitle("")
        setActiveColumn(null)
        setCreateLoading(false)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over) return
        const taskId = active.id as string
        const newStatus = over.id as string
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, status: newStatus as Task["status"] } : task
            )
        )
        socketRef.current?.emit("task:moved", { projectId, taskId, newStatus })
        await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    }

    async function handleSave() {
        setSaveLoading(true)
        if (selectedTask!.id === "new-suggested") {
            await fetch(`/api/projects/${projectId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle, description: editDescription,
                    status: "BACKLOG", assigneeId: editAssigneeId, priority: editPriority
                }),
            })
            setSuggestions(prev => prev.filter(s => s.title !== selectedTask!.title))
        } else {
            await fetch(`/api/projects/${projectId}/tasks/${selectedTask!.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle, description: editDescription,
                    assigneeId: editAssigneeId, priority: editPriority, dueDate: editDueDate || null
                }),
            })
        }
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setSelectedTask(null)
        setSaveLoading(false)
    }

    async function handleDelete() {
        const response = await fetch(`/api/projects/${projectId}/tasks/${selectedTask!.id}`, {
            method: "DELETE",
        })
        if (!response.ok) return
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setSelectedTask(null)
    }

    async function handleInvite() {
        const response = await fetch(`/api/projects/${projectId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        })
        if (!response.ok) {
            const data = await response.json()
            setInviteError(data.error || "No user found")
            return
        }
        await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
        setInviteEmail("")
        setInviteError("")
    }

    async function handleRemoveMember(memberId: string) {
        const response = await fetch(`/api/projects/${projectId}/members`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId }),
        })
        if (!response.ok) return
        await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
    }

    async function handleSuggest() {
        setSuggestLoading(true)
        const response = await fetch(`/api/projects/${projectId}/suggest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectName: project?.name,
                projectDescription: project?.description,
                existingTasks: localTasks.map(t => t.title)
            })
        })
        const data = await response.json()
        setSuggestions(data.suggestions)
        setSuggestLoading(false)
    }

    async function handlePdfUpload(file: File) {
        setPdfLoading(true)
        const formData = new FormData()
        formData.append("pdf", file)
        const response = await fetch(`/api/projects/${projectId}/upload-pdf`, {
            method: "POST", body: formData,
        })
        if (!response.ok) { setPdfLoading(false); return }
        const data = await response.json()
        setSuggestions(data.suggestions.map((t: { title: string; description: string; priority: string }) => ({
            title: t.title, description: t.description,
            category: "📄 from PDF", priority: t.priority, reason: "Extracted from uploaded PDF"
        })))
        setPdfLoading(false)
    }

    async function fetchNaturalLanguageSuggestions(instruction: string) {
        if (!instruction.trim()) return
        setNlLoading(true)
        const response = await fetch(`/api/projects/${projectId}/natural-language`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instruction, existingTasks: localTasks.map(t => t.title) })
        })
        const data = await response.json()
        setSuggestions(data.suggestions)
        setNaturalInput("")
        setNlLoading(false)
    }

    async function handleNaturalLanguage() {
        await fetchNaturalLanguageSuggestions(naturalInput)
    }

    function handleMic() {
        const SpeechRecognition =
            (window as Window & {
                SpeechRecognition?: new () => {
                    lang: string; interimResults: boolean
                    onstart: () => void; onend: () => void
                    onresult: (event: SpeechRecognitionEvent) => void; start: () => void
                }
            }).SpeechRecognition ||
            (window as Window & {
                webkitSpeechRecognition?: new () => {
                    lang: string; interimResults: boolean
                    onstart: () => void; onend: () => void
                    onresult: (event: SpeechRecognitionEvent) => void; start: () => void
                }
            }).webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Speech recognition not supported. Use Chrome or Edge.")
            return
        }
        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.interimResults = false
        recognition.onstart = () => setIsListening(true)
        recognition.onend = () => setIsListening(false)
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript
            setNaturalInput(transcript)
            fetchNaturalLanguageSuggestions(transcript)
        }
        recognition.start()
    }

    // ─── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard" className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-white">{project?.name ?? "Board"}</h1>
                <div className="flex gap-2">
                    <input type="file" accept=".pdf" id="pdf-upload" className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePdfUpload(file) }}
                    />
                    <label htmlFor="pdf-upload"
                        className={`backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all cursor-pointer ${pdfLoading ? "opacity-50" : ""}`}>
                        {pdfLoading ? "Processing..." : "📄 Upload PDF"}
                    </label>
                    <button onClick={() => setMembersOpen(true)}
                        className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all">
                        Members
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 justify-center pb-4">
                    {COLUMNS.map((column) => (
                        <Column key={column.id} id={column.id} label={column.label}>
                            {localTasks
                                .filter((task: Task) => task.status === column.id)
                                .sort((a, b) => {
                                    const order = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 }
                                    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
                                })
                                .map((task: Task) => (
                                    <TaskCard key={task.id} task={task} onClick={openTaskModal} />
                                ))}

                            {activeColumn === column.id ? (
                                <div className="mt-2">
                                    <input type="text" value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="Task title..."
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm mb-2 focus:outline-none"
                                        style={{ color: 'white' }} autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCreateTask(column.id)} disabled={createLoading}
                                            className="bg-white/20 border border-white/30 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-all disabled:opacity-50">
                                            {createLoading ? "Adding..." : "Add"}
                                        </button>
                                        <button onClick={() => setActiveColumn(null)}
                                            className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setActiveColumn(column.id)}
                                    className="mt-2 w-full text-left text-sm text-white/50 hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-all">
                                    + Add task
                                </button>
                            )}
                        </Column>
                    ))}
                </div>
            </DndContext>

            {/* AI Input Bar */}
            <div className="flex justify-center mt-6 gap-2">
                <input type="text" value={naturalInput}
                    onChange={(e) => setNaturalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNaturalLanguage()}
                    placeholder="Describe what you need..."
                    className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-white/40 focus:outline-none w-96"
                    style={{ color: 'white' }}
                />
                <button onClick={handleNaturalLanguage} disabled={nlLoading}
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all disabled:opacity-50">
                    {nlLoading ? "Thinking..." : "→"}
                </button>
                <button onClick={handleMic}
                    className={`backdrop-blur-md border text-white px-4 py-3 rounded-full transition-all ${isListening ? "bg-red-500/30 border-red-500/40 animate-pulse" : "bg-white/10 border-white/20 hover:bg-white/20"}`}>
                    🎤
                </button>
                <button onClick={handleSuggest} disabled={suggestLoading}
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all disabled:opacity-50">
                    {suggestLoading ? "Thinking..." : "✨ Suggest tasks"}
                </button>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
                <div className="mt-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6">
                    <h2 className="text-white font-bold text-lg mb-4">✨ AI Suggestions</h2>
                    <div className="space-y-3">
                        {suggestions.map((s, index) => (
                            <div key={index} className="flex items-start justify-between bg-white/10 border border-white/20 rounded-xl p-4 gap-4">
                                <div>
                                    <div className="flex gap-2 mb-1">
                                        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{s.category}</span>
                                        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{s.priority}</span>
                                    </div>
                                    <p className="text-white font-medium text-sm">{s.title}</p>
                                    <p className="text-white/50 text-xs mt-1">{s.reason}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedTask({ id: "new-suggested", title: s.title, description: s.description, priority: "NONE", status: "BACKLOG", dueDate: null, assigneeId: null, assignee: null })
                                        setEditTitle(s.title)
                                        setEditDescription(s.description || "")
                                        setEditPriority((s.priority?.toUpperCase() || "NONE") as "LOW" | "MEDIUM" | "HIGH" | "NONE")
                                    }}
                                    className="shrink-0 backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-all">
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setSuggestions([])} className="mt-4 text-white/40 text-sm hover:text-white/60 transition-all">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    editTitle={editTitle}
                    editDescription={editDescription}
                    assigneeId={editAssigneeId}
                    members={members}
                    onTitleChange={setEditTitle}
                    onDescriptionChange={setEditDescription}
                    onAssigneeChange={setEditAssigneeId}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => setSelectedTask(null)}
                    editPriority={editPriority}
                    onPriorityChange={setEditPriority}
                    saveLoading={saveLoading}
                    editDueDate={editDueDate}
                    onDueDateChange={setEditDueDate}
                />
            )}

            {/* Members Modal */}
            {membersOpen && (
                <MembersModal
                    members={members}
                    inviteEmail={inviteEmail}
                    inviteRole={inviteRole}
                    inviteError={inviteError}
                    onEmailChange={setInviteEmail}
                    onRoleChange={setInviteRole}
                    onInvite={handleInvite}
                    onClose={() => setMembersOpen(false)}
                    isAdmin={project?.role === "ADMIN"}
                    onRemoveMember={handleRemoveMember}
                    currentUserId={session?.user?.id || ""}
                />
            )}
        </div>
    )
}