import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    // console.log("Fetching user:", userId);

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
        customAvailability: user.customAvailability,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
