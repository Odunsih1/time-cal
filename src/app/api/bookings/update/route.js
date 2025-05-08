import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin"; // Assuming you have a firebaseAdmin setup for server-side auth
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { bookingId, status } = await request.json();
    // console.log("Update booking request:", { bookingId, status });

    // Validate request
    if (!bookingId || !status || !["completed", "cancelled"].includes(status)) {
      console.error("Missing or invalid fields");
      return NextResponse.json(
        { error: "Missing or invalid bookingId or status" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectMongoDB();

    // Find the booking and verify it belongs to the user
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      console.error("Booking not found or unauthorized:", {
        bookingId,
        userId,
      });
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prevent updating if already completed or cancelled
    if (booking.status !== "upcoming") {
      console.error("Booking cannot be updated:", {
        bookingId,
        status: booking.status,
      });
      return NextResponse.json(
        { error: "Booking is already completed or cancelled" },
        { status: 400 }
      );
    }

    // Update booking status
    booking.status = status;
    await booking.save();
    // console.log("Booking updated:", { bookingId, status });

    // Fetch user for email notification
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error("User not found for notification:", userId);
    } else {
      // Send email notification to client
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const statusMessage =
        status === "completed"
          ? "Your booking has been marked as completed."
          : "Your booking has been cancelled.";
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: [booking.clientEmail, user.email],
        subject: `Booking Status Update with ${user.fullName}`,
        text: `
          ${statusMessage}
          
          Booking Details:
          - Client: ${booking.clientName}
          - Date: ${booking.date}
          - Time: ${booking.startTime} - ${booking.endTime}
          - Message: ${booking.clientMessage || "None"}
        `,
      };

      await transporter.sendMail(mailOptions);
      // console.log(
      //   "Status update email sent to:",
      //   booking.clientEmail,
      //   user.email
      // );
    }

    return NextResponse.json(
      { message: `Booking marked as ${status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update booking error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
