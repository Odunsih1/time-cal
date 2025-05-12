"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { auth } from "@/lib/firebaseConfig";

const UserCalendar = () => {
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
          userData.customAvailability?.reduce((acc, slot) => {
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
        ...(user.customAvailability || []).filter(
          (slot) => slot.date !== dateKey
        ), // Use user.customAvailability
        newCustomAvailability,
      ];
      console.log("Sending customAvailability:", customAvailability);
      await axios.post(
        "/api/profile/update",
        { customAvailability },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setUser((prev) => ({
        ...prev,
        customAvailability,
      }));
      toast.success("Custom availability updated!");
    } catch (error) {
      console.error("Update custom availability error:", error);
      toast.error(
        error.response?.data?.error || "Failed to update custom availability"
      );
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

  const timeOptions = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, "0")}:00`
  );

  const today = new Date();
  const maxDate = addDays(today, 5);
  return (
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
                  Set Custom Availability for {format(selectedDate, "PPP")}
                </h4>
                <div className="flex items-center space-x-4 mt-2">
                  <select
                    value={
                      customTimes[format(selectedDate, "yyyy-MM-dd")]?.start ||
                      "00:00"
                    }
                    onChange={(e) => handleTimeChange("start", e.target.value)}
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
                      customTimes[format(selectedDate, "yyyy-MM-dd")]?.end ||
                      "00:00"
                    }
                    onChange={(e) => handleTimeChange("end", e.target.value)}
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
                            handleUpdateBookingStatus(booking._id, "completed")
                          }
                          className="bg-green-600 hover:bg-green-500 cursor-pointer"
                        >
                          Mark Completed
                        </Button>
                        <Button
                          onClick={() =>
                            handleUpdateBookingStatus(booking._id, "cancelled")
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
  );
};

export default UserCalendar;
