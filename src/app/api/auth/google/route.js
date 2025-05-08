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

export async function POST(request) {
  try {
    const { idToken, fullName } = await request.json();
    console.log(
      "Google Sign-In request with idToken:",
      idToken.slice(0, 10) + "..."
    );
    await connectMongoDB();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, uid } = decodedToken;
    console.log("Verified Firebase user:", { uid, email });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        _id: uid,
        fullName: fullName || decodedToken.name || "Unknown",
        email,
        profilePicUrl: decodedToken.picture || "",
        password: "", // No password for Google Sign-In
      });
      await user.save();
      console.log("Created new user:", { _id: uid, email });
    } else {
      console.log("Existing user found:", { _id: user._id, email });
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
        user = new User({
          _id: uid,
          fullName: user.fullName || fullName || decodedToken.name || "Unknown",
          email,
          profilePicUrl: user.profilePicUrl || decodedToken.picture || "",
          password: user.password || "",
          title: user.title || "",
          location: user.location || "",
          hourlyRate: user.hourlyRate || 0,
          about: user.about || "",
          availability: user.availability || [],
          notifications: user.notifications || {},
          googleTokens: user.googleTokens || null,
        });
        await user.save();
        console.log("Recreated user with correct _id:", uid);
      }
    }

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
    console.error("Google Sign-In error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  console.log(`Received GET request with action: ${action}`);

  if (action === "login") {
    console.log("Initiating Google Calendar OAuth login");
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
      ],
      prompt: "consent",
    });
    return NextResponse.json({ authUrl: url }, { status: 200 }); // Return JSON instead of redirect
  }

  console.error(`Invalid action: ${action}`);
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
