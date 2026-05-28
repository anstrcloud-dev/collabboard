"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

type Task = {
  id: string
  title: string
  description: string | null
  status: "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  assigneeId: string | null
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


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 mb-2 cursor-pointer hover:bg-white/20 transition-all"
      onClick={() => onClick(task)}
    >
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

        {/* Assignee initials circle */}
        {task.assignee && (
          <div className="flex justify-end mt-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {task.assignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}