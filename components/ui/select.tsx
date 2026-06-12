"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/components/ui/cn";
import { ChevronDown, Search } from "lucide-react";

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
  searchable?: boolean;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      placeholder,
      id,
      value: controlledValue,
      onChange,
      onBlur,
      name,
      disabled,
      searchable,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(controlledValue ?? "");
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const selectedValue = controlledValue !== undefined ? String(controlledValue) : internalValue;
    const selectedOption = options.find((o) => o.value === selectedValue);
    const displayText = selectedOption?.label ?? placeholder ?? "Seleccionar...";

    const filteredOptions = searchable && searchQuery.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

    const selectOption = useCallback(
      (value: string) => {
        setInternalValue(value);
        setSearchQuery("");
        setOpen(false);
        onChange?.({ target: { value, name: name ?? selectId } });
      },
      [onChange, name, selectId],
    );

    function handleOpen() {
      if (disabled) return;
      setOpen((prev) => !prev);
    }

    // Auto-focus search input when dropdown opens
    useEffect(() => {
      if (open && searchable) {
        setTimeout(() => searchRef.current?.focus(), 30);
      }
      if (!open) setSearchQuery("");
    }, [open, searchable]);

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
            onClick={handleOpen}
            onBlur={onBlur}
            className={cn(
              "flex h-11 min-h-11 w-full min-w-0 items-center rounded-lg border border-white/[0.08] bg-muted/50 px-3 py-2 pr-10 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              !selectedOption && "text-muted-foreground",
              error && "border-danger focus-visible:ring-danger",
              open && "border-primary/50 ring-2 ring-primary/20",
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
            <div
              id={`${selectId}-listbox`}
              role="listbox"
              className="absolute left-0 right-0 top-full z-[60] mt-1.5 w-full min-w-0 rounded-xl border border-white/[0.08] bg-card shadow-2xl shadow-black/50 backdrop-blur-md overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-white/[0.06]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-full rounded-lg bg-background/60 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 border border-white/[0.06]"
                    />
                  </div>
                </div>
              )}
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Sin resultados
                  </li>
                ) : (
                  filteredOptions.map((opt) => {
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
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-white/[0.05]",
                        )}
                      >
                        {opt.label}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
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
