"use client";

import { Suspense } from "react";
import VerifyEmailHandler from "@/components/VerifyEmailHandler";
import { Toaster } from "react-hot-toast";
import Loader from "@/components/ui/Loader";

export default function VerifyEmail() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toaster />
      <Suspense fallback={<Loader />}>
        <VerifyEmailHandler />
      </Suspense>
      <Loader />
    </div>
  );
}
