"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { applyActionCode } from "firebase/auth";
import toast from "react-hot-toast";

export default function VerifyEmailHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get("oobCode");

      if (!oobCode) {
        toast.error("Invalid or missing verification code");
        router.push("/dashboard?error=Invalid verification code");
        return;
      }

      try {
        await applyActionCode(auth, oobCode);

        if (!auth.currentUser) {
          toast.error("Please sign in to verify your email");
          router.push("/auth?error=Please sign in");
          return;
        }

        const idToken = await auth.currentUser.getIdToken(true);
        const response = await fetch("/api/auth/verify-email-complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: auth.currentUser.uid }),
        });

        if (!response.ok) {
          throw new Error("Failed to update verification status");
        }

        toast.success("Email verified successfully!");
        router.push("/dashboard?verified=true");
      } catch (error) {
        console.error("Email verification error:", error);
        toast.error(`Failed to verify email: ${error.message}`);
        router.push(`/dashboard?error=${encodeURIComponent(error.message)}`);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return null;
}
