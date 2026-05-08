"use client"

import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"

import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { TaskCard } from "@/components/TaskCard"
import { Column } from "@/components/Column"

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
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Board</h1>
            <DndContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4">
                    {COLUMNS.map((column) => (
                        <Column key={column.id} id={column.id} label={column.label}>
                            {/* Show tasks that belong to this column */}
                            {localTasks
                                .filter((task: Task) => task.status === column.id)
                                .map((task: Task) => (
                                    <TaskCard key={task.id} task={task} />

                                ))}

                            {/* Add task button/form */}
                            {activeColumn === column.id ? (
                                // TODO:  form here
                                <div>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCreateTask(column.id)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveColumn(null)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                // TODO:  button here
                                <button
                                    type="button"
                                    onClick={() => setActiveColumn(column.id)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
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