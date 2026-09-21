import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  /**
   * Render an "All" row at the top of the dropdown that clears the
   * selection (i.e. no filter applied). Defaults to true so list-page
   * filters get the affordance for free; pass false in form contexts
   * where "no selection" isn't meaningful.
   */
  showAllOption?: boolean;
  /** Label for the "All" row. Defaults to "All". */
  allLabel?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
  showAllOption = true,
  allLabel = "All",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // "All" = no filter applied. Clicking it clears the selection so the
  // list shows everything; the row gets a check when nothing is selected.
  const allActive = selected.length === 0;
  const handleAll = () => {
    if (!allActive) onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="max-h-64 overflow-auto">
          {showAllOption && (
            <div
              className={cn(
                "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100",
                allActive && "bg-blue-50",
              )}
              onClick={handleAll}
            >
              <div
                className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300",
                  allActive
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "opacity-50",
                )}
              >
                {allActive && <Check className="h-3 w-3" />}
              </div>
              <span className="text-sm font-medium">{allLabel}</span>
            </div>
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100",
                  isSelected && "bg-blue-50"
                )}
                onClick={() => handleToggle(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "opacity-50"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <span className="text-sm">{option.label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}