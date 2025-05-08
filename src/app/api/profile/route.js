import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

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
    // console.log("Fetching profile for user:", userId);

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
        title: user.title,
        location: user.location,
        hourlyRate: user.hourlyRate,
        about: user.about,
        availability: user.availability,
        notifications: user.notifications,
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
    const { notifications, availability } = await request.json();
    // console.log("Updating profile for user:", userId, {
    //   notifications,
    //   availability,
    // });

    await connectMongoDB();

    const updateData = {};
    if (notifications) updateData.notifications = notifications;
    if (availability) updateData.availability = availability;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { new: true }
    );
    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log("Profile updated for user:", userId);
    return NextResponse.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
