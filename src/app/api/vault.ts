// pages/api/vault.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers"; // import cookies helper
 // define a schema with userId, title, username, password, etc.
//import { verifyJWT } from "../../utils/jwt"; // helper to verify JWT from cookie

export async function GET(req: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    //const token = cookies().get("token")?.value;
    //if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    //const decoded = verifyJWT(token);
    //const userId = decoded.id;
    //if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const VaultItem = mongoose.models.VaultItem || mongoose.model("VaultItem", new mongoose.Schema({
      userId: String,
      title: String,
      username: String,
      password: String,
      url: String,
      notes: String,
      createdAt: { type: Date, default: Date.now },
    }));
    //const items = await VaultItem.find({ userId }).sort({ createdAt: -1 });
    //return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
