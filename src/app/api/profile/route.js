// src/app/api/profile/route.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectMongoDB();

    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicUrl: user.profilePicUrl,
        isEmailVerified: user.isEmailVerified,
        title: user.title,
        location: user.location,
        hourlyRate: user.hourlyRate,
        about: user.about,
        availability: user.availability,
        customAvailability: user.customAvailability,
        notifications: user.notifications,
        emailSettings: user.emailSettings,
        googleTokens: user.googleTokens,
        bookingLink: user.bookingLink,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const { notifications, availability, customAvailability, emailSettings } =
      await request.json();

    await connectMongoDB();

    const updateData = {};
    if (notifications) updateData.notifications = notifications;
    if (availability) updateData.availability = availability;
    if (customAvailability) updateData.customAvailability = customAvailability;
    if (emailSettings) updateData.emailSettings = emailSettings;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { new: true }
    );
    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await adminFirestore.collection("users").doc(userId).set(
      {
        email: user.email,
        emailSettings: user.emailSettings,
      },
      { merge: true }
    );

    return NextResponse.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
