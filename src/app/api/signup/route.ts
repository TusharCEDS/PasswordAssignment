import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "@/models/User"; // make sure this path is correct

export async function POST(req: Request) {
  try {
    const { name, phone, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error("Missing MONGODB_URI");
    }
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = await User.create({ name, phone, email, password: hashedPassword });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
