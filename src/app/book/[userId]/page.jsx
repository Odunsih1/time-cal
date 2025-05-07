"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast
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

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("User not found"); // Use react-hot-toast
        router.push("/");
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

  // Get available slots for selected date
  const availableSlots = selectedDate
    ? (() => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const dayOfWeek = format(selectedDate, "EEEE");

        const customSlots = user?.customAvailability
          ?.filter((slot) => slot.date === dateStr)
          .map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          }));

        if (customSlots?.length > 0) {
          return customSlots;
        }

        return (
          user?.availability
            ?.filter((slot) => slot.day === dayOfWeek)
            .map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })) || []
        );
      })()
    : [];

  const handleConfirmBooking = async () => {
    if (!clientData.name || !clientData.email) {
      toast.error("Please provide name and email"); // Use react-hot-toast
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot"); // Use react-hot-toast
      return;
    }

    setLoading(true);
    try {
      console.log("Booking payload:", {
        userId,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientMessage: clientData.message,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      const response = await axios.post("/api/bookings", {
        userId,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientMessage: clientData.message,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      toast.success(response.data.message); // Use react-hot-toast
      setIsModalOpen(false);
      setClientData({ name: "", email: "", message: "" });
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Booking error:", error.response?.data, error);
      toast.error(error.response?.data?.error || "Failed to create booking"); // Use react-hot-toast
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <Toaster /> {/* react-hot-toast Toaster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{user.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={user.profilePicUrl || "/default-avatar.png"}
              alt={user.fullName}
              className="w-24 h-24 rounded-full mx-auto"
            />
            <p>
              <strong>Title:</strong> {user.title || "N/A"}
            </p>
            <p>
              <strong>Location:</strong> {user.location || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Hourly Rate:</strong> ${user.hourlyRate || 0}/hr
            </p>
            <p>
              <strong>About:</strong> {user.about || "No description provided."}
            </p>
            <Button
              disabled={!selectedDate || !selectedSlot}
              onClick={() => setIsModalOpen(true)}
            >
              Book Selected Time
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book a Session</CardTitle>
            <p className="text-sm text-gray-600">
              Select a date and time that works for you, and I'll get back to
              you to confirm the booking.
            </p>
          </CardHeader>
          <CardContent>
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
            />
            {selectedDate && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">
                  Available Times on {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedSlot?.startTime === slot.startTime
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleSelectSlot(slot)}
                        className="text-sm"
                      >
                        {slot.startTime} - {slot.endTime}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">
                    No available times for this date.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Session with {user.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              <strong>Selected Time:</strong>{" "}
              {selectedDate && selectedSlot
                ? `${format(selectedDate, "MMMM d, yyyy")} from ${
                    selectedSlot.startTime
                  } to ${selectedSlot.endTime}`
                : "N/A"}
            </p>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={clientData.name}
                onChange={(e) =>
                  setClientData({ ...clientData, name: e.target.value })
                }
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={clientData.email}
                onChange={(e) =>
                  setClientData({ ...clientData, email: e.target.value })
                }
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={clientData.message}
                onChange={(e) =>
                  setClientData({ ...clientData, message: e.target.value })
                }
                placeholder="Optional message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={loading}>
              {loading ? "Submitting..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
