import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    await connectMongoDB();

    const user = await User.findOne({ email: decodedToken.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
