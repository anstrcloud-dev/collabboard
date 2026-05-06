"use client";

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// This defines the shape of a Project object
type Project = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
};

export default function DashboardPage() {
    // TODO: add the 4 state variables
    const [FormOpen, setFormOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    const queryClient = useQueryClient();

    // This fetches projects from /api/projects automatically
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: () => fetch("/api/projects").then((res) => res.json()),
    });

    // TODO: write a handleCreateProject async function that:
    // 1. sets loading to true
    // 2. POSTs to /api/projects with { name, description }
    // 3. sets loading to false
    // 4. closes the form and resets the fields

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault()

        setLoading(true)
        //  setError("");

        const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description }),
        })

        if (!response.ok) {
            setLoading(false)
            return //stop here if something went wrong
        }


        await queryClient.invalidateQueries({ queryKey: ["projects"] }) //triggers an automatic refetch and your new project appears on screen

        setLoading(false)
        setFormOpen(false)
        setName("")
        setDescription("")

    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header row with title and New Project button */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
                    <button
                        onClick={() => setFormOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        New Project
                    </button>
                </div>

                {/* New project form — only shows when FormOpen is true */}
                {FormOpen && (
                    <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg shadow-md mb-8">

                        {/* Name field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            />
                        </div>

                        {/* Description field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Create Project"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>

                    </form>
                )}

                {/* Show loading text while fetching projects */}
                {projectsLoading && <p className="text-gray-500">Loading...</p>}

                {/* Show the list of projects */}
                {projects?.map((project: Project) => (
                    <div key={project.id} className="bg-white p-6 rounded-lg shadow-md mb-4 cursor-pointer hover:shadow-lg">
                        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                        <p className="text-gray-500 mt-1">{project.description}</p>
                    </div>
                ))}

            </div>
        </div>
    );
}