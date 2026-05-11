"use client"

import { useDroppable } from "@dnd-kit/core"

type Props = {
  id: string
  label: string
  children: React.ReactNode
}

export function Column({ id, label, children }: Props) {
  // useDroppable makes this element a drop target
  // We pass the column id so onDragEnd knows which column was dropped on
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-6 w-80 min-h-96 transition-all backdrop-blur-md border ${isOver ? "bg-white/20 border-white/40" : "bg-white/10 border-white/20"
        }`}
    >
      <h2 className="font-semibold text-white text-lg mb-4">{label}</h2>
      {children}
    </div>
  )
}