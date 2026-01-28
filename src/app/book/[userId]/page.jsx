"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

export default function BookingPage() {
  const router = useRouter();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("User not found");
        router.push("/");
      } finally {
        setIsFetching(false);
      }
    }
    if (userId) fetchUser();
  }, [userId, router]);

  const handleSelectDate = ({ start }) => {
    setSelectedDate(start);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const availableSlots = selectedDate
    ? (() => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const dayOfWeek = format(selectedDate, "EEEE").toLowerCase();

        // console.log("Checking availability for:", {
        //   dateStr,
        //   dayOfWeek,
        //   customAvailability: user?.customAvailability,
        //   regularAvailability: user?.availability,
        // });

        // Check custom availability first
        const customSlots =
          user?.customAvailability
            ?.filter((slot) => slot.date === dateStr)
            ?.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })) || [];

        if (customSlots.length > 0) {
          // console.log("Found custom slots:", customSlots);
          return customSlots;
        }

        // Check regular availability
        const regularSlots =
          user?.availability
            ?.filter((slot) => slot.day.toLowerCase() === dayOfWeek)
            ?.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })) || [];

        // console.log("Found regular slots:", regularSlots);
        return regularSlots;
      })()
    : [];

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleConfirmBooking = async () => {
    if (!clientData.name || !clientData.email) {
      toast.error("Please provide name and email");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/bookings", {
        userId,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientMessage: clientData.message,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      toast.success(response.data.message);
      setIsModalOpen(false);
      setClientData({ name: "", email: "", message: "" });
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Booking error:", error.response?.data, error);
      toast.error(error.response?.data?.error || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <main
        onContextMenu={handleContextMenu}
        className="container mx-auto p-4 md:p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="w-24 h-24 rounded-full mx-auto" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        onContextMenu={handleContextMenu}
        className="container mx-auto p-4 md:p-6 flex items-center justify-center h-[60vh]"
      >
        <Card className="text-center p-6">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-gray-600 mt-2">
            The requested profile could not be loaded.
          </p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            Return Home
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main
      onContextMenu={handleContextMenu}
      className="container mx-auto p-4 md:p-6"
    >
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Book a Session</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {user.fullName}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {user.title || "Professional"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col items-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.profilePicUrl} />
                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="w-full space-y-3">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-gray-700">
                    {user.location || "Not specified"}
                  </span>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-700">{user.email}</span>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-700">
                    ${user.hourlyRate || "0"}/hr
                  </span>
                </div>
              </div>

              {user.about && (
                <div className="w-full mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">About</h3>
                  <p className="text-gray-600">{user.about}</p>
                </div>
              )}

              <Button
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setIsModalOpen(true)}
              >
                Book Selected Time
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Calendar */}
        <Card className="border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">
              Select Availability
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose a date and time that works for you
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <Calendar
                localizer={localizer}
                events={[]}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 400 }}
                onSelectSlot={handleSelectDate}
                selectable
                views={["month"]}
                defaultView="month"
                min={new Date()}
                date={currentDate}
                onNavigate={handleNavigate}
                longPressThreshold={50}
                onSelectEvent={() => {}}
              />
            </div>

            {selectedDate && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Available Times on {format(selectedDate, "MMMM d, yyyy")}
                </h3>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedSlot?.startTime === slot.startTime
                            ? "default"
                            : "outline"
                        }
                        className={`text-sm ${
                          selectedSlot?.startTime === slot.startTime
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "hover:bg-blue-50"
                        }`}
                        onClick={() => handleSelectSlot(slot)}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-600">
                      No available times for this date.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Confirm Booking with {user.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Selected Time</h4>
              <p className="text-blue-600">
                {selectedDate && selectedSlot
                  ? `${format(selectedDate, "MMMM d, yyyy")}, ${
                      selectedSlot.startTime
                    } - ${selectedSlot.endTime}`
                  : "No time selected"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={clientData.name}
                  onChange={(e) =>
                    setClientData({ ...clientData, name: e.target.value })
                  }
                  placeholder="Your Name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clientData.email}
                  onChange={(e) =>
                    setClientData({ ...clientData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-gray-700">
                  Additional Message (Optional)
                </Label>
                <Input
                  id="message"
                  value={clientData.message}
                  onChange={(e) =>
                    setClientData({ ...clientData, message: e.target.value })
                  }
                  placeholder="Any special requests or details"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
