import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  console.log("Received request to /api/auth/signup");
  try {
    const { fullName, email, password, profilePicUrl } = await request.json();
    console.log("Request payload:", { fullName, email, profilePicUrl });

    if (!fullName || !email || !password) {
      console.error("Missing required fields:", { fullName, email, password });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    console.log(`Checking MongoDB for email: ${email}`);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(
        `Email already registered in MongoDB: ${email}`,
        existingUser
      );
      return NextResponse.json(
        { error: "Email already registered in database" },
        { status: 400 }
      );
    }

    console.log(`Checking Firebase for email: ${email}`);
    let firebaseUserExists = false;
    let retries = 3;
    while (retries > 0) {
      try {
        const user = await adminAuth.getUserByEmail(email);
        console.error(`Firebase user found: ${user.email} (${user.uid})`);
        firebaseUserExists = true;
        break;
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          console.log(`No Firebase user found for email: ${email}`);
          break;
        }
        console.error(`Firebase check error (retry ${4 - retries}/3):`, error);
        retries--;
        if (retries === 0) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (firebaseUserExists) {
      console.error(`Email already in use in Firebase: ${email}`);
      return NextResponse.json(
        { error: "Email already in use in Firebase" },
        { status: 400 }
      );
    }

    let firebaseUser;
    try {
      console.log(`Creating Firebase user for email: ${email}`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      firebaseUser = userCredential.user;
      console.log(`Firebase user created: ${firebaseUser.uid}`);
    } catch (error) {
      console.error("Firebase signup error:", error.code, error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
      console.log(`Saving user to MongoDB: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        fullName,
        email,
        password: hashedPassword,
        profilePicUrl: profilePicUrl || "",
      });
      await user.save();
      console.log(`MongoDB user saved: ${email}`);
    } catch (error) {
      console.error("MongoDB save error, rolling back Firebase user:", error);
      await adminAuth.deleteUser(firebaseUser.uid);
      return NextResponse.json(
        { error: "Failed to save user in database" },
        { status: 500 }
      );
    }

    console.log(`User created successfully: ${email}`);
    return NextResponse.json(
      {
        message: "User created",
        user: { id: firebaseUser.uid, email, fullName, profilePicUrl },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error.message, error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
