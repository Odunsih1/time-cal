"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Copy, BellIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addDays } from "date-fns";
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
    try {
      await navigator.clipboard.writeText(bookingLink);
      toast.success("Booking link copied!");
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

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Email Notifications</span>
              <Toggle
                pressed={notifications.newBooking}
                onPressedChange={(value) =>
                  handleNotificationToggle("newBooking", value)
                }
                className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground cursor-pointer"
              >
                <BellIcon className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Toggle>
            </div>
            <div className="flex items-center justify-between">
              <span>Browser Notifications</span>
              <Toggle
                pressed={notifications.browser}
                onPressedChange={(value) =>
                  handleNotificationToggle("browser", value)
                }
                className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground cursor-pointer"
              >
                <BellIcon className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Toggle>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Booking Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input value={bookingLink} readOnly />
            <Button className="cursor-pointer" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copy
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border md:p-1 md:pt-4 p-4 rounded-md text-center">
              <h4 className="text-lg md:text-sm  font-semibold">Upcoming</h4>
              <p className="text-2xl">{upcomingCount}</p>
            </div>
            <div className="border md:p-1 md:pt-4 p-4 rounded-md text-center">
              <h4 className="text-lg md:text-sm font-semibold">Completed</h4>
              <p className="text-2xl">{completedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Notification;
