// pages/api/vault.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import VaultItem from "@/models/VaultItem"; // define a schema with userId, title, username, password, etc.
import { verifyJWT } from "@/utils/jwt"; // helper to verify JWT from cookie

export async function GET(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyJWT(token);
    const userId = decoded.id;

    const items = await VaultItem.find({ userId });
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
