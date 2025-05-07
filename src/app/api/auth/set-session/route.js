import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { idToken } = await req.json();
    console.log("Creating session for ID token:", idToken.slice(0, 10) + "...");

    // Verify ID token
    const decodedClaims = await adminAuth.verifyIdToken(idToken);

    // Create session cookie (5 days expiry)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set cookie in response
    const response = NextResponse.json(
      { message: "Session created" },
      { status: 200 }
    );
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // False for localhost
      sameSite: "lax", // Allows cookie in OAuth redirects
      path: "/",
    });

    console.log("Session cookie set successfully");
    return response;
  } catch (error) {
    console.error("Set session error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to create session", details: error.message },
      { status: 401 }
    );
  }
}
