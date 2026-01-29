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

const emailSettingsSchema = new mongoose.Schema({
  dailyDigest: { type: Boolean, default: true },
  upcomingTasks: { type: Boolean, default: true },
  overdueReminders: { type: Boolean, default: true },
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
    timezone: { type: String, default: "UTC" },
    hourlyRate: { type: Number, default: 0 },
    about: { type: String, default: "" },
    availability: [availabilitySchema],
    customAvailability: [customAvailabilitySchema],
    notifications: notificationSchema,
    emailSettings: emailSettingsSchema,
    googleTokens: { type: Object, default: null },
    bookingLink: { type: String, default: "" },
    username: { type: String, unique: true, sparse: true },
    lastGoogleSync: { type: String },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpiry: { type: Number, default: null },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Generate booking link on save if not set
userSchema.pre("save", function (next) {
  const identifier = this.username || this._id;
  this.bookingLink = `https://time-cal.vercel.app/book/${identifier}`;
  next();
});

// Check if model exists and has the username field; if not, delete it to force re-compilation
if (mongoose.models.User && !mongoose.models.User.schema.paths.username) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model("User", userSchema);
