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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Create an account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Show error message if login failed */}
                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {/* TODO: show "Creating account..." when loading, otherwise "Create account" */}
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-4 text-sm text-gray-600 text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}