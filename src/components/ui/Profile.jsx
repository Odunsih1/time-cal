"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebaseConfig";
import { CheckCircle2, RefreshCw, Unplug, Calendar } from "lucide-react";

const Profile = () => {
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
  const [syncLoading, setSyncLoading] = useState(false);
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

  const handleGoogleCalendarConnect = async () => {
    try {
      if (!auth.currentUser) {
        toast.error("Please sign in to connect Google Calendar");
        router.push("/auth");
        return;
      }
      const response = await axios.get("/api/auth/google?action=login");
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Google connect error:", error);
      toast.error(
        error.response?.data?.details ||
          "Failed to initiate Google Calendar connection"
      );
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await axios.post(
        "/api/calendar/disconnect",
        {},
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      toast.success(response.data.message);
      setIsGoogleConnected(false);
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error(
        error.response?.data?.details || "Failed to disconnect Google Calendar"
      );
    }
  };

  const handleGoogleCalendarSync = async () => {
    try {
      setSyncLoading(true);
      const idToken = await auth.currentUser.getIdToken();
      await axios.post(
        "/api/calendar/sync",
        {},
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      toast.success("Google Calendar synced successfully!");
      const bookingsResponse = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setBookings(bookingsResponse.data.bookings);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(
        error.response?.data?.details || "Failed to sync Google Calendar"
      );
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="min-h-[400px] border-2 border-slate-100">
        <CardContent className="flex items-center justify-center h-full pt-6">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {/* User Info Section */}
        <div className="flex items-start space-x-6 mb-8">
          <div className="relative">
            <img
              src={user?.profilePicUrl || "/images/user.png"}
              alt="Profile"
              className="w-20 h-20 rounded-2xl ring-4 ring-slate-100 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {user?.fullName}
            </h3>
            <p className="text-slate-600 text-base">
              {user?.title || "No title set"}
            </p>
            {user?.email && (
              <p className="text-slate-500 text-sm mt-1">{user.email}</p>
            )}
          </div>
        </div>

        {/* Calendar Integration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-900">
              Calendar Integration
            </h4>
          </div>

          {/* Connection Status */}
          {isGoogleConnected && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Google Calendar Connected
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1 ml-7">
                Your calendar is synced and ready to use
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isGoogleConnected ? (
              <Button
                onClick={handleGoogleCalendarConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Connect Google Calendar
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleGoogleCalendarSync}
                  disabled={syncLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl cursor-pointer font-semibold transition-all hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncLoading ? "animate-spin" : ""}`}
                  />
                  {syncLoading ? "Syncing..." : "Sync Calendar"}
                </Button>
                <Button
                  onClick={handleDisconnectGoogleCalendar}
                  className="bg-slate-100 hover:bg-red-50 text-slate-700 cursor-pointer hover:text-red-700 border-2 border-slate-200 hover:border-red-200 px-6 py-3 rounded-xl font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Helper Text */}
          {!isGoogleConnected && (
            <p className="text-slate-500 text-sm mt-4 pl-1">
              Connect your Google Calendar to sync your availability and
              automatically manage bookings
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
