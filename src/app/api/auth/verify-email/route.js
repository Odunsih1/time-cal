import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const oobCode = searchParams.get("oobCode"); // Firebase verification code

    if (!oobCode) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Verify email with Firebase
    await adminAuth.applyActionCode(oobCode);

    // Find user by email (Firebase stores the email in the action code)
    const userRecord = await adminAuth.getUserByEmail(
      await adminAuth.verifyIdToken(oobCode).then((decoded) => decoded.email)
    );

    await connectMongoDB();
    await User.updateOne(
      { _id: userRecord.uid },
      { $set: { isEmailVerified: true } }
    );

    console.log(`Email verified for user: ${userRecord.email}`);
    return NextResponse.redirect(
      new URL("/auth?verified=true", process.env.NEXTAUTH_URL)
    );
  } catch (error) {
    console.error("Email verification error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to verify email", details: error.message },
      { status: 400 }
    );
  }
}
