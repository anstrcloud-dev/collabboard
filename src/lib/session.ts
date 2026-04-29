import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helper function that gets the current logged in user from the session
// If no user is logged in, it returns an error response automatically
// We'll use this at the start of every protected API route
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: session.user, error: null };
}