import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      console.error("No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const {
      fullName,
      title,
      location,
      hourlyRate,
      about,
      availability,
      notifications,
      profilePicUrl,
    } = await request.json();

    console.log("Received update payload:", {
      fullName,
      title,
      location,
      hourlyRate,
      about,
      availability,
      notifications,
      profilePicUrl,
    });

    await connectMongoDB();

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (title) updateData.title = title;
    if (location) updateData.location = location;
    if (hourlyRate !== undefined) updateData.hourlyRate = Number(hourlyRate);
    if (about) updateData.about = about;
    if (availability) updateData.availability = availability;
    if (notifications) updateData.notifications = notifications;
    if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;

    console.log("Updating MongoDB with:", updateData);

    const user = await User.findOneAndUpdate(
      { email: decodedToken.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      console.error("User not found for email:", decodedToken.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Updated user:", user);
    return NextResponse.json(
      { message: "Profile updated", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
