import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User"; // Ensure User model is imported
import { adminAuth } from "@/lib/firebaseAdmin";
import nodemailer from "nodemailer";
import { generateEmailTemplate } from "@/lib/emailTemplate";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    // console.log("Received GET request to /api/bookings");
    const authHeader = request.headers.get("Authorization");
    // console.log("Authorization header:", authHeader ? "Present" : "Missing");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    // console.log("Verifying ID token");
    if (!adminAuth) {
      throw new Error("Firebase auth is not initialized");
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    // console.log("Fetching bookings for user:", userId);

    // console.log("Connecting to MongoDB");
    await connectMongoDB();
    // console.log("MongoDB connected");

    // console.log("Querying bookings");
    const bookings = await Booking.find({ userId });
    // console.log("Bookings fetched:", bookings.length);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Bookings fetch error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      userId,
      clientName,
      clientEmail,
      clientMessage,
      date,
      startTime,
      endTime,
    } = await request.json();
    // console.log("Booking request:", {
    //   userId,
    //   clientName,
    //   clientEmail,
    //   date,
    //   startTime,
    //   endTime,
    // });

    // Validate required fields
    if (
      !userId ||
      !clientName ||
      !clientEmail ||
      !date ||
      !startTime ||
      !endTime
    ) {
      console.error("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    // console.log("MongoDB connected");

    // Validate userId exists in User collection (check both _id and username)
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findOne({ _id: userId });
    }
    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      console.error("User not found for ID/Username:", userId);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 404 });
    }

    // Ensure we use the actual MongoDB _id for the booking record
    const resolvedUserId = user._id.toString();

    // Validate time slot availability (simplified for public access)
    const existingBooking = await Booking.findOne({
      userId: resolvedUserId,
      date,
      startTime,
      endTime,
    });
    if (existingBooking) {
      console.error("Time slot already booked:", { date, startTime, endTime });
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // Optional: Validate against user's availability (if required)
    const isAvailable = (() => {
      const customMatch = user.customAvailability?.some(
        (slot) =>
          slot.date === date &&
          slot.startTime === startTime &&
          slot.endTime === endTime
      );
      if (customMatch) return true;

      const dayOfWeek = new Date(date).toLocaleString("en-US", {
        weekday: "long",
      });
      return user.availability?.some(
        (slot) =>
          slot.day === dayOfWeek &&
          slot.startTime === startTime &&
          slot.endTime === endTime
      );
    })();
    if (!isAvailable) {
      console.error("Selected time slot not available:", {
        date,
        startTime,
        endTime,
      });
      return NextResponse.json(
        { error: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Create new booking
    const booking = new Booking({
      userId: resolvedUserId,
      clientName,
      clientEmail,
      clientMessage: clientMessage || "",
      date,
      startTime,
      endTime,
      status: "upcoming", // Explicitly set default status
    });
    await booking.save();
    // console.log("Booking created:", booking._id);

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const bookingConfirmationMessage =
      user.notifications?.bookingConfirmationMessage ||
      "Thank you for your booking!";

    const htmlContent = generateEmailTemplate({
      title: "Booking Confirmation",
      body: `<p>${bookingConfirmationMessage}</p><p>We'll confirm your booking soon.</p>`,
      details: [
        { label: "Client", value: clientName },
        { label: "Date", value: date },
        { label: "Time", value: `${startTime} - ${endTime}` },
        { label: "Message", value: clientMessage || "None" },
      ],
      ctaLink: `${process.env.NEXTAUTH_URL}/dashboard`,
      ctaText: "View Dashboard",
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [clientEmail, user.email],
      subject: `Booking Confirmation with ${user.fullName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    // console.log("Booking confirmation email sent to:", clientEmail, user.email);

    return NextResponse.json(
      { message: "Booking created successfully", bookingId: booking._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
