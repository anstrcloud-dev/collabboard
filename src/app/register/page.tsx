"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
    // TODO: create 4 state variables — name, email, password, error, loading
    const [name, setName] = useState("")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Store any error message to show to the user
    const [error, setError] = useState("")

    // Store loading state so we can disable the button while submitting
    const [loading, setLoading] = useState(false)


    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        // TODO: prevent default form behaviour
        e.preventDefault()

        setLoading(true)
        setError("")

        // TODO: make a POST request to /api/register
        // with a JSON body containing name, email, password
        // hint: use fetch("/api/register", { method: "POST", headers: ..., body: ... })
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });


        if (!response.ok) {
            const data = await response.json()
            setError(data.error)
            setLoading(false)
            return
        }

        // TODO: if registration succeeded, redirect to /login
        else {
            router.push("/login")
        }
    }

    return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md">

        <h1 className="text-2xl font-bold text-white mb-6">
          Create an account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full backdrop-blur-md bg-white/20 border border-white/30 text-white py-2 rounded-lg font-medium hover:bg-white/30 disabled:opacity-50 transition-all"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}