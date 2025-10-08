"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, sendEmailVerification } from "firebase/auth";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import { auth } from "@/lib/firebaseConfig";
import { Suspense } from "react";
import VerificationHandler from "@/components/VerificationHandler";
import Notification from "@/components/ui/Notification";
import UserCalendar from "@/components/ui/UserCalendar";
import Profile from "@/components/ui/Profile";
import ResendEmailLink from "@/components/ui/ResendEmailLink";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState({
    newBooking: true,
    cancelledBooking: true,
    reminder: true,
    browser: false,
  });
  const [customTimes, setCustomTimes] = useState({});
  const [bookingLink, setBookingLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async (currentUser) => {
      try {
        setLoading(true);
        const idToken = await currentUser.getIdToken(true);
        const profileResponse = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = profileResponse.data.user;
        // console.log("Profile data:", userData);
        setUser(userData);
        setNotifications(userData.notifications || notifications);
        setBookingLink(
          userData.bookingLink ||
            `https://time-cal.vercel.app/book/${userData._id}`
        );
        setCustomTimes(
          userData.availability?.reduce((acc, slot) => {
            acc[slot.date] = { start: slot.startTime, end: slot.endTime };
            return acc;
          }, {}) || {}
        );
        setIsGoogleConnected(!!userData.googleTokens);
        const bookingsResponse = await axios.get("/api/bookings", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        setBookings(bookingsResponse.data.bookings);
      } catch (error) {
        console.error("Fetch data error:", error);
        toast.error(error.response?.data?.details || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchData(currentUser);
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email resent! Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error(`Failed to resend verification email: ${error.message}`);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Toaster />
      <Suspense fallback={<div>Loading verification status...</div>}>
        <VerificationHandler />
      </Suspense>
      <Header />
      <main className="bg-gray-100 min-h-screen p-2 pt-20">
        {user && !user.isEmailVerified && (
          <ResendEmailLink onClick={handleResendVerification} />
        )}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Profile />
            <UserCalendar />
          </div>
          <Notification />
        </div>
      </main>
    </>
  );
};

export default Dashboard;
