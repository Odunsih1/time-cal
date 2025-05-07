import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // References User._id
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientMessage: { type: String, default: "" },
    date: { type: String, required: true }, // e.g., "2025-05-10"
    startTime: { type: String, required: true }, // e.g., "10:00"
    endTime: { type: String, required: true }, // e.g., "11:00"
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
