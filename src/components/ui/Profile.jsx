"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebaseConfig";

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
        console.log("Profile data:", userData);
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
    }
  };
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <img
            src={user?.profilePicUrl || "/images/user.png"}
            alt="Profile"
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="text-lg font-semibold">{user?.fullName}</h3>
            <p className="text-gray-600">{user?.title || "No title"}</p>
          </div>
        </div>
        <div className="mt-4 space-x-2">
          <Button
            onClick={handleGoogleCalendarConnect}
            className="bg-blue-600 hover:bg-blue-500 mt-1.5 cursor-pointer"
            disabled={isGoogleConnected}
          >
            {isGoogleConnected
              ? "Google Calendar Connected"
              : "Connect Google Calendar"}
          </Button>
          {isGoogleConnected && (
            <>
              <Button
                onClick={handleGoogleCalendarSync}
                className="bg-green-600 hover:bg-green-500 mt-1.5 cursor-pointer"
              >
                Sync Google Calendar
              </Button>
              <Button
                onClick={handleDisconnectGoogleCalendar}
                className="bg-red-600 hover:bg-red-500 mt-1.5 cursor-pointer"
              >
                Disconnect Google Calendar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
