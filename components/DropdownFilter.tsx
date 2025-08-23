import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Filter, X, Check } from "lucide-react";
import { useFilterStore } from "@/lib/store/useFilter";

const DropdownFilter: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, setFilters, resetFilters } = useFilterStore();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = () => {
    return (
      filters.dateRange[0] !== "" ||
      filters.dateRange[1] !== "" ||
      filters.quantityRange[0] > 0 ||
      filters.quantityRange[1] < 10000 ||
      filters.isActive !== true // Changed from !== null to !== true
    );
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const clearAllFilters = () => {
    resetFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange[0] || filters.dateRange[1]) count++;
    if (filters.quantityRange[0] > 0 || filters.quantityRange[1] < 10000)
      count++;
    if (filters.isActive !== true) count++; // Changed from !== null to !== true
    return count;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-all duration-200 ${
          hasActiveFilters()
            ? "bg-transparent border-btn-secondary text-btn-secondary"
            : "bg-transparent border-gray-300 text-title cursor-pointer"
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
        {getActiveFilterCount() > 0 && (
          <span className="bg-btn-secondary text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
            {getActiveFilterCount()}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-84 text-title bg-primary border border-secondary rounded-2xl shadow-lg z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-semibold text-lg">Filter Options</h3>
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-inactive cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2 px-3">
              <label className="block text-sm font-semibold">Status</label>
              <div className="space-y-2">
                {[
                  { value: null, label: "All" },
                  { value: true, label: "Active Only" },
                  { value: false, label: "Inactive Only" },
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={filters.isActive === option.value}
                      onChange={() => updateFilters({ isActive: option.value })}
                      className="w-4 h-4 text-blue-600 accent-btn-secondary"
                    />
                    <span className="text-sm text-title/80">
                      {option.label}
                    </span>
                    {filters.isActive === option.value && (
                      <Check className="w-4 h-4 text-btn-secondary" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2 px-3 py-4">
              <label className="block text-sm font-medium text-title">
                Date Range
              </label>
              <div className="grid grid-cols-2 text-title/80 gap-2">
                <div>
                  <label className="block text-xs mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateRange[0]}
                    onChange={(e) =>
                      updateFilters({
                        dateRange: [e.target.value, filters.dateRange[1]],
                      })
                    }
                    className="w-full p-3 text-title bg-secondary font-semibold rounded-[8px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateRange[1]}
                    onChange={(e) =>
                      updateFilters({
                        dateRange: [filters.dateRange[0], e.target.value],
                      })
                    }
                    className="w-full p-3 text-title bg-secondary font-semibold rounded-[8px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Quantity Range Filter */}
            <div className="space-y-2 px-3">
              <label className="block text-sm font-medium text-title">
                Amount Range (DA)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-title/80 mb-1">
                    Min
                  </label>
                  <input
                    type="number"
                    value={filters.quantityRange[0] || ""}
                    onChange={(e) =>
                      updateFilters({
                        quantityRange: [
                          Number(e.target.value) || 0,
                          filters.quantityRange[1],
                        ],
                      })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-title/80 mb-1">
                    Max
                  </label>
                  <input
                    type="number"
                    value={
                      filters.quantityRange[1] === 10000
                        ? ""
                        : filters.quantityRange[1]
                    }
                    onChange={(e) =>
                      updateFilters({
                        quantityRange: [
                          filters.quantityRange[0],
                          Number(e.target.value) || 10000,
                        ],
                      })
                    }
                    placeholder="10000"
                    min="0"
                    className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="text-xs text-title/80">
                Current range: {filters.quantityRange[0]} -{" "}
                {filters.quantityRange[1]} DA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownFilter;
