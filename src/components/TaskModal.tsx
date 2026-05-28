"use client"


// shows task details when a task card is clicked
// Allows editing title, description, and deleting the task
type Task = {
  id: string
  title: string
  description: string | null
  status: "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
}

//assigning members to a task
type Member = {
  id: string
  role: string
  user: {
    id: string
    name: string
  }
}

//the modal needs information from the board page — but it's a separate component, so the board page passes that information as props
type Props = {
  task: Task
  editTitle: string
  editDescription: string

  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
  //for member assignment
  members: { id: string; user: { id: string; name: string } }[]
  assigneeId: string | null
  onAssigneeChange: (userId: string | null) => void
}

export function TaskModal({
  task,
  editTitle,
  editDescription,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onDelete,
  onClose,
  members,
  assigneeId,
  onAssigneeChange,
}: Props) {
  return (
    // Backdrop — clicking outside the modal closes it
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal card — stop click from bubbling to backdrop */}
      <div
        className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/60 text-sm">{task.status.replace("_", " ")}</span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Title input */}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent text-white text-xl font-bold mb-4 border-b border-white/20 pb-2 focus:outline-none focus:border-white/60"
          style={{ color: 'white' }}
          placeholder="Task title"
        />

        {/* Description input */}
        <textarea
          value={editDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none resize-none h-32 mb-6"
          style={{ color: 'white' }}
          placeholder="Add a description..."
        />
        {/* Assignee */}
        <div className="mb-6">
          <p className="text-white/70 text-sm mb-2">Assigned to</p>
          <select
            value={assigneeId || ""}
            onChange={(e) => onAssigneeChange(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none"
            style={{ color: 'white' }}
          >
            <option value="" className="bg-purple-900">Nobody</option>
            {members.map((member) => (
              <option key={member.id} value={member.user.id} className="bg-purple-900">
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        {/* Buttons */}
        <div className="flex justify-between">
          {task.id !== "new-suggested" ? (
            <button
              onClick={onDelete}
              className="backdrop-blur-md bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all"
            >
              Delete task
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}