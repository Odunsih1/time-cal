import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import { z } from "zod";
import xss from "xss";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  about: z.string().optional(),
  profilePicUrl: z.string().url().optional().or(z.literal("")),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  notifications: z
    .object({
      newBooking: z.boolean().optional(),
      cancelledBooking: z.boolean().optional(),
      reminder: z.boolean().optional(),
      bookingConfirmationMessage: z.string().optional(),
      reminderMessage: z.string().optional(),
    })
    .optional(),
  availability: z
    .array(
      z.object({
        day: z.enum([
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ]),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        isAvailable: z.boolean().optional(),
      })
    )
    .optional(),
  customAvailability: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        isAvailable: z.boolean().optional(),
      })
    )
    .optional(),
});

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
        timezone: user.timezone,
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

    const body = await request.json();

    // Validate request body using Zod
    const validationResult = profileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      fullName,
      title,
      location,
      timezone,
      hourlyRate,
      about,
      profilePicUrl,
      availability,
      customAvailability,
      notifications,
      username,
    } = validationResult.data;

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
    //   username
    // });

    await connectMongoDB();

    const currentUser = await User.findOne({ _id: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!currentUser.isEmailVerified) {
      return NextResponse.json(
        { error: "Please verify your email to update profile" },
        { status: 403 }
      );
    }

    const updateData = {};
    if (fullName) updateData.fullName = xss(fullName);
    if (title) updateData.title = xss(title);
    if (location) updateData.location = xss(location);
    if (timezone) updateData.timezone = xss(timezone);
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (about) updateData.about = xss(about);
    if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;
    if (notifications) {
      updateData.notifications = { ...notifications };
      if (notifications.bookingConfirmationMessage) {
        updateData.notifications.bookingConfirmationMessage = xss(
          notifications.bookingConfirmationMessage
        );
      }
      if (notifications.reminderMessage) {
        updateData.notifications.reminderMessage = xss(
          notifications.reminderMessage
        );
      }
    }

    if (username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
      updateData.username = xss(username);
      updateData.bookingLink = `https://time-cal.vercel.app/book/${updateData.username}`;
    }
    if (availability) {
      updateData.availability = availability;
    }
    if (customAvailability) {
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
