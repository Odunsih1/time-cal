"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { auth } from "@/lib/firebaseConfig";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Calendar, User, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("No user logged in");

        // Fetch user profile
        const profileResponse = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = profileResponse.data.user;
        setUser(userData);
        setNotifications(userData.notifications || notifications);
        setBookingLink(`time-cal.com/book/${userData._id}`);
        // Initialize custom times from user availability
        setCustomTimes(
          userData.availability?.reduce((acc, slot) => {
            acc[slot.date] = { start: slot.startTime, end: slot.endTime };
            return acc;
          }, {}) || {}
        );

        // Fetch bookings
        const bookingsResponse = await axios.get("/api/bookings", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        setBookings(bookingsResponse.data.bookings);
      } catch (error) {
        console.error("Fetch data error:", error);
        toast.error("Failed to load dashboard data");
      }
    };

    if (auth.currentUser) {
      fetchData();
    } else {
      auth.onAuthStateChanged((user) => {
        if (user) fetchData();
      });
    }
  }, []);

  const handleGoogleCalendarConnect = () => {
    toast.success("Google Calendar connection placeholder");
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

  const handleCopyLink = () => {
    navigator.clipboard.write(bookingLink);
    toast.success("Booking link copied!");
  };

  const handleTimeChange = (field, value) => {
    if (selectedDate) {
      setCustomTimes((prev) => ({
        ...prev,
        [format(selectedDate, "yyyy-MM-dd")]: {
          ...prev[format(selectedDate, "yyyy-MM-dd")],
          [field]: value,
        },
      }));
    }
  };

  const saveCustomTimes = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const availability = Object.entries(customTimes).map(([date, times]) => ({
        date,
        startTime: times.start || "09:00",
        endTime: times.end || "17:00",
      }));
      console.log("Saving availability:", availability);
      await axios.post(
        "/api/profile/update",
        { availability },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      toast.success("Availability updated!");
    } catch (error) {
      console.error("Update availability error:", error);
      toast.error("Failed to update availability");
    } finally {
      setLoading(false);
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

  // Calendar date range: today to 5 days ahead
  const today = new Date();
  const maxDate = addDays(today, 5);

  return (
    <>
      <Header />
      <main className="bg-gray-100 min-h-screen pt-20">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* First Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img
                    src={user?.profilePicUrl || "/images/agb.jpeg"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{user?.fullName}</h3>
                    <p className="text-gray-600">{user?.title || "No title"}</p>
                  </div>
                </div>
                <Button
                  onClick={handleGoogleCalendarConnect}
                  className="mt-4 bg-blue-600 hover:bg-blue-500"
                >
                  Connect Google Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Your Calendar</CardTitle>
                <p className="text-gray-600">
                  Manage your availability and view upcoming bookings
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="bookings">
                      Upcoming Bookings
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
                          Set Availability for {format(selectedDate, "PPP")}
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
                          className="mt-4 bg-blue-600 hover:bg-blue-500"
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Availability"}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="bookings">
                    {bookings.length === 0 ? (
                      <p>No upcoming bookings.</p>
                    ) : (
                      <ul className="space-y-2">
                        {bookings
                          .filter((b) => b.status === "upcoming")
                          .map((booking) => (
                            <li
                              key={booking._id}
                              className="border p-2 rounded-md"
                            >
                              {format(new Date(booking.startTime), "PPPp")} -{" "}
                              {format(new Date(booking.endTime), "p")}
                            </li>
                          ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Notifications */}
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
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Browser Notifications</span>
                    <Toggle
                      pressed={notifications.browser}
                      onPressedChange={(value) =>
                        handleNotificationToggle("browser", value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Link */}
            <Card>
              <CardHeader>
                <CardTitle>Your Booking Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input value={bookingLink} readOnly />
                  <Button onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
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
