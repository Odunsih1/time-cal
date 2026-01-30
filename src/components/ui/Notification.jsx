"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import {
  Copy,
  Bell,
  Mail,
  Monitor,
  Link as LinkIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebaseConfig";

const Notification = () => {
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
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchData = async (currentUser) => {
      try {
        setLoading(true);
        const idToken = await currentUser.getIdToken(true);
        const profileResponse = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = profileResponse.data.user;
        setUser(userData);
        setNotifications(userData.notifications || notifications);
        setBookingLink(
          userData.bookingLink || `${BASE_URL}/book/${userData._id}`
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

  const handleNotificationToggle = async (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    try {
      const idToken = await auth.currentUser.getIdToken();
      await axios.post(
        "/api/profile/update",
        { notifications: { ...notifications, [key]: value } },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("Notification settings updated!");
    } catch (error) {
      console.error("Update notification error:", error);
      toast.error("Failed to update notifications");
    }
  };

  const handleCopyLink = async () => {
    if (!user?.isEmailVerified) {
      toast.error("Please verify your email to copy the booking link");
      return;
    }
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopied(true);
      toast.success("Booking link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy link");
    }
  };

  const upcomingCount = bookings.filter(
    (booking) => booking.status === "upcoming"
  ).length;
  const completedCount = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const today = new Date();

  if (loading) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 border-slate-200 animate-pulse">
            <CardHeader className="bg-slate-50">
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Notifications Card */}
      <Card className="border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b p-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Notifications
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Get notified via email
                    </p>
                  </div>
                </div>
                <Toggle
                  pressed={notifications.newBooking}
                  onPressedChange={(value) =>
                    handleNotificationToggle("newBooking", value)
                  }
                  className={`cursor-pointer transition-all ${
                    notifications.newBooking
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Toggle email notifications</span>
                </Toggle>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Browser Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Get push notifications
                    </p>
                  </div>
                </div>
                <Toggle
                  pressed={notifications.browser}
                  onPressedChange={(value) =>
                    handleNotificationToggle("browser", value)
                  }
                  className={`cursor-pointer transition-all ${
                    notifications.browser
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="sr-only">Toggle browser notifications</span>
                </Toggle>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Link Card */}
      <Card className="border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b p-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Your Booking Link
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Share this link with clients
              </p>
              <p className="text-sm text-slate-900 font-mono break-all">
                {bookingLink}
              </p>
            </div>

            <Button
              onClick={handleCopyLink}
              className={`w-full px-4 py-3 rounded-xl cursor-pointer font-semibold transition-all flex items-center justify-center gap-2 ${
                copied
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-sm hover:shadow-emerald-600/20 active:translate-y-0"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Tip:</span> Share this link on
                your website, email signature, or social media
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b p-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Quick Stats
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">
                Upcoming
              </h4>
              <p className="text-3xl font-bold text-blue-600">
                {upcomingCount}
              </p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">
                Completed
              </h4>
              <p className="text-3xl font-bold text-green-600">
                {completedCount}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Total Bookings</span>
              <span className="text-slate-900 font-bold text-lg">
                {upcomingCount + completedCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Notification;
