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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md">

        <h1 className="text-2xl font-bold text-white mb-6">
          Sign in to CollabBoard
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
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
            <label className="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Show error message if login failed */}
          {error && (
            <p className="text-red-300 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full backdrop-blur-md bg-white/20 border border-white/30 text-white py-2 rounded-lg font-medium hover:bg-white/30 disabled:opacity-50 transition-all"
          >
            {/* Change button text while loading */}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white hover:underline font-medium">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}