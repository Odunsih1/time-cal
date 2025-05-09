"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function VerificationHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");

    if (verified === "true") {
      toast.success("Email verified successfully!");
    } else if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  return null;
}
