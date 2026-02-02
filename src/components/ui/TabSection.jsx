"use client";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useFormik } from "formik";
import { z } from "zod";
import {
  User,
  Clock,
  Bell,
  Upload,
  MapPin,
  DollarSign,
  AlertTriangle,
  Mail,
  Briefcase,
  Plus,
  Trash2,
  Save,
  Check,
  Link,
} from "lucide-react";
import TimeSelector from "@/components/ui/TimeSelector";
import TimezoneSelector from "@/components/ui/TimezoneSelector";

const generalSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  title: z.string().optional(),
  location: z.string().optional(),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative"),
  about: z.string().optional(),
  timezone: z.string().optional(),
});

const availabilitySchema = z.array(
  z.object({
    day: z.string().refine((val) => val !== "Not set", {
      message: "Please select a day for all slots",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
);

const notificationSchema = z.object({
  bookingConfirmationMessage: z.string().optional(),
  reminderMessage: z.string().optional(),
});

const TabSection = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);

  // Formik for General Tab
  const generalFormik = useFormik({
    initialValues: {
      fullName: "",
      username: "",
      title: "",
      location: "",
      timezone: "UTC",
      hourlyRate: 0,
      about: "",
      profilePicUrl: "",
    },
    validate: (values) => {
      try {
        generalSchema.parse(values);
        return {};
      } catch (error) {
        return error instanceof z.ZodError ? error.flatten().fieldErrors : {};
      }
    },
    onSubmit: async (values) => {
      if (loading) return;
      setLoading(true);
      try {
        const profilePicUrl = await uploadProfilePic();
        const idToken = await auth.currentUser.getIdToken();
        const payload = {
          ...values,
          profilePicUrl: profilePicUrl || values.profilePicUrl,
        };
        const response = await axios.post("/api/profile/update", payload, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        setUser(response.data.user);
        toast.success("Profile updated successfully!");
      } catch (error) {
        console.error("Update profile error:", error.response?.data || error);
        toast.error(error.response?.data?.error || "Failed to update profile");
      } finally {
        setLoading(false);
      }
    },
  });

  // State for Availability and Notifications (simpler management without full Formik for now or separate formiks)
  const [availabilityData, setAvailabilityData] = useState([]);
  const [notificationsData, setNotificationsData] = useState({
    newBooking: true,
    cancelledBooking: true,
    reminder: true,
    bookingConfirmationMessage: "Thank you for your booking!",
    reminderMessage: "Reminder: Your booking is tomorrow!",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("No user logged in");
        const response = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = response.data.user;
        setUser(userData);

        // Update General Formik
        generalFormik.setValues({
          fullName: userData.fullName || "",
          username: userData.username || "",
          title: userData.title || "",
          location: userData.location || "",
          timezone: userData.timezone || "UTC",
          hourlyRate: userData.hourlyRate || 0,
          about: userData.about || "",
          profilePicUrl: userData.profilePicUrl || "",
        });

        // Update other states
        setAvailabilityData(userData.availability || []);
        setNotificationsData(
          userData.notifications || {
            newBooking: true,
            cancelledBooking: true,
            reminder: true,
            bookingConfirmationMessage: "Thank you for your booking!",
            reminderMessage: "Reminder: Your booking is tomorrow!",
          }
        );
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

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePic(file);
  };

  const uploadProfilePic = async () => {
    if (!profilePic) return generalFormik.values.profilePicUrl;
    const uploadData = new FormData();
    uploadData.append("file", profilePic);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await axios.post("/api/upload", uploadData, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data.url;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw new Error("Failed to upload profile picture");
    }
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // Validate with Zod
      availabilitySchema.parse(availabilityData);

      const idToken = await auth.currentUser.getIdToken();
      const payload = {
        availability: availabilityData,
        timezone: generalFormik.values.timezone,
      };
      const response = await axios.post("/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setUser((prev) => ({
        ...prev,
        availability: response.data.user?.availability || prev.availability,
        timezone: response.data.user?.timezone || prev.timezone,
      }));
      toast.success("Availability updated successfully!");
    } catch (error) {
      console.error("Update availability error:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Invalid availability data");
      } else {
        toast.error(
          error.response?.data?.error ||
            error.message ||
            "Failed to update availability"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationsData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setNotificationsData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    if (!user?.isEmailVerified) {
      toast.error("Please verify your email to update notifications");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      // Validate with Zod
      notificationSchema.parse(notificationsData);

      const idToken = await auth.currentUser.getIdToken();
      const payload = { notifications: notificationsData };
      const response = await axios.post("/api/profile/update", payload, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setUser(response.data.user);
      toast.success("Notification settings updated successfully!");
    } catch (error) {
      console.error(
        "Update notifications error:",
        error.response?.data || error
      );
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message || "Invalid notification data");
      } else {
        toast.error(
          error.response?.data?.error || "Failed to update notifications"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = () => {
    setAvailabilityData((prev) => [
      ...prev,
      { day: "Not set", startTime: "00:00", endTime: "00:00" },
    ]);
  };

  const updateAvailability = (index, field, value) => {
    setAvailabilityData((prev) => {
      const newAvailability = [...prev];
      newAvailability[index] = { ...newAvailability[index], [field]: value };
      return newAvailability;
    });
  };

  const removeAvailability = (index) => {
    setAvailabilityData((prev) => prev.filter((_, i) => i !== index));
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const tabs = [
    { name: "General", icon: User },
    { name: "Availability", icon: Clock },
    { name: "Notification", icon: Bell },
  ];

  return (
    <section className="py-8">
      <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b-2 border-slate-200 p-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.name}
                  className={`flex items-center gap-2 px-6 cursor-pointer py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.name
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200"
                  }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {user && !user.isEmailVerified && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  Please{" "}
                  <span className="font-semibold">
                    verify your email address
                  </span>{" "}
                  to edit your profile.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* General Tab */}
              {activeTab === "General" && (
                <div className="space-y-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Profile Picture Section */}
                    <div className="lg:w-1/3">
                      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-center">
                        <div className="relative inline-block">
                          <img
                            src={
                              profilePic
                                ? URL.createObjectURL(profilePic)
                                : generalFormik.values.profilePicUrl ||
                                  "/images/user.png"
                            }
                            width={120}
                            height={120}
                            alt="Profile picture"
                            className="rounded-2xl ring-4 ring-slate-100 mx-auto object-cover h-[120px] w-[120px]"
                          />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <label className="mt-6 inline-flex items-center gap-2 bg-white border-2 border-slate-200 px-4 py-2 rounded-xl font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-all">
                          <Upload className="w-4 h-4" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicChange}
                            className="hidden"
                          />
                        </label>
                        {profilePic && (
                          <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />
                            New photo selected
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Form Section */}
                    <div className="lg:w-2/3">
                      <form
                        onSubmit={generalFormik.handleSubmit}
                        className="space-y-6"
                      >
                        <fieldset
                          disabled={!user?.isEmailVerified}
                          className="contents"
                        >
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <User className="w-4 h-4" />
                                Full Name
                              </label>
                              <input
                                className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                                  generalFormik.touched.fullName &&
                                  generalFormik.errors.fullName
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                                }`}
                                placeholder="Henry Odunsi"
                                type="text"
                                name="fullName"
                                value={generalFormik.values.fullName}
                                onChange={generalFormik.handleChange}
                                onBlur={generalFormik.handleBlur}
                              />
                              {generalFormik.touched.fullName &&
                                generalFormik.errors.fullName && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {generalFormik.errors.fullName}
                                  </p>
                                )}
                            </div>

                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Briefcase className="w-4 h-4" />
                                Title
                              </label>
                              <input
                                className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                                  generalFormik.touched.title &&
                                  generalFormik.errors.title
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                                }`}
                                placeholder="Web Developer"
                                type="text"
                                name="title"
                                value={generalFormik.values.title}
                                onChange={generalFormik.handleChange}
                                onBlur={generalFormik.handleBlur}
                              />
                              {generalFormik.touched.title &&
                                generalFormik.errors.title && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {generalFormik.errors.title}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Mail className="w-4 h-4" />
                                Email
                              </label>
                              <input
                                className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                                type="email"
                                name="email"
                                value={user?.email || ""}
                                readOnly
                              />
                            </div>

                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                Location
                              </label>
                              <input
                                className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                                  generalFormik.touched.location &&
                                  generalFormik.errors.location
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                                }`}
                                placeholder="Lagos, Nigeria"
                                type="text"
                                name="location"
                                value={generalFormik.values.location}
                                onChange={generalFormik.handleChange}
                                onBlur={generalFormik.handleBlur}
                              />
                              {generalFormik.touched.location &&
                                generalFormik.errors.location && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {generalFormik.errors.location}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Link className="w-4 h-4" />
                                Booking Link ID
                              </label>
                              <input
                                className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                                  generalFormik.touched.username &&
                                  generalFormik.errors.username
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                                }`}
                                placeholder="username"
                                type="text"
                                name="username"
                                value={generalFormik.values.username.toLowerCase()}
                                onChange={generalFormik.handleChange}
                                onBlur={generalFormik.handleBlur}
                              />
                              {generalFormik.touched.username &&
                                generalFormik.errors.username && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {generalFormik.errors.username}
                                  </p>
                                )}
                              <p className="text-xs text-slate-500 mt-2 ml-1">
                                time-cal.vercel.app/book/
                                <span className="font-medium text-slate-700">
                                  {generalFormik.values.username || user?._id}
                                </span>
                              </p>
                            </div>

                            <div>
                              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Hourly Rate ($)
                              </label>
                              <input
                                className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                                  generalFormik.touched.hourlyRate &&
                                  generalFormik.errors.hourlyRate
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                                }`}
                                placeholder="50"
                                type="number"
                                name="hourlyRate"
                                value={generalFormik.values.hourlyRate}
                                onChange={generalFormik.handleChange}
                                onBlur={generalFormik.handleBlur}
                              />
                              {generalFormik.touched.hourlyRate &&
                                generalFormik.errors.hourlyRate && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {generalFormik.errors.hourlyRate}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                              <User className="w-4 h-4" />
                              About
                            </label>
                            <textarea
                              className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors min-h-[120px] ${
                                generalFormik.touched.about &&
                                generalFormik.errors.about
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              placeholder="Tell us about yourself..."
                              name="about"
                              value={generalFormik.values.about}
                              onChange={generalFormik.handleChange}
                              onBlur={generalFormik.handleBlur}
                            />
                            {generalFormik.touched.about &&
                              generalFormik.errors.about && (
                                <p className="text-red-500 text-xs mt-1">
                                  {generalFormik.errors.about}
                                </p>
                              )}
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:shadow-sm hover:shadow-blue-600/20  active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          >
                            <Save className="w-5 h-5" />
                            {loading ? "Saving..." : "Save Changes"}
                          </button>
                        </fieldset>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Tab */}
              {activeTab === "Availability" && (
                <form onSubmit={handleAvailabilitySubmit} className="space-y-6">
                  <fieldset
                    disabled={!user?.isEmailVerified}
                    className="contents"
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          Set Your Weekly Schedule
                        </p>
                        <p className="text-blue-700">
                          Define your regular availability for each day of the
                          week
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Timezone
                      </label>
                      <TimezoneSelector
                        value={generalFormik.values.timezone}
                        onChange={(value) =>
                          generalFormik.setFieldValue("timezone", value)
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      {availabilityData.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <div className="flex-1 grid md:grid-cols-3 gap-4 w-full">
                              <select
                                value={slot.day}
                                onChange={(e) =>
                                  updateAvailability(
                                    index,
                                    "day",
                                    e.target.value
                                  )
                                }
                                className="p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                              >
                                <option value="Not set" disabled>
                                  Select a day
                                </option>
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

                              <TimeSelector
                                value={slot.startTime}
                                onChange={(value) =>
                                  updateAvailability(index, "startTime", value)
                                }
                              />

                              <TimeSelector
                                value={slot.endTime}
                                onChange={(value) =>
                                  updateAvailability(index, "endTime", value)
                                }
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeAvailability(index)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border-2 cursor-pointer border-red-200 px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addAvailability}
                      className="w-full border-2 border-dashed cursor-pointer border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Availability Slot
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl cursor-pointer font-semibold transition-all hover:shadow-sm hover:shadow-blue-600/20  active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? "Saving..." : "Save Availability"}
                    </button>
                  </fieldset>
                </form>
              )}

              {/* Notification Tab */}
              {activeTab === "Notification" && (
                <form onSubmit={handleNotificationSubmit} className="space-y-8">
                  <fieldset
                    disabled={!user?.isEmailVerified}
                    className="contents"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Email Notifications
                      </h3>
                      <div className="space-y-4">
                        {[
                          {
                            name: "newBooking",
                            label: "New booking notifications",
                            description:
                              "Get notified when someone books a meeting",
                          },
                          {
                            name: "cancelledBooking",
                            label: "Cancelled booking notifications",
                            description:
                              "Get notified when a booking is cancelled",
                          },
                          {
                            name: "reminder",
                            label: "Reminder emails",
                            description:
                              "Receive reminders 24 hours before bookings",
                          },
                        ].map((notification) => (
                          <label
                            key={notification.name}
                            className="flex items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {notification.label}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.description}
                              </p>
                            </div>
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                name={notification.name}
                                checked={notificationsData[notification.name]}
                                onChange={handleNotificationChange}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-200 pt-8">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Client Communication
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Booking Confirmation Message
                          </label>
                          <textarea
                            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors min-h-[100px]"
                            placeholder="Thank you for your booking!"
                            name="bookingConfirmationMessage"
                            value={notificationsData.bookingConfirmationMessage}
                            onChange={handleMessageChange}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Reminder Message
                          </label>
                          <textarea
                            className="w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors min-h-[100px]"
                            placeholder="Reminder: Your booking is tomorrow!"
                            name="reminderMessage"
                            value={notificationsData.reminderMessage}
                            onChange={handleMessageChange}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl cursor-pointer font-semibold transition-all hover:shadow-sm hover:shadow-blue-600/20  active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? "Saving..." : "Save Notification Settings"}
                    </button>
                  </fieldset>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TabSection;
