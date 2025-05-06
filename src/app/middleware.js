import { NextResponse } from "next/server";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function middleware(request) {
  console.log(`Middleware: ${request.method} ${request.nextUrl.pathname}`);
  if (request.nextUrl.pathname.startsWith("/profile")) {
    const user = await new Promise((resolve) => {
      auth.onAuthStateChanged(
        (user) => resolve(user),
        () => resolve(null)
      );
    });
    if (!user) {
      console.log("Unauthorized access to /profile, redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};
