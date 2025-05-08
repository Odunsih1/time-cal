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
        customAvailability: user.customAvailability,
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
    const {
      fullName,
      title,
      location,
      hourlyRate,
      about,
      profilePicUrl,
      availability,
      customAvailability,
      notifications,
    } = await request.json();
    // console.log("Updating profile for user:", userId, {
    //   fullName,
    //   title,
    //   location,
    //   hourlyRate,
    //   about,
    //   profilePicUrl,
    //   availability,
    //   customAvailability,
    //   notifications,
    // });

    await connectMongoDB();

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (title) updateData.title = title;
    if (location) updateData.location = location;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (about) updateData.about = about;
    if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;
    if (notifications) {
      updateData.notifications = notifications;
    }
    if (availability) {
      if (!Array.isArray(availability)) {
        console.error("Invalid availability: not an array");
        return NextResponse.json(
          { error: "Availability must be an array" },
          { status: 400 }
        );
      }
      for (const slot of availability) {
        if (
          !slot.day ||
          ![
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].includes(slot.day) ||
          !slot.startTime ||
          !slot.endTime ||
          !/^\d{2}:\d{2}$/.test(slot.startTime) ||
          !/^\d{2}:\d{2}$/.test(slot.endTime)
        ) {
          console.error("Invalid availability slot:", slot);
          return NextResponse.json(
            {
              error:
                "Each availability slot must have a valid day, startTime, and endTime",
            },
            { status: 400 }
          );
        }
      }
      updateData.availability = availability;
    }
    if (customAvailability) {
      if (!Array.isArray(customAvailability)) {
        console.error("Invalid customAvailability: not an array");
        return NextResponse.json(
          { error: "CustomAvailability must be an array" },
          { status: 400 }
        );
      }
      for (const slot of customAvailability) {
        if (
          !slot.date ||
          !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) ||
          !slot.startTime ||
          !slot.endTime ||
          !/^\d{2}:\d{2}$/.test(slot.startTime) ||
          !/^\d{2}:\d{2}$/.test(slot.endTime)
        ) {
          console.error("Invalid customAvailability slot:", slot);
          return NextResponse.json(
            {
              error:
                "Each customAvailability slot must have a valid date (yyyy-mm-dd), startTime, and endTime",
            },
            { status: 400 }
          );
        }
      }
      updateData.customAvailability = customAvailability;
    }

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
    return NextResponse.json({ user, message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
