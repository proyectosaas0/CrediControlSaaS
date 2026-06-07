"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/components/ui/cn";
import { ChevronDown } from "lucide-react";

type SelectProps = {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  value?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, value: controlledValue, onChange, onBlur, name, disabled }, ref) => {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(controlledValue ?? "");
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const selectedValue = controlledValue !== undefined ? String(controlledValue) : internalValue;
    const selectedOption = options.find((o) => o.value === selectedValue);
    const displayText = selectedOption?.label ?? placeholder ?? "Seleccionar...";

    const selectOption = useCallback(
      (value: string) => {
        setInternalValue(value);
        setOpen(false);
        onChange?.({ target: { value, name: name ?? selectId } });
      },
      [onChange, name, selectId],
    );

    // Close on Escape
    useEffect(() => {
      if (!open) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          containerRef.current?.querySelector("button")?.focus();
        }
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    // Close on click outside
    useEffect(() => {
      if (!open) return;
      const handleClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    return (
      <div ref={containerRef} className="w-full min-w-0 space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative w-full min-w-0">
          <button
            ref={ref}
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-listbox`}
            disabled={disabled}
            onClick={() => setOpen(!open)}
            onBlur={onBlur}
            className={cn(
              "flex h-11 min-h-11 w-full min-w-0 items-center rounded-lg border border-white/[0.08] bg-muted/50 px-3 py-2 pr-10 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
              !selectedOption && "text-muted-foreground",
              error && "border-danger focus-visible:ring-danger",
              className,
            )}
          >
            <span className="truncate">{displayText}</span>
          </button>
          <ChevronDown
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />

          {open && (
            <ul
              ref={listRef}
              id={`${selectId}-listbox`}
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 w-full min-w-0 overflow-y-auto rounded-xl border border-white/[0.08] bg-card shadow-xl shadow-black/40 backdrop-blur-md py-1"
            >
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(opt.value)}
                    className={cn(
                      "cursor-pointer truncate px-3 py-2 text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-white/[0.04]",
                    )}
                  >
                    {opt.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
