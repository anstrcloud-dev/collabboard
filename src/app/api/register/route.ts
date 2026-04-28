import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// This function handles POST requests to /api/register
// It creates a new user account in the database
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const { name, email, password } = await request.json();

    // Make sure all required fields are provided
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if a user with this email already exists in the database
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    // If email is taken, return an error instead of creating a duplicate
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash the password before storing it
    // The number 12 is the "salt rounds" — higher = more secure but slower
    // Never store plain text passwords in the database
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user in the database with the hashed password
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Return a success response with the new user's ID
    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    // If anything goes wrong, return a generic error
    // We don't expose the actual error to the client for security reasons
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}