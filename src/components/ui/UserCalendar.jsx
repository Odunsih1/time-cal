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
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  User,
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TimeSelector from "@/components/ui/TimeSelector";

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
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;
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
        ),
        newCustomAvailability,
      ];
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

  const today = new Date();
  const maxDate = addDays(today, 5);

  // Pagination calculations
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-slate-50 border-b p-4 border-slate-100">
        <div className="flex  items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Your Calendar
            </CardTitle>
            <p className="text-slate-600 text-sm mt-1">
              Set custom availability for the next 5 days
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid sticky top-20 w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger
              className="cursor-pointer rounded-lg  data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              value="calendar"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              className="cursor-pointer rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              value="bookings"
            >
              <Clock className="w-4 h-4 mr-2" />
              Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Customize Your Availability
                  </p>
                  <p className="text-blue-700">
                    Select a date below and set specific time slots when you're
                    available for bookings.
                    {user?.timezone && (
                      <span className="block mt-1 font-semibold">
                        Current Timezone: {user.timezone}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <ShadcnCalendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                fromDate={today}
                toDate={maxDate}
                className="rounded-xl border-2 border-slate-200 w-full shadow-sm mx-auto"
              />

              {selectedDate && (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <h4 className="text-lg font-semibold text-slate-900">
                      Set Availability for {format(selectedDate, "PPP")}
                    </h4>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 w-full">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Start Time
                      </label>
                      <TimeSelector
                        value={
                          customTimes[format(selectedDate, "yyyy-MM-dd")]
                            ?.start || "00:00"
                        }
                        onChange={(value) => handleTimeChange("start", value)}
                      />
                    </div>

                    <div className="hidden sm:flex items-center pt-6">
                      <span className="text-slate-400 font-medium">to</span>
                    </div>

                    <div className="flex-1 w-full">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        End Time
                      </label>
                      <TimeSelector
                        value={
                          customTimes[format(selectedDate, "yyyy-MM-dd")]
                            ?.end || "00:00"
                        }
                        onChange={(value) => handleTimeChange("end", value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveCustomTimes}
                    className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-sm hover:shadow-blue-600/20  active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Custom Availability"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-lg font-medium">
                  No bookings yet
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Your upcoming bookings will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">
                                  Client
                                </p>
                                <p className="text-slate-900 font-semibold">
                                  {booking.clientName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">
                                  Date
                                </p>
                                <p className="text-slate-900 font-semibold">
                                  {format(new Date(booking.date), "PPP")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">
                                  Time
                                </p>
                                <p className="text-slate-900 font-semibold">
                                  {booking.startTime} - {booking.endTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {booking.status === "upcoming" && (
                          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                            <Button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking._id,
                                  "completed"
                                )
                              }
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-sm hover:shadow-emerald-600/20 cursor-pointer active:translate-y-0 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </Button>
                            <Button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking._id,
                                  "cancelled"
                                )
                              }
                              className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-2 border-slate-200 hover:border-red-200 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer active:translate-y-0 flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col gap-3 items-center justify-between border-t-2 border-slate-200 pt-6">
                    <div className="text-sm text-slate-600">
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
                        {indexOfFirstBooking + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.min(indexOfLastBooking, bookings.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900">
                        {bookings.length}
                      </span>{" "}
                      bookings
                    </div>

                    <div className="flex items-center flex-col gap-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all flex items-center gap-1 text-slate-700 font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 &&
                              pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                  currentPage === pageNumber
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return (
                              <span
                                key={pageNumber}
                                className="px-2 text-slate-400"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all flex items-center gap-1 text-slate-700 font-medium"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserCalendar;
