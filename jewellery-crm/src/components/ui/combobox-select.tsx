"use client";

import * as React from "react";
import { Input } from "./input";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  commitOnSelect?: boolean; // when true, do not propagate changes while typing; only on pick/enter
  showAddHint?: boolean; // show the "Add \"value\"" helper row; defaults to false to avoid confusion
  hideDropdownWhenEmpty?: boolean; // when true, hide the dropdown if there are no matches/add-row
}

export function ComboboxSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  allowCustom = true,
  customPlaceholder = "Enter custom value",
  commitOnSelect = false,
  showAddHint = false,
  hideDropdownWhenEmpty = false,
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState<string>(value || "");
  const [highlighted, setHighlighted] = React.useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Keep internal query in sync with outer value
  React.useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const normalized = (s: string) => (s || "").toLowerCase().trim();
  const filterOptions = React.useCallback((q: string) => {
    const nq = normalized(q);
    if (!nq) return options;
    return options.filter(o => normalized(o).includes(nq));
  }, [options]);
  const filtered = React.useMemo(() => {
    return filterOptions(query);
  }, [filterOptions, query]);

  const isExactMatch = options.some(o => normalized(o) === normalized(query));
  const showAddRow = showAddHint && allowCustom && !!query && !isExactMatch;
  const shouldRenderDropdown = isOpen && (!hideDropdownWhenEmpty || filtered.length > 0 || showAddRow);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setHighlighted(0);
  };

  const handlePick = (val: string) => {
    onValueChange(val);
    setQuery(val);
    closeDropdown();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && ["ArrowDown", "ArrowUp"].includes(e.key)) {
      openDropdown();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const extra = showAddHint && allowCustom && !isExactMatch && query ? 1 : 0;
      setHighlighted((i) => Math.min(i + 1, (filtered.length - 1 >= 0 ? filtered.length - 1 : 0) + extra));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const showAdd = allowCustom && query && !isExactMatch;
      // If highlight points to custom row
      if (highlighted === filtered.length && showAdd && showAddHint) {
        handlePick(query.trim());
        return;
      }
      if (filtered[highlighted]) {
        handlePick(filtered[highlighted]);
      } else if (showAdd) {
        handlePick(query.trim());
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  // Close on outside click
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);


  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={query}
        disabled={disabled}
        onChange={(e) => {
          const nextQuery = e.target.value;
          setQuery(nextQuery);
          if (!commitOnSelect) {
            onValueChange(nextQuery); // live-update when not committing on select
          }
          const nextFiltered = filterOptions(nextQuery);
          const nextIsExactMatch = options.some(o => normalized(o) === normalized(nextQuery));
          const nextShowAddRow = showAddHint && allowCustom && !!nextQuery && !nextIsExactMatch;
          if (hideDropdownWhenEmpty && nextFiltered.length === 0 && !nextShowAddRow) {
            closeDropdown();
          } else {
            openDropdown();
          }
          setHighlighted(0);
        }}
        onFocus={openDropdown}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setTimeout(() => {
            if (commitOnSelect && allowCustom) {
              const trimmed = query.trim();
              if (trimmed) {
                onValueChange(trimmed);
              }
            }
            closeDropdown();
          }, 0);
        }}
        placeholder={placeholder}
        className="w-full"
      />

      {shouldRenderDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
          {filtered.map((opt, idx) => (
            <button
              type="button"
              key={opt}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100",
                idx === highlighted && "bg-gray-100"
              )}
              onMouseEnter={() => setHighlighted(idx)}
              onClick={() => handlePick(opt)}
            >
              <span>{opt}</span>
              {normalized(opt) === normalized(value) && <Check className="h-4 w-4 text-gray-500" />}
            </button>
          ))}

          {showAddRow && (
            <>
              {filtered.length > 0 && <div className="h-px bg-gray-200" />}
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50",
                  highlighted === filtered.length && "bg-blue-50"
                )}
                onMouseEnter={() => setHighlighted(filtered.length)}
                onClick={() => handlePick(query.trim())}
              >
                <Plus className="h-4 w-4" /> Add "{query.trim()}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

