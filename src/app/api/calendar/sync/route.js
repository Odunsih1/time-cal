import { google } from "googleapis";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { format, parse } from "date-fns";

export async function POST(req) {
  try {
    const sessionCookie = req.cookies.get("session")?.value || "";
    if (!sessionCookie) {
      // console.log("No session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    const userId = decodedClaims.uid;
    // console.log("Verified user ID:", userId);

    await connectMongoDB();
    const user = await User.findOne({ _id: userId });
    if (!user) {
      // console.log("User not found in MongoDB:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.googleTokens) {
      // console.log("Google Calendar not connected for user:", userId);
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://time-cal.vercel.app/api/auth/callback"
    );
    oauth2Client.setCredentials(user.googleTokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Fetch Google Calendar events
    // console.log("Fetching Google Calendar events");
    const { data: googleEvents } = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    // Sync Google events to Time-Cal bookings
    const bookings = googleEvents.items.map((event) => {
      const startDate = event.start.dateTime || event.start.date;
      // Derive clientName from attendees, creator, or summary
      const clientName =
        event.attendees?.find((a) => a.displayName)?.displayName ||
        event.attendees?.[0]?.displayName ||
        event.creator?.displayName ||
        event.summary ||
        "Google Event";
      // Derive clientEmail from attendees or user email
      const clientEmail =
        event.attendees?.find((a) => a.email && a.email !== user.email)
          ?.email ||
        event.creator?.email ||
        user.email ||
        "no-email@google-event.com";
      return {
        userId,
        date: startDate
          ? format(new Date(startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        clientName,
        clientEmail,
        clientMessage: event.description || "",
        status: "upcoming",
        title: event.summary || "Untitled Event",
        googleEventId: event.id,
      };
    });

    // Update MongoDB bookings
    // console.log("Deleting existing Google-synced bookings");
    await Booking.deleteMany({ userId, googleEventId: { $exists: true } });

    if (bookings.length > 0) {
      // console.log(`Inserting ${bookings.length} new bookings`);
      try {
        await Booking.insertMany(bookings);
      } catch (validationError) {
        console.error("Booking insertion failed:", validationError);
        return NextResponse.json(
          {
            error: "Failed to sync bookings due to validation error",
            details: validationError.message,
          },
          { status: 400 }
        );
      }
    } else {
      // console.log("No Google events to sync");
    }

    // Sync Time-Cal bookings to Google Calendar
    // console.log("Fetching Time-Cal bookings for Google sync");
    const timeCalBookings = await Booking.find({
      userId,
      googleEventId: { $exists: false },
    });

    for (const booking of timeCalBookings) {
      // console.log(`Syncing Time-Cal booking: ${booking._id}`);
      try {
        // Combine date and time into ISO format
        const startDateTime = parse(
          `${booking.date} ${booking.startTime}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );
        const endDateTime = parse(
          `${booking.date} ${booking.endTime}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
          console.warn(`Invalid date/time for booking ${booking._id}:`, {
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
          });
          continue;
        }

        const event = {
          summary: booking.title || `Booking with ${booking.clientName}`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          description: booking.clientMessage || "",
          attendees: [{ email: booking.clientEmail }],
        };

        const { data } = await calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });

        await Booking.updateOne(
          { _id: booking._id },
          { $set: { googleEventId: data.id } }
        );
        // console.log(`Synced booking ${booking._id} to Google event ${data.id}`);
      } catch (error) {
        console.error(`Failed to sync booking ${booking._id}:`, error);
        continue;
      }
    }

    // console.log("Calendar sync completed successfully");
    return NextResponse.json(
      {
        message: "Calendar synced successfully",
        syncedBookings: bookings.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calendar sync error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to sync calendar", details: error.message },
      { status: 500 }
    );
  }
}
