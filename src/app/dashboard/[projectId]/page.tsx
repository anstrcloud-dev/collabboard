"use client"

import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"

import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { TaskCard } from "@/components/TaskCard"
import { Column } from "@/components/Column"

import Link from "next/link"

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
    useEffect(() => {
        if (serverTasks) setLocalTasks(serverTasks)
    }, [serverTasks])
    if (isLoading) return <p className="p-8">Loading...</p>

    async function handleCreateTask(status: string) {

        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTaskTitle, status }),
        })

        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setNewTaskTitle("")
        setActiveColumn(null)

    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over) return

        const taskId = active.id as string
        const newStatus = over.id as string

        // Update UI immediately without waiting for server
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, status: newStatus as Task["status"] } : task
            )
        )

        // Then sync with server in background
        await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })

        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
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
                                <TaskCard key={task.id} task={task} />
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
        </div>
    )
}