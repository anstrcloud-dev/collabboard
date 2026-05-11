import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-8">

        {/* App name */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">CollabBoard</h1>

        {/* Description */}
        <p className="text-xl text-gray-600 mb-8">
          A simple project management tool for teams. Organize tasks, track progress, and collaborate in real time.
        </p>

        {/* Navigation buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-medium"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}