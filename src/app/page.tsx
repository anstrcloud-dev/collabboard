import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"


export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
    <div className="text-center max-w-2xl px-8">

      {/* Glass card */}
      <div className="backdrop-blur-md bg-white/70 border border-white/30 rounded-3xl p-12 pt-2 shadow-2xl">

        {/* App logo */}
        <img
          src="/logoApp.png"
          alt="Flowbit"
          className="w-full mx-auto mb-0 drop-shadow-2xl -mt-8 saturate-120"
        />

        {/* Description */}
        <p className="-mt-16 text-xl mb-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
          Organize tasks, track progress, and collaborate
          <br />
          in real time.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white/75 px-8 py-3 rounded-full font-medium transition-all hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white/75 px-8 py-3 rounded-full font-medium transition-all hover:opacity-90 opacity-70"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  </div>
)
}