import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Verify user exists in Firebase
    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified in Firebase" },
        { status: 400 }
      );
    }

    // Update MongoDB
    await connectMongoDB();
    const updatedUser = await User.findOneAndUpdate(
      { _id: uid },
      { $set: { isEmailVerified: true } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found in MongoDB" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Email verification completed" });
  } catch (error) {
    console.error(
      "Email verification complete error:",
      error.message,
      error.stack
    );
    return NextResponse.json(
      { error: `Failed to complete verification: ${error.message}` },
      { status: 500 }
    );
  }
}
