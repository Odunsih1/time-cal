"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { auth } from "@/lib/firebaseConfig";
import axios from "axios";
import { Calendar, User, Copy, BellIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import Loader from "@/components/ui/Loader";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState({
    newBooking: true,
    cancelledBooking: true,
    reminder: true,
    browser: false,
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [customTimes, setCustomTimes] = useState({});
  const [bookingLink, setBookingLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async (currentUser) => {
      try {
        setLoading(true);
        const idToken = await currentUser.getIdToken();

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
        window.location.href = "/";
      }
    });

    return () => unsubscribe();
  }, []);

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email resent! Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email: " + error.message);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    try {
      if (!auth.currentUser) {
        toast.error("Please sign in to connect Google Calendar");
        window.location.href = "/auth";
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

  const handleTimeChange = (field, value) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      setCustomTimes((prev) => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [field]: value,
        },
      }));
    }
  };

  const saveCustomTimes = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    if (
      !customTimes[dateKey] ||
      !customTimes[dateKey].start ||
      !customTimes[dateKey].end
    ) {
      toast.error("Please set start and end times");
      return;
    }

    setLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const newCustomAvailability = {
        date: dateKey,
        startTime: customTimes[dateKey].start,
        endTime: customTimes[dateKey].end,
      };
      const customAvailability = [
        ...(user.availability || []).filter((slot) => slot.date !== dateKey),
        newCustomAvailability,
      ];
      await axios.post(
        "/api/profile/update",
        { availability: customAvailability },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setUser((prev) => ({
        ...prev,
        availability: customAvailability,
      }));
      toast.success("Custom availability updated!");
    } catch (error) {
      console.error("Update custom availability error:", error);
      toast.error("Failed to update custom availability");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await axios.post(
        "/api/bookings/update",
        { bookingId, status: newStatus },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );
      toast.success(`Booking marked as ${newStatus}`);
    } catch (error) {
      console.error("Update booking status error:", error);
      toast.error("Failed to update booking status");
    }
  };

  const upcomingCount = bookings.filter(
    (booking) => booking.status === "upcoming"
  ).length;
  const completedCount = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const timeOptions = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, "0")}:00`
  );

  const today = new Date();
  const maxDate = addDays(today, 5);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Header />
      <main className="bg-gray-100 min-h-screen p-2 pt-20">
        <Toaster />
        {user && !user.isEmailVerified && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md mx-auto max-w-7xl mb-6 flex justify-between items-center">
            <p>
              Your email is not verified. Please check your inbox for a
              verification link.
            </p>
            <Button
              onClick={handleResendVerification}
              className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              Resend Verification Email
            </Button>
          </div>
        )}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <Card>
              <CardHeader>
                <CardTitle>Your Calendar</CardTitle>
                <p className="text-gray-600">
                  Set custom availability for the next 5 days
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList>
                    <TabsTrigger className="cursor-pointer" value="calendar">
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="bookings">
                      Bookings
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="calendar">
                    <ShadcnCalendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      fromDate={today}
                      toDate={maxDate}
                      className="rounded-md border"
                    />
                    {selectedDate && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold">
                          Set Custom Availability for{" "}
                          {format(selectedDate, "PPP")}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <select
                            value={
                              customTimes[format(selectedDate, "yyyy-MM-dd")]
                                ?.start || "09:00"
                            }
                            onChange={(e) =>
                              handleTimeChange("start", e.target.value)
                            }
                            className="p-2 border rounded-md"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          <span>to</span>
                          <select
                            value={
                              customTimes[format(selectedDate, "yyyy-MM-dd")]
                                ?.end || "17:00"
                            }
                            onChange={(e) =>
                              handleTimeChange("end", e.target.value)
                            }
                            className="p-2 border rounded-md"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          onClick={saveCustomTimes}
                          className="mt-4 bg-blue-600 hover:bg-blue-500 cursor-pointer"
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Custom Availability"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="bookings">
                    {bookings.length === 0 ? (
                      <p>No bookings found.</p>
                    ) : (
                      <ul className="space-y-4">
                        {bookings.map((booking) => (
                          <li
                            key={booking._id}
                            className="border p-4 rounded-md flex justify-between items-center"
                          >
                            <div>
                              <p>
                                <strong>Client:</strong> {booking.clientName}
                              </p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {format(new Date(booking.date), "PPP")}
                              </p>
                              <p>
                                <strong>Time:</strong> {booking.startTime} to{" "}
                                {booking.endTime}
                              </p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </p>
                            </div>
                            {booking.status === "upcoming" && (
                              <div className="space-x-2">
                                <Button
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      booking._id,
                                      "completed"
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-500 cursor-pointer"
                                >
                                  Mark Completed
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      booking._id,
                                      "cancelled"
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-500 cursor-pointer"
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                  <div className="border p-4 rounded-md text-center">
                    <h4 className="text-lg font-semibold">Upcoming</h4>
                    <p className="text-2xl">{upcomingCount}</p>
                  </div>
                  <div className="border p-4 rounded-md text-center">
                    <h4 className="text-lg font-semibold">Completed</h4>
                    <p className="text-2xl">{completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
