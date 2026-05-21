"use client"

import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react" // useRef reference a value that’s not needed for rendering (for socket)

import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { TaskCard } from "@/components/TaskCard"
import { Column } from "@/components/Column"

import Link from "next/link"

import { io } from "socket.io-client"

import { TaskModal } from "@/components/TaskModal"


// The shape of a Task object
type Task = {
    id: string;
    title: string;
    description: string | null;
    status: "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
};

// The 4 Kanban columns in order
const COLUMNS = [
    { id: "BACKLOG", label: "Backlog" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "IN_REVIEW", label: "In Review" },
    { id: "DONE", label: "Done" },
];

export default function BoardPage() {
    // Get the projectId from the URL
    const { projectId } = useParams<{ projectId: string }>();
    const queryClient = useQueryClient();
    const [activeColumn, setActiveColumn] = useState<string | null>(null); //  // Which column's form is currently open (null = none open)
    const [newTaskTitle, setNewTaskTitle] = useState(""); //// The title of the new task being typed

    const socketRef = useRef<ReturnType<typeof io> | null>(null)

    //for task modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")

    // Fetch all tasks for this project
    const { data: serverTasks, isLoading } = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () =>
            fetch(`/api/projects/${projectId}/tasks`).then((res) => res.json()),
    })

    //show actual project name
    const { data: project } = useQuery({
        queryKey: ["project", projectId],
        queryFn: () =>
            fetch(`/api/projects`).then((res) => res.json()).then((projects) =>
                projects.find((p: { id: string }) => p.id === projectId)
            ),
    })

    // Local copy of tasks we can update instantly
    const [localTasks, setLocalTasks] = useState<Task[]>([])

    // Keep localTasks in sync with server data
    //runs after changes
    useEffect(() => {
        if (serverTasks) setLocalTasks(serverTasks)
    }, [serverTasks]) //run whenever serverTasks changes


    useEffect(() => {
        //connect to socket.io server
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
        socketRef.current = socket

        //join this project's room
        socket.emit("join:board", { projectId })

        //listen for task moves from other users
        socket.on("task:moved", (data: { taskId: string; newStatus: string }) => {
            setLocalTasks(prev =>
                prev.map(task =>
                    task.id === data.taskId
                        ? { ...task, status: data.newStatus as Task["status"] }
                        : task
                )
            )
        })

        //listen for new tasks from other users
        socket.on("task:created", () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        })


        //disconnect when leaving the page
        return () => {
            socket.disconnect()
        }
    }, [projectId])

    if (isLoading) return <p className="p-8">Loading...</p>

    async function handleCreateTask(status: string) {

        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTaskTitle, status }),
        })

        socketRef.current?.emit("task:created", { projectId })
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setNewTaskTitle("")
        setActiveColumn(null)

    }

    async function handleDragEnd(event: DragEndEvent) {
        console.log("handleDragEnd fired!", event)
        const { active, over } = event
        if (!over) return

        const taskId = active.id as string
        const newStatus = over.id as string

        // Update UI immediately without waiting for server - optimistic update
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, status: newStatus as Task["status"] } : task
            )
        )

        console.log("Socket connected:", socketRef.current?.connected)
        console.log("Emitting task:moved", { projectId, taskId, newStatus })
        //notify other users via websocket immidiately
        socketRef.current?.emit("task:moved", { projectId, taskId, newStatus })


        // Then sync with server in background
        await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })

        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })

    }


    async function handleSave() {
        await fetch(`/api/projects/${projectId}/tasks/${selectedTask!.id}`, { //!non-null assertion operator 
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: editTitle, description: editDescription }),
        })

        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })

        setSelectedTask(null)
    }


    async function handleDelete() {

        const response = await fetch(`/api/projects/${projectId}/tasks/${selectedTask!.id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            // something went wrong, show an error
            return
        }
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })

        setSelectedTask(null)
    }





    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard"
                    className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
                >
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-white">{project?.name ?? "Board"}</h1>
            </div>

            {/* Kanban columns */}
            <DndContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 justify-center pb-4">                    {COLUMNS.map((column) => (
                    <Column key={column.id} id={column.id} label={column.label}>
                        {localTasks
                            .filter((task: Task) => task.status === column.id)
                            .map((task: Task) => (
                                <TaskCard key={task.id}
                                    task={task}
                                    onClick={(task) => {
                                        setSelectedTask(task)
                                        setEditTitle(task.title)
                                        setEditDescription(task.description || "")
                                    }} />
                            ))}

                        {activeColumn === column.id ? (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Task title..."
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm mb-2 focus:outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCreateTask(column.id)}
                                        className="bg-white/20 border border-white/30 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition-all"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setActiveColumn(null)}
                                        className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/20 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setActiveColumn(column.id)}
                                className="mt-2 w-full text-left text-sm text-white/50 hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-all"
                            >
                                + Add task
                            </button>
                        )}
                    </Column>
                ))}
                </div>
            </DndContext>
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    editTitle={editTitle}
                    editDescription={editDescription}
                    onTitleChange={setEditTitle}
                    onDescriptionChange={setEditDescription}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    )
}