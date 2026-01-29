import * as React from "react";
import { Check, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TimeSelector = ({ value, onChange, className }) => {
  const [open, setOpen] = React.useState(false);

  // Generate time options (every 15 minutes)
  const timeOptions = React.useMemo(() => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      times.push(`${hour}:00`);
      times.push(`${hour}:15`);
      times.push(`${hour}:30`);
      times.push(`${hour}:45`);
    }
    return times;
  }, []);

  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (open && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(
        `[data-value="${value}"]`
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center" });
      }
    }
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between px-3 font-normal bg-white hover:bg-slate-50 border-slate-200",
            !value && "text-slate-500",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{value || "Select time"}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-white p-0" align="start">
        <div ref={scrollRef} className="h-[300px] overflow-y-auto p-1">
          {timeOptions.map((time) => (
            <div
              key={time}
              data-value={time}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                value === time
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:bg-slate-100 text-slate-700"
              )}
              onClick={() => {
                onChange(time);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === time ? "opacity-100" : "opacity-0"
                )}
              />
              {time}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimeSelector;
