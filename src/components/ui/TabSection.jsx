"use client";
import Buttons from "@/components/ui/Buttons";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const TabSection = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    title: "",
    location: "",
    hourlyRate: 0,
    about: "",
    profilePicUrl: "",
    availability: [],
    notifications: {
      newBooking: true,
      cancelledBooking: true,
      reminder: true,
      bookingConfirmationMessage: "Thank you for your booking!",
      reminderMessage: "Reminder: Your booking is tomorrow!",
    },
  });
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("No user logged in");
        console.log(
          "Fetching profile with token:",
          idToken.slice(0, 10) + "..."
        );
        const response = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = response.data.user;
        console.log("Fetched user data:", userData);
        setUser(userData);
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          title: userData.title || "",
          location: userData.location || "",
          hourlyRate: userData.hourlyRate || 0,
          about: userData.about || "",
          profilePicUrl: userData.profilePicUrl || "",
          availability: userData.availability || [],
          notifications: userData.notifications || {
            newBooking: true,
            cancelledBooking: true,
            reminder: true,
            bookingConfirmationMessage: "Thank you for your booking!",
            reminderMessage: "Reminder: Your booking is tomorrow!",
          },
        });
      } catch (error) {
        console.error("Fetch profile error:", error);
        toast.error("Failed to load profile");
      }
    };

    if (auth.currentUser) {
      fetchUserProfile();
    } else {
      auth.onAuthStateChanged((user) => {
        if (user) fetchUserProfile();
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [name]: checked },
    }));
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [name]: value },
    }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePic(file);
  };

  const uploadProfilePic = async () => {
    if (!profilePic) return formData.profilePicUrl;
    const uploadData = new FormData();
    uploadData.append("file", profilePic);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await axios.post("/api/upload", uploadData, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      console.log("Profile picture uploaded:", response.data.url);
      return response.data.url;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw new Error("Failed to upload profile picture");
    }
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const profilePicUrl = await uploadProfilePic();
      const idToken = await auth.currentUser.getIdToken();
      const payload = {
        fullName: formData.fullName,
        title: formData.title,
        location: formData.location,
        hourlyRate: parseFloat(formData.hourlyRate),
        about: formData.about,
        profilePicUrl,
      };
      console.log("Sending general update:", payload);
      const response = await axios.post("/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      console.log("General update response:", response.data);
      setUser(response.data.user);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // Validate availability
      for (const slot of formData.availability) {
        if (!slot.day || !slot.startTime || !slot.endTime) {
          throw new Error(
            "Each availability slot must have day, startTime, and endTime"
          );
        }
      }
      const idToken = await auth.currentUser.getIdToken();
      const payload = { availability: formData.availability };
      console.log("Sending availability update:", payload);
      const response = await axios.post("/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      console.log("Availability update response:", response.data);
      setUser((prev) => ({
        ...prev,
        availability: response.data.user?.availability || prev.availability,
      }));
      toast.success("Availability updated successfully!");
    } catch (error) {
      console.error("Update availability error:", error.message, error.stack);
      toast.error(error.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const payload = { notifications: formData.notifications };
      console.log("Sending notification update:", payload);
      const response = await axios.post("/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      console.log("Notification update response:", response.data);
      setUser(response.data.user);
      toast.success("Notification settings updated successfully!");
    } catch (error) {
      console.error(
        "Update notifications error:",
        error.response?.data || error
      );
      toast.error(
        error.response?.data?.error || "Failed to update notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = () => {
    setFormData((prev) => ({
      ...prev,
      availability: [
        ...prev.availability,
        { day: "Monday", startTime: "09:00", endTime: "17:00" },
      ],
    }));
  };

  const updateAvailability = (index, field, value) => {
    setFormData((prev) => {
      const newAvailability = [...prev.availability];
      newAvailability[index] = { ...newAvailability[index], [field]: value };
      return { ...prev, availability: newAvailability };
    });
  };

  const removeAvailability = (index) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };
  return (
    <section>
      <div className="mt-5">
        <div className="bg-gray-100 rounded-md p-1 w-full overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {["General", "Availability", "Notification"].map((tab) => (
              <div
                key={tab}
                className={`p-1 pr-2 pl-2 rounded-md cursor-pointer ${
                  activeTab === tab ? "bg-white text-black" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                <h3>{tab}</h3>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="p-7"
          >
            {activeTab === "General" && (
              <div className="flex justify-between flex-col lg:flex-row">
                <div>
                  <img
                    src={formData.profilePicUrl || "/images/user.png"}
                    width={100}
                    height={100}
                    alt="Profile picture"
                    className="rounded-full mt-6"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="mt-3"
                  />
                </div>
                <form onSubmit={handleGeneralSubmit}>
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="w-full">
                      <label
                        className="block text-sm sm:text-base font-medium text-gray-700"
                        htmlFor="fullName"
                      >
                        Full Name
                      </label>
                      <input
                        className="p-2 text-base sm:text-lg pr-3 py-2 w-full  border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Henry Odunsi"
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="w-full">
                      <label
                        className="block text-sm sm:text-base font-medium text-gray-700"
                        htmlFor="title"
                      >
                        Title
                      </label>
                      <input
                        className="p-2 text-base sm:text-lg pr-3 py-2 w-full border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Web Developer"
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-5 mt-4">
                    <div className="w-full">
                      <label
                        className="block text-sm sm:text-base font-medium text-gray-700"
                        htmlFor="email"
                      >
                        Email
                      </label>
                      <input
                        className="p-2 text-base sm:text-lg pr-3 py-2 w-full border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        readOnly
                      />
                    </div>
                    <div className="w-full">
                      <label
                        className="block text-sm sm:text-base font-medium text-gray-700"
                        htmlFor="location"
                      >
                        Location
                      </label>
                      <input
                        className="p-2 text-base sm:text-lg pr-3 py-2 w-full border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label
                      className="block text-sm sm:text-base font-medium text-gray-700"
                      htmlFor="hourlyRate"
                    >
                      Hourly Rate ($)
                    </label>
                    <input
                      className="p-2 text-base sm:text-lg w-full pr-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mt-4">
                    <label
                      className="block text-sm sm:text-base font-medium text-gray-700"
                      htmlFor="about"
                    >
                      About
                    </label>
                    <textarea
                      className="p-2 text-base sm:text-lg w-full pr-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      id="about"
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Buttons
                    name={loading ? "Saving..." : "Save Changes"}
                    className="bg-blue-600 text-white p-2 rounded-md cursor-pointer transition hover:bg-blue-500 mt-4"
                    disabled={loading}
                  />
                </form>
              </div>
            )}
            {activeTab === "Availability" && (
              <form onSubmit={handleAvailabilitySubmit}>
                <div>
                  <h3 className="text-lg font-medium">Set Your Availability</h3>
                  {formData.availability.map((slot, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-4 mt-4 items-center border rounded-md p-1 md:border-0 border-gray-300"
                    >
                      <select
                        value={slot.day}
                        onChange={(e) =>
                          updateAvailability(index, "day", e.target.value)
                        }
                        className="p-2 border-2 border-gray-300 rounded-md"
                      >
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1.5  items-center">
                        <select
                          value={slot.startTime}
                          onChange={(e) =>
                            updateAvailability(
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="p-2 border-2 border-gray-300 rounded-md"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span>to</span>
                        <select
                          value={slot.endTime}
                          onChange={(e) =>
                            updateAvailability(index, "endTime", e.target.value)
                          }
                          className="p-2 border-2 border-gray-300 rounded-md"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAvailability(index)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAvailability}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    + Add Availability
                  </button>
                </div>
                <Buttons
                  name={loading ? "Saving..." : "Save Availability"}
                  className="bg-blue-600 text-white p-2 rounded-md cursor-pointer transition hover:bg-blue-500 mt-4"
                  disabled={loading}
                />
              </form>
            )}
            {activeTab === "Notification" && (
              <form onSubmit={handleNotificationSubmit}>
                <div className="mb-6">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="newBooking"
                        checked={formData.notifications.newBooking}
                        onChange={handleNotificationChange}
                        className="mr-2"
                      />
                      New booking notifications
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="cancelledBooking"
                        checked={formData.notifications.cancelledBooking}
                        onChange={handleNotificationChange}
                        className="mr-2"
                      />
                      Cancelled booking notifications
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="reminder"
                        checked={formData.notifications.reminder}
                        onChange={handleNotificationChange}
                        className="mr-2"
                      />
                      Reminder emails (24 hours before booking)
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Client Communication</h3>
                  <div className="mt-4">
                    <label
                      className="block text-sm sm:text-base font-medium text-gray-700"
                      htmlFor="bookingConfirmationMessage"
                    >
                      Booking Confirmation Message
                    </label>
                    <textarea
                      className="p-2 text-base sm:text-lg w-full pr-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      id="bookingConfirmationMessage"
                      name="bookingConfirmationMessage"
                      value={formData.notifications.bookingConfirmationMessage}
                      onChange={handleMessageChange}
                    />
                  </div>
                  <div className="mt-4">
                    <label
                      className="block text-sm sm:text-base font-medium text-gray-700"
                      htmlFor="reminderMessage"
                    >
                      Reminder Message
                    </label>
                    <textarea
                      className="p-2 text-base sm:text-lg w-full pr-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      id="reminderMessage"
                      name="reminderMessage"
                      value={formData.notifications.reminderMessage}
                      onChange={handleMessageChange}
                    />
                  </div>
                </div>
                <Buttons
                  name={loading ? "Saving..." : "Save Notification Settings"}
                  className="bg-blue-600 text-white p-2 rounded-md cursor-pointer transition hover:bg-blue-500 mt-4"
                  disabled={loading}
                />
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TabSection;
