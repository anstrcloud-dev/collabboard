"use client";

// "use client" tells Next.js this component runs in the browser
// This is needed because we use React hooks (useState) and handle form events

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // Store the form field values in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Store any error message to show to the user
  const [error, setError] = useState("");

  // Store loading state so we can disable the button while submitting
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // This runs when the user submits the login form
  async function handleSubmit(e: React.FormEvent) {
    // Prevent the browser from refreshing the page on form submit
    e.preventDefault();
    setLoading(true);
    setError("");

    // Call NextAuth's signIn function with the email and password
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Don't auto-redirect, we'll handle it ourselves
    });

    if (result?.error) {
      // If login failed, show an error message
      setError("Invalid email or password");
      setLoading(false);
    } else {
      // If login succeeded, redirect to the dashboard
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Sign in to CollabBoard
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Change button text while loading */}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}