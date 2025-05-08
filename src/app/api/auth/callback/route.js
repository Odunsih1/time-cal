import { google } from "googleapis";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://time-cal.vercel.app/api/auth/callback"
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  console.log("Handling OAuth callback with code:", code);

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Check for session cookie
    const sessionCookie = req.cookies.get("session")?.value || "";
    console.log("Session cookie:", sessionCookie ? "Present" : "Missing");
    if (!sessionCookie) {
      console.error("No session cookie found");
      return NextResponse.json(
        { error: "No active session. Please sign in first." },
        { status: 401 }
      );
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    const userId = decodedClaims.uid;
    console.log("Verified user ID:", userId);

    // Connect to MongoDB
    await connectMongoDB();

    // Verify user exists
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error("User not found in MongoDB for _id:", userId);
      return NextResponse.json(
        {
          error: "User not found. Please sign in again to create your profile.",
        },
        { status: 404 }
      );
    }
    console.log("Found user:", { _id: user._id, email: user.email });

    // Save Google tokens
    const updateResult = await User.updateOne(
      { _id: userId },
      { $set: { googleTokens: tokens } }
    );
    console.log("MongoDB update result:", updateResult);

    if (updateResult.matchedCount === 0) {
      console.error("No user matched for update, _id:", userId);
      return NextResponse.json(
        { error: "Failed to update user. User not found." },
        { status: 404 }
      );
    }

    console.log("Google tokens saved for user:", userId);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("OAuth callback error:", error.message, error.stack);
    if (error.name === "CastError") {
      console.error(
        "CastError details: Invalid _id format for userId:",
        userId
      );
      return NextResponse.json(
        { error: "Invalid user ID format. Please reset your user data." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Authentication failed", details: error.message },
      { status: 500 }
    );
  }
}
