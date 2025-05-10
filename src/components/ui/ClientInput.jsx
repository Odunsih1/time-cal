"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
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
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Loader from "./Loader";

const ClientInput = () => {
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
        toast.error("User not found");
        router.push("/");
      } finally {
        setLoading(false); // Set loading to false when done
      }
    }
    if (userId) fetchUser();
  }, [userId, router]);

  // Show loading state while user data is being fetched
  if (loading) {
    return;
  }

  // If there's no user (after loading is complete), show an error message
  if (!user) return <Loader />;

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
      // console.log("Booking payload:", {
      //   userId,
      //   clientName: clientData.name,
      //   clientEmail: clientData.email,
      //   clientMessage: clientData.message,
      //   date: format(selectedDate, "yyyy-MM-dd"),
      //   startTime: selectedSlot.startTime,
      //   endTime: selectedSlot.endTime,
      // });
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
  return (
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
  );
};

export default ClientInput;
