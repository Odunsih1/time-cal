import { google } from "googleapis";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import Booking from "@/models/Booking";

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get("session")?.value || "";
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    const userId = decodedClaims.uid;

    await connectMongoDB();
    const user = await User.findOne({ _id: userId });
    if (!user.googleTokens) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:3000/api/auth/callback"
    );
    oauth2Client.setCredentials(user.googleTokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Fetch Google Calendar events
    const { data: googleEvents } = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    // Sync Google events to Time-Cal bookings
    const bookings = googleEvents.items.map((event) => ({
      userId,
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      status: "upcoming",
      title: event.summary,
      googleEventId: event.id,
    }));

    // Update MongoDB bookings
    await Booking.deleteMany({ userId, googleEventId: { $exists: true } });
    if (bookings.length > 0) {
      await Booking.insertMany(bookings);
    }

    // Sync Time-Cal bookings to Google Calendar
    const timeCalBookings = await Booking.find({
      userId,
      googleEventId: { $exists: false },
    });
    for (const booking of timeCalBookings) {
      const event = {
        summary: booking.title || "Time-Cal Booking",
        start: { dateTime: new Date(booking.startTime).toISOString() },
        end: { dateTime: new Date(booking.endTime).toISOString() },
      };
      const { data } = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { googleEventId: data.id } }
      );
    }

    return NextResponse.json(
      { message: "Calendar synced successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    );
  }
}
