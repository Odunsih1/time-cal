import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
});

const customAvailabilitySchema = new mongoose.Schema({
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
});

const notificationSchema = new mongoose.Schema({
  newBooking: { type: Boolean, default: true },
  cancelledBooking: { type: Boolean, default: true },
  reminder: { type: Boolean, default: true },
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
    _id: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false, default: "" },
    profilePicUrl: { type: String, default: "" },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    about: { type: String, default: "" },
    availability: [availabilitySchema],
    customAvailability: [customAvailabilitySchema],
    notifications: notificationSchema,
    googleTokens: { type: Object, default: null },
    bookingLink: { type: String, default: "" },
    lastGoogleSync: { type: String },
  },

  { timestamps: true }
);

// Generate booking link on save if not set
userSchema.pre("save", function (next) {
  if (!this.bookingLink) {
    this.bookingLink = `https://time-cal.vercel.app/book/${this._id}`;
  }
  next();
});

// console.log("User schema loaded with password: required=false");
export default mongoose.models.User || mongoose.model("User", userSchema);
