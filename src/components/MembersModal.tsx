"use client"

// MembersModal — shows project members and allows inviting new ones
// Only ADMINs can invite new members

type Member = {
  id: string
  role: "ADMIN" | "MEMBER"
  user: {
    id: string
    name: string
    email: string
  }
}

type Props = {
  members: Member[]
  inviteEmail: string
  inviteRole: string
  inviteError: string
  onEmailChange: (value: string) => void
  onRoleChange: (value: string) => void
  onInvite: () => void
  onClose: () => void
  isAdmin: boolean
  onRemoveMember: (memberId: string) => void
  currentUserId: string
}

export function MembersModal({
  members,
  inviteEmail,
  inviteRole,
  inviteError,
  onEmailChange,
  onRoleChange,
  onInvite,
  onClose,
  isAdmin,
  onRemoveMember,
  currentUserId
}: Props) {

  return (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Project Members</h2>
        
        <button onClick={onClose} className="text-white/60 hover:text-white text-xl transition-all">
          ✕
        </button>
      </div>

      {/* Members list */}
      <div className="mb-6 space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between bg-white/10 border border-white/20 rounded-lg px-4 py-2">
            <div>
              <p className="text-white text-sm font-medium">{member.user.name}</p>
              <p className="text-white/50 text-xs">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                {member.role}
              </span>
              {isAdmin && member.user.id !== currentUserId && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="text-red-300 hover:text-red-400 text-xs transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite form — only shown to admins */}
      {isAdmin && (
        <div>
          <p className="text-white/70 text-sm mb-3">Invite someone</p>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="their@email.com"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none mb-2"
          />
          <select
            value={inviteRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white mb-2 focus:outline-none"
          >
            <option value="MEMBER" className="bg-purple-900">Member</option>
            <option value="ADMIN" className="bg-purple-900">Admin</option>
          </select>
          {inviteError && <p className="text-red-300 text-sm mb-2">{inviteError}</p>}
          <button
            onClick={onInvite}
            className="w-full backdrop-blur-md bg-white/20 border border-white/30 text-white py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            Invite
          </button>
        </div>
      )}

    </div> {/* ← modal card closes here */}
  </div> 
)
}