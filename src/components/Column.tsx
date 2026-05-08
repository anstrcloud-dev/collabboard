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
      className={`rounded-lg p-4 w-64 min-h-96 transition-colors ${
        isOver ? "bg-blue-100" : "bg-gray-200"
      }`}
    >
      <h2 className="font-semibold text-gray-700 mb-4">{label}</h2>
      {children}
    </div>
  )
}