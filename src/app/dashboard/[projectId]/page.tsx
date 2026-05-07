"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
    const { data: tasks, isLoading } = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () =>
            fetch(`/api/projects/${projectId}/tasks`).then((res) => res.json()),
    });

    if (isLoading) return <p className="p-8">Loading...</p>;



    async function handleCreateTask(status: string) {


        //   setLoading(true)
        //  setError("");

        const response = await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTaskTitle, status }),
        })

        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
        setNewTaskTitle("")
        setActiveColumn(null)


    }


    
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Board</h1>
            <div className="flex gap-4">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="bg-gray-200 rounded-lg p-4 w-64 min-h-96">
                        <h2 className="font-semibold text-gray-700 mb-4">{column.label}</h2>

                        {/* Show tasks that belong to this column */}
                        {tasks
                            ?.filter((task: Task) => task.status === column.id)
                            .map((task: Task) => (
                                <div key={task.id} className="bg-white rounded-md p-3 mb-2 shadow-sm">
                                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                    {task.description && (
                                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                    )}
                                </div>
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

                    </div>
                ))}
            </div>
        </div>
    )
}