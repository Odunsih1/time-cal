import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
      console.error("No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    await connectMongoDB();

    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      console.error("User not found for email:", decodedToken.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bookings = await Booking.find({ userId: user._id }).lean();
    console.log("Fetched bookings for user:", user._id, bookings.length);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
