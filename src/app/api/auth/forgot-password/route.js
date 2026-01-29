import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generateEmailTemplate } from "@/lib/emailTemplate";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal user existence for security
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent" },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    // Save token and expiry to user
    await User.updateOne(
      { email },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
        },
      }
    );

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset/${resetToken}`;

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    const htmlContent = generateEmailTemplate({
      title: "Reset Your Password",
      body: `
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <p>This link will expire in 1 hour.</p>
        <p style="font-size: 14px; color: #64748b;">If you didn't request this, please ignore this email.</p>
      `,
      ctaLink: resetLink,
      ctaText: "Reset Password",
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Time-Cal Password Reset",
      html: htmlContent,
    });

    console.log(
      `Password reset email sent to ${email} with token: ${resetToken}`
    );
    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to send reset link", details: error.message },
      { status: 500 }
    );
  }
}
