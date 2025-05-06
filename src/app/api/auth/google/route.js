import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectMongoDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { idToken, fullName } = await request.json();
    await connectMongoDB();

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        fullName: fullName || decodedToken.name || "Unknown",
        email,
        profilePicUrl: decodedToken.picture || "",
      });
      await user.save();
    }

    return NextResponse.json(
      {
        user: {
          id: uid,
          email,
          fullName: user.fullName,
          profilePicUrl: user.profilePicUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
