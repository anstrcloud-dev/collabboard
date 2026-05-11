import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
      <div className="text-center max-w-2xl px-8">

        {/* Glass card */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">

          {/* App name */}
          <h1 className="text-6xl font-bold text-white mb-4">CollabBoard</h1>

          {/* Description */}
          <p className="text-xl text-white/80 mb-10">
            A simple project management tool for teams.
            <br />
            Organize tasks, track progress, and collaborate
            <br />
            in real time.
          </p>

          {/* Glass buttons */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-8 py-3 rounded-full hover:bg-white/30 font-medium transition-all"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="backdrop-blur-md bg-white/10 border border-white/20 text-white px-8 py-3 rounded-full hover:bg-white/20 font-medium transition-all"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}