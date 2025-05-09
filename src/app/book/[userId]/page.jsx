"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Loader from "@/components/ui/Loader";
import BookingCard from "@/components/ui/BookingCard";
import ClientInput from "@/components/ui/ClientInput";

export default function BookingPage() {
  const router = useRouter();
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("User not found");
        router.push("/");
      }
    }
    if (userId) fetchUser();
  }, [userId, router]);

  if (!user) return <Loader />;

  return (
    <main className="container mx-auto p-4">
      <Toaster />
      <BookingCard />
      <ClientInput />
    </main>
  );
}
