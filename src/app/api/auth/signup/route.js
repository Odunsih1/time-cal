import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseConfig"; // Client-side Firebase auth
import { adminAuth } from "@/lib/firebaseAdmin"; // Admin SDK
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  console.log("Received request to /api/auth/signup");
  try {
    const { fullName, email, password, profilePicUrl } = await request.json();
    console.log("Request payload:", {
      fullName,
      email,
      profilePicUrl,
      password: password ? "Present" : "Missing",
    });

    // Validate required fields
    if (!fullName || !email) {
      console.error("Missing required fields:", { fullName, email });
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    console.log("MongoDB connected");

    // Check for existing user in MongoDB
    console.log(`Checking MongoDB for email: ${email}`);
    let user = await User.findOne({ email });
    if (user) {
      console.error(
        "Email already registered in MongoDB:",
        email,
        "Stored _id:",
        user._id
      );
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check for existing Firebase user
    console.log(`Checking Firebase for email: ${email}`);
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
      console.error("Firebase user found:", firebaseUser.uid);
      // Check if MongoDB is out of sync
      if (!user) {
        console.log("No MongoDB user, creating one for existing Firebase user");
        const hashedPassword = password
          ? await bcrypt.hash(password, 10)
          : null;
        user = new User({
          _id: firebaseUser.uid,
          fullName: fullName || firebaseUser.displayName || "Unnamed User",
          email,
          password: hashedPassword,
          profilePicUrl: profilePicUrl || firebaseUser.photoURL || "",
          bookingLink: `http://localhost:3000/book/${firebaseUser.uid}`,
        });
        await user.save();
        console.log(
          "MongoDB user created for existing Firebase user:",
          firebaseUser.uid
        );
        return NextResponse.json(
          {
            message: "User synced and created",
            user: { id: firebaseUser.uid, email, fullName, profilePicUrl },
          },
          { status: 201 }
        );
      }
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.error("Firebase check error:", error.message, error.stack);
        throw error;
      }
      console.log("No Firebase user found for email:", email);
    }

    // Create Firebase user (if password is provided)
    if (!password) {
      console.error("Password required for Firebase signup");
      return NextResponse.json(
        { error: "Password is required for signup" },
        { status: 400 }
      );
    }

    try {
      console.log(`Creating Firebase user for email: ${email}`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      firebaseUser = userCredential.user;
      console.log("Firebase user created:", firebaseUser.uid);
    } catch (error) {
      console.error("Firebase signup error:", error.code, error.message);
      return NextResponse.json(
        { error: error.message || "Failed to create Firebase user" },
        { status: 400 }
      );
    }

    // Save user to MongoDB
    try {
      console.log(`Saving user to MongoDB: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        _id: firebaseUser.uid, // Firebase UID
        fullName,
        email,
        password: hashedPassword,
        profilePicUrl: profilePicUrl || "",
        bookingLink: `http://localhost:3000/book/${firebaseUser.uid}`, // Add booking link
      });
      await user.save();
      console.log("MongoDB user saved:", { _id: firebaseUser.uid, email });
    } catch (error) {
      console.error(
        "MongoDB save error, rolling back Firebase user:",
        error.message
      );
      try {
        await adminAuth.deleteUser(firebaseUser.uid);
        console.log("Rolled back Firebase user:", firebaseUser.uid);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }
      return NextResponse.json(
        { error: "Failed to save user in database" },
        { status: 500 }
      );
    }

    console.log("User created successfully:", email);
    return NextResponse.json(
      {
        message: "User created",
        user: { id: firebaseUser.uid, email, fullName, profilePicUrl },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
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
