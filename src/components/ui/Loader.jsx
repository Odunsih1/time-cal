import { Calendar } from "lucide-react";

export default function Loader() {
  return (
    <div className="loader-container">
      <Calendar
        className="calendar-loader text-blue-600"
        size={48}
        aria-label="Loading"
      />
    </div>
  );
}
