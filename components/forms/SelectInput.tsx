"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  options?: number[] | string[];
  placeholder?: string;
  onSelect?: (value: any) => void;
  error?: string;
  defaultValue?: null | string;
  className?: string;
};

export default function Selector({
  options = ["user", "admin"],
  placeholder = "Role",
  onSelect,
  defaultValue = null,
  error,
}: Props) {
  const [selectedValue, setSelectedValue] = useState(
    defaultValue || placeholder
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-secondary text-title px-8 py-4 text-center rounded-2xl flex items-center justify-center hover:bg-secondary/40 transition-colors"
        >
          <span>{selectedValue}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform absolute right-2 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-background border border-secondary rounded-2xl mt-1 shadow-lg z-10 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSelectedValue(option);
                  setIsOpen(false);
                  onSelect?.(option);
                }}
                className="w-full text-center px-4 py-3 hover:bg-primary first:rounded-t-2xl last:rounded-b-2xl transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
