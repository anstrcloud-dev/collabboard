"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

type Task = {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  description: string | null
  project: {
    id: string
    name: string
  }
}

type Project = {
  id: string
  name: string
  role: "ADMIN" | "MEMBER"
}

function getPriorityBadge(priority: string) {
  if (priority === "HIGH") return <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">🔴 high</span>
  if (priority === "MEDIUM") return <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">🟡 medium</span>
  if (priority === "LOW") return <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">🟢 low</span>
  return null
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    BACKLOG: "text-white/40",
    IN_PROGRESS: "text-blue-300",
    IN_REVIEW: "text-yellow-300",
    DONE: "text-green-300",
  }
  return <span className={`text-xs ${colors[status] || "text-white/40"}`}>{status.replace("_", " ")}</span>
}

function TaskList({ tasks, label, onTaskClick }: {
  tasks: Task[]
  label: string
  onTaskClick: (task: Task) => void
}) {
  if (tasks.length === 0) return null
  return (
    <div className="mb-6">
      <h3 className="text-white/60 text-sm font-medium mb-2">{label}</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 hover:bg-white/20 transition-all cursor-pointer"
            onClick={() => onTaskClick(task)}
          >
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{task.title}</p>
              <div className="flex items-center gap-2">
                {getPriorityBadge(task.priority)}
                <Link
                  href={`/dashboard/${task.project.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/40 hover:text-white/80 text-xs border border-white/20 px-2 py-0.5 rounded-lg transition-all"
                >
                  → project
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-xs">{task.project.name}</span>
              <span className="text-white/20 text-xs">·</span>
              {getStatusBadge(task.status)}
              {task.dueDate && (
                <span className="text-white/40 text-xs">· Due {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const { data: tasks = [] } = useQuery({
    queryKey: ["assigned-tasks"],
    queryFn: () => fetch("/api/tasks/assigned").then(res => res.json()),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/projects").then(res => res.json()),
  })

  if (status === "loading") return <p className="text-white p-8">Loading...</p>

  const highTasks = tasks.filter((t: Task) => t.priority === "HIGH")
  const mediumTasks = tasks.filter((t: Task) => t.priority === "MEDIUM")
  const lowTasks = tasks.filter((t: Task) => t.priority === "LOW")
  const noneTasks = tasks.filter((t: Task) => t.priority === "NONE")

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        {/* User info */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{session?.user?.name}</h2>
              <p className="text-white/60 text-sm">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Projects</h2>
          <div className="space-y-2">
            {projects.map((project: Project) => (
              <Link key={project.id} href={`/dashboard/${project.id}`}>
                <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-4 py-2 hover:bg-white/20 transition-all">
                  <p className="text-white text-sm">{project.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${project.role === "ADMIN" ? "bg-purple-500/20 text-purple-300" : "bg-white/10 text-white/50"}`}>
                    {project.role.toLowerCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Assigned tasks */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">My Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-white/40 text-sm">No tasks assigned to you yet.</p>
          ) : (
            <>
              <TaskList tasks={highTasks} label="🔴 High Priority" onTaskClick={setSelectedTask} />
              <TaskList tasks={mediumTasks} label="🟡 Medium Priority" onTaskClick={setSelectedTask} />
              <TaskList tasks={lowTasks} label="🟢 Low Priority" onTaskClick={setSelectedTask} />
              <TaskList tasks={noneTasks} label="No Priority" onTaskClick={setSelectedTask} />
            </>
          )}
        </div>

      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedTask.priority)}
                {getStatusBadge(selectedTask.status)}
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>

            <h2 className="text-white text-xl font-bold mb-2">{selectedTask.title}</h2>
            <p className="text-white/50 text-sm mb-1">{selectedTask.project.name}</p>

            {selectedTask.description && (
              <p className="text-white/60 text-sm mt-3 mb-4">{selectedTask.description}</p>
            )}

            {selectedTask.dueDate && (
              <p className="text-white/50 text-xs mb-6">
                Due {new Date(selectedTask.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}

            <Link
              href={`/dashboard/${selectedTask.project.id}`}
              className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
            >
              → Go to board
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}