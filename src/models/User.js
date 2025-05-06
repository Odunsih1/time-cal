import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const notificationSchema = new mongoose.Schema({
  newBooking: { type: Boolean, default: true },
  cancelledBooking: { type: Boolean, default: true },
  reminder: { type: Boolean, default: true },
  browser: { type: Boolean, default: false },
  bookingConfirmationMessage: {
    type: String,
    default: "Thank you for your booking!",
  },
  reminderMessage: {
    type: String,
    default: "Reminder: Your booking is tomorrow!",
  },
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicUrl: { type: String, default: "" },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    about: { type: String, default: "" },
    availability: [availabilitySchema],
    notifications: notificationSchema,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
