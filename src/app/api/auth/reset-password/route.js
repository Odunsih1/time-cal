import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Update password in Firebase
    await adminAuth.updateUser(user._id, { password });

    // Optionally update password in MongoDB (if stored)
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password }, // Update if your User schema stores passwords
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpiry: "",
        },
      }
    );

    console.log(`Password reset successful for user: ${user.email}`);
    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to reset password", details: error.message },
      { status: 500 }
    );
  }
}
