// src/components/ui/DatePicker.jsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DatePicker = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-64 justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "MMM d, yyyy") : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <ShadcnCalendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect(date);
            setOpen(false); // Close after selection
          }}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
