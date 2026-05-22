"use client";

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

// This defines the shape of a Project object
type Project = {
    id: string
    name: string
    description: string | null
    createdAt: string
    role: "ADMIN" | "MEMBER"

};

export default function DashboardPage() {
    //4 state variables
    const [FormOpen, setFormOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    const queryClient = useQueryClient()

    const { status } = useSession()
    const router = useRouter()



    //fetches projects from /api/projects automatically
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await fetch("/api/projects")
            if (!res.ok) return []
            return res.json()
        },
    })

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    if (status === "loading" || status === "unauthenticated") {
        return <p className="p-8">Loading...</p>
    }


    //handleCreateProject async function:
    // 1. sets loading to true
    // 2. POSTs to /api/projects with { name, description }
    // 3. sets loading to false
    // 4. closes the form and resets the fields

    async function handleCreateProject(e: React.FormEvent) {
        e.preventDefault()

        setLoading(true) //Disables the "Create Project" button while the POST request is in progress, changes the button text from "Create Project" to "Creating..."

        const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description }),
        })

        if (!response.ok) {
            setLoading(false)
            return //stop here if something went wrong
        }

        setLoading(false)
        setFormOpen(false)
        setName("")
        setDescription("")

        await queryClient.invalidateQueries({ queryKey: ["projects"] }) //triggers an automatic refetch and your new project appears on screen

    }



    //Call DELETE /api/projects/${projectId}
    //Call invalidateQueries to refresh the list
    async function handleDeleteProject(projectId: string) {
        
        const confirmed = confirm("Are you sure you want to delete this project? This action cannot be undone.")

        if (!confirmed) return

        const response = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            // something went wrong, show an error
            return
        }
        await queryClient.invalidateQueries({ queryKey: ["projects"] }) //triggers an automatic refetch and your new project appears on screen

    }




    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white">My Projects</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
                        >
                            Logout
                        </button>
                        <button
                            onClick={() => setFormOpen(true)}
                            className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
                        >
                            New Project
                        </button>
                    </div>
                </div>

                {/* New project form */}
                {FormOpen && (
                    <form onSubmit={handleCreateProject} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl mb-8">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/80 mb-1">Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all"
                            >
                                {loading ? "Creating..." : "Create Project"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Loading */}
                {projectsLoading && <p className="text-white/70">Loading...</p>}

                {/* Project list */}
                {Array.isArray(projects) && projects.map((project: Project) => (
                    <div key={project.id} className="relative">
                        <Link href={`/dashboard/${project.id}`}>
                            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 mb-4 hover:bg-white/20 transition-all cursor-pointer">
                                <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                                <p className="text-white/60 mt-1">{project.description}</p>
                            </div>
                        </Link>

                        {/* Only show delete button if user is ADMIN */}
                        {project.role === "ADMIN" && (
                            <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="absolute top-4 right-4 p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all duration-200"
                                aria-label="Delete project"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {/* Empty state */}
                {Array.isArray(projects) && projects.length === 0 && !projectsLoading && (
                    <div className="text-center py-16">
                        <p className="text-white/60 text-lg">No projects yet. Create your first one!</p>
                    </div>
                )}

            </div>
        </div>
    )
}