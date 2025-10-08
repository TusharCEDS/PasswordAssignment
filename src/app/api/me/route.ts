import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    // ✅ Get cookies from the request
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      .find((c) => c.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // ✅ Verify JWT
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // ✅ Connect to MongoDB
    if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(process.env.MONGODB_URI);

    // ✅ Find user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
}
