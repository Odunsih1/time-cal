import * as React from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TimezoneSelector = ({ value, onChange, className }) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const timezones = React.useMemo(() => {
    return Intl.supportedValuesOf("timeZone");
  }, []);

  const filteredTimezones = React.useMemo(() => {
    if (!searchQuery) return timezones;
    return timezones.filter((tz) =>
      tz.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [timezones, searchQuery]);

  // Scroll to selected item when opening
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

  // Reset search when closing
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

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
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{value || "Select timezone"}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] bg-white p-0" align="start">
        <div className="p-2 border-b border-slate-100">
          <input
            className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-400"
            placeholder="Search timezone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div ref={scrollRef} className="h-[300px] overflow-y-auto p-1">
          {filteredTimezones.length === 0 ? (
            <div className="p-2 text-sm text-slate-500 text-center">
              No timezone found.
            </div>
          ) : (
            filteredTimezones.map((tz) => (
              <div
                key={tz}
                data-value={tz}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                  value === tz
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-slate-100 text-slate-700"
                )}
                onClick={() => {
                  onChange(tz);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    value === tz ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{tz}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimezoneSelector;
