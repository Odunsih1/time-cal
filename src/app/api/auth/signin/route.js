import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, idToken } = await request.json();
    console.log("Sign-in request for email:", email);

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log("Verified Firebase UID:", uid);

    await connectMongoDB();

    // Find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found in MongoDB:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify _id matches Firebase UID
    if (user._id !== uid) {
      console.warn(
        "UID mismatch for email:",
        email,
        "Stored _id:",
        user._id,
        "Firebase UID:",
        uid
      );
      await User.deleteOne({ _id: user._id });
      console.log("Deleted user with mismatched _id:", user._id);
      return NextResponse.json(
        { error: "User ID mismatch. Please sign up again." },
        { status: 400 }
      );
    }

    console.log("Sign-in successful for user:", { _id: uid, email });
    return NextResponse.json(
      {
        user: {
          id: uid,
          email,
          fullName: user.fullName,
          profilePicUrl: user.profilePicUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign-in error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
