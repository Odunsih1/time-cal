import { NextResponse } from "next/server";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  console.log("Received request to /api/auth/signup");
  try {
    const { fullName, email, password, profilePicUrl } = await request.json();
    console.log("Request payload:", { fullName, email, profilePicUrl });

    // Validate required fields for email signup
    if (!fullName || !email || !password) {
      console.error("Missing required fields:", { fullName, email, password });
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

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
    try {
      const existingFirebaseUser = await adminAuth.getUserByEmail(email);
      console.error("Firebase user found:", existingFirebaseUser.uid);
      return NextResponse.json(
        { error: "Email already in use in Firebase" },
        { status: 400 }
      );
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.error("Firebase check error:", error.message);
        throw error;
      }
      console.log("No Firebase user found for email:", email);
    }

    // Create Firebase user
    let firebaseUser;
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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Save user to MongoDB
    try {
      console.log(`Saving user to MongoDB: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        _id: firebaseUser.uid, // Firebase UID
        fullName,
        email,
        password: hashedPassword, // Store hashed password
        profilePicUrl: profilePicUrl || "",
      });
      await user.save();
      console.log("MongoDB user saved:", { _id: firebaseUser.uid, email });
    } catch (error) {
      console.error(
        "MongoDB save error, rolling back Firebase user:",
        error.message
      );
      await adminAuth.deleteUser(firebaseUser.uid);
      console.log("Rolled back Firebase user:", firebaseUser.uid);
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
    console.error("Signup error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
