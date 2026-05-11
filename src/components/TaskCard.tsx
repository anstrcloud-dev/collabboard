"use client"

import { useDraggable } from "@dnd-kit/core"

type Task = {
  id: string
  title: string
  description: string | null
}

export function TaskCard({ task }: { task: Task }) {
  // useDraggable makes this element draggable
  // We pass the task id so onDragEnd knows which task was dragged
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  // Move the card visually while dragging
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

   return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing hover:bg-white/20 transition-all"
    >
      <p className="text-sm font-medium text-white">{task.title}</p>
      {task.description && (
        <p className="text-xs text-white/60 mt-1">{task.description}</p>
      )}
    </div>
  )
}