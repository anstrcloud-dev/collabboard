"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

type Task = {
  id: string
  title: string
  description: string | null
  status: "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "NONE"
  assigneeId: string | null
  dueDate: string | null
  assignee: {
    id: string
    name: string
  } | null
}

//add an onClick prop so the board page can handle the click
type Props = {
  task: Task // expects a Task object
  onClick: (task: Task) => void // expects a function that takes a Task
}

export function TaskCard({ task, onClick }: Props) {
  // useDraggable makes this element draggable
  // We pass the task id so onDragEnd knows which task was dragged
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
    position: isDragging ? 'relative' as const : undefined,
  }


  function formatDueDate(dueDate: string): { text: string; color: string } {
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
      return { text: `Overdue ${Math.abs(diffDays)}d`, color: "text-red-300" }
    } else if (diffHours < 24) {
      return { text: `Due in ${diffHours}h`, color: "text-yellow-300" }
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, color: "text-yellow-300" }
    } else {
      return {
        text: `Due ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        color: "text-white/50"
      }
    }
  }


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 mb-2 cursor-pointer hover:bg-white/20 transition-all"
      onClick={() => onClick(task)}
    >
      {/* Assignee initials — top right corner */}
      {task.assignee && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {task.assignee.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {/* Drag handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-medium text-white">{task.title}</p>
        {task.description && (
          <p className="text-xs text-white/60 mt-1 truncate">{task.description}</p>
        )}

        {/* Bottom row — priority badge + assignee */}
        <div className="flex justify-between items-center mt-2">
          {/* Priority badge — only show if not NONE */}
          {task.priority && task.priority !== "NONE" ? (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              task.priority === "HIGH"
              ? "bg-red-500/20 text-red-300"
              : task.priority === "MEDIUM"
                ? "bg-yellow-500/20 text-yellow-300"
                : "bg-green-500/20 text-green-300"
              }`}>
              {task.priority === "HIGH" ? "🔴" : task.priority === "MEDIUM" ? "🟡" : "🟢"} {task.priority.toLowerCase()}
            </span>
          ) : (
            <div />
          )}
          {task.dueDate && (
            <p className={`text-xs mt-1 ${formatDueDate(task.dueDate).color}`}>
              🗓 {formatDueDate(task.dueDate).text}
            </p>
          )}

        </div>
      </div>

    </div>

  )
}