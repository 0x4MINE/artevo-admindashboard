"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Filter, X, Check } from "lucide-react";
import { useFilterStore } from "@/lib/store/useFilter";
import { FilterType } from "@/types/FilterState";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownFilterProps {
  className?: string;
  filters: FilterType[];
  title?: string;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({
  className = "",
  filters: enabledFilters,
  title = "Filter Options",
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
      (enabledFilters.includes("spentAmount") &&
        filters.spentAmountRange &&
        (filters.spentAmountRange[0] > 0 ||
          filters.spentAmountRange[1] < 100000)) ||
      (enabledFilters.includes("debtAmount") &&
        filters.debtRange &&
        (filters.debtRange[0] > 0 || filters.debtRange[1] < 100000)) ||
      (enabledFilters.includes("date") &&
        (filters.dateRange[0] !== "" || filters.dateRange[1] !== "")) ||
      (enabledFilters.includes("quantity") &&
        (filters.quantityRange[0] > 0 || filters.quantityRange[1] < 10000)) ||
      (enabledFilters.includes("active") && filters.isActive !== true) ||
      (enabledFilters.includes("buyAmount") &&
        filters.buyAmountRange &&
        (filters.buyAmountRange[0] > 0 ||
          filters.buyAmountRange[1] < 100000)) ||
      (enabledFilters.includes("sellAmount") &&
        filters.sellAmountRange &&
        (filters.sellAmountRange[0] > 0 || filters.sellAmountRange[1] < 100000))
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (
      enabledFilters.includes("date") &&
      (filters.dateRange[0] || filters.dateRange[1])
    )
      count++;
    if (
      enabledFilters.includes("quantity") &&
      (filters.quantityRange[0] > 0 || filters.quantityRange[1] < 10000)
    )
      count++;
    if (enabledFilters.includes("active") && filters.isActive !== true) count++;
    if (
      enabledFilters.includes("buyAmount") &&
      filters.buyAmountRange &&
      (filters.buyAmountRange[0] > 0 || filters.buyAmountRange[1] < 100000)
    )
      count++;
    if (
      enabledFilters.includes("sellAmount") &&
      filters.sellAmountRange &&
      (filters.sellAmountRange[0] > 0 || filters.sellAmountRange[1] < 100000)
    )
      count++;
    return count;
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const clearAllFilters = () => {
    resetFilters();
    setIsOpen(false);
  };

  // === Filter Renderers (unchanged) ===
  const renderDateFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">Date Range</label>
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
  );

  const renderQuantityFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Quantity Range
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
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
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.quantityRange[1] === 10000 ? "" : filters.quantityRange[1]
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
        Current range: {filters.quantityRange[0]} - {filters.quantityRange[1]}
      </div>
    </div>
  );

  const renderActiveFilter = () => (
    <div className="space-y-2 p-3">
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
            <span className="text-sm text-title/80">{option.label}</span>
            {filters.isActive === option.value && (
              <Check className="w-4 h-4 text-btn-secondary" />
            )}
          </label>
        ))}
      </div>
    </div>
  );

  const renderBuyAmountFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Buy Amount Range (DA)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
          <input
            type="number"
            value={filters.buyAmountRange?.[0] || ""}
            onChange={(e) =>
              updateFilters({
                buyAmountRange: [
                  Number(e.target.value) || 0,
                  filters.buyAmountRange?.[1] ?? 100000,
                ],
              })
            }
            placeholder="0"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.buyAmountRange?.[1] === 100000
                ? ""
                : filters.buyAmountRange?.[1] || ""
            }
            onChange={(e) =>
              updateFilters({
                buyAmountRange: [
                  filters.buyAmountRange?.[0] ?? 0,
                  Number(e.target.value) || 100000,
                ],
              })
            }
            placeholder="100000"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderSellAmountFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Sell Amount Range (DA)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
          <input
            type="number"
            value={filters.sellAmountRange?.[0] || ""}
            onChange={(e) =>
              updateFilters({
                sellAmountRange: [
                  Number(e.target.value) || 0,
                  filters.sellAmountRange?.[1] ?? 100000,
                ],
              })
            }
            placeholder="0"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.sellAmountRange?.[1] === 100000
                ? ""
                : filters.sellAmountRange?.[1] || ""
            }
            onChange={(e) =>
              updateFilters({
                sellAmountRange: [
                  filters.sellAmountRange?.[0] ?? 0,
                  Number(e.target.value) || 100000,
                ],
              })
            }
            placeholder="100000"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
  const renderSpentAmountFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Spent Amount Range (DA)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
          <input
            type="number"
            value={filters.spentAmountRange?.[0] || ""}
            onChange={(e) =>
              updateFilters({
                spentAmountRange: [
                  Number(e.target.value) || 0,
                  filters.spentAmountRange?.[1] ?? 100000,
                ],
              })
            }
            placeholder="0"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.spentAmountRange?.[1] === 100000
                ? ""
                : filters.spentAmountRange?.[1] || ""
            }
            onChange={(e) =>
              updateFilters({
                spentAmountRange: [
                  filters.spentAmountRange?.[0] ?? 0,
                  Number(e.target.value) || 100000,
                ],
              })
            }
            placeholder="100000"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
  const renderAmountFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Amount Range (DA)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
          <input
            type="number"
            value={filters.amountRange?.[0] || ""}
            onChange={(e) =>
              updateFilters({
                amountRange: [
                  Number(e.target.value) || 0,
                  filters.amountRange?.[1] ?? 100000,
                ],
              })
            }
            placeholder="0"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.amountRange?.[1] === 100000
                ? ""
                : filters.amountRange?.[1] || ""
            }
            onChange={(e) =>
              updateFilters({
                amountRange: [
                  filters.amountRange?.[0] ?? 0,
                  Number(e.target.value) || 100000,
                ],
              })
            }
            placeholder="100000"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderDebtAmountFilter = () => (
    <div className="space-y-2 p-3">
      <label className="block text-sm font-medium text-title">
        Debt Amount Range (DA)
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-title/80 mb-1">Min</label>
          <input
            type="number"
            value={filters.debtRange?.[0] || ""}
            onChange={(e) =>
              updateFilters({
                debtRange: [
                  Number(e.target.value) || 0,
                  filters.debtRange?.[1] ?? 100000,
                ],
              })
            }
            placeholder="0"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-title/80 mb-1">Max</label>
          <input
            type="number"
            value={
              filters.debtRange?.[1] === 100000
                ? ""
                : filters.debtRange?.[1] || ""
            }
            onChange={(e) =>
              updateFilters({
                debtRange: [
                  filters.debtRange?.[0] ?? 0,
                  Number(e.target.value) || 100000,
                ],
              })
            }
            placeholder="100000"
            min="0"
            className="w-full p-3 bg-secondary text-center rounded-[8px] font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

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

        {/* Badge with animation */}
        <AnimatePresence>
          {getActiveFilterCount() > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-btn-secondary text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center"
            >
              {getActiveFilterCount()}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute custom-scrollbar max-h-[450px] overflow-auto top-full right-0 mt-2 w-84 text-title bg-primary border border-secondary rounded-2xl shadow-lg z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between ">
                <h3 className="font-semibold text-lg">{title}</h3>
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

              {/* Conditional Filter Rendering */}
              {enabledFilters.includes("active") && renderActiveFilter()}
              {enabledFilters.includes("date") && renderDateFilter()}
              {enabledFilters.includes("quantity") && renderQuantityFilter()}
              {enabledFilters.includes("buyAmount") && renderBuyAmountFilter()}
              {enabledFilters.includes("sellAmount") &&
                renderSellAmountFilter()}
              {enabledFilters.includes("spentAmount") &&
                renderSpentAmountFilter()}
              {enabledFilters.includes("debtAmount") &&
                renderDebtAmountFilter()}
              {enabledFilters.includes("amount") && renderAmountFilter()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropdownFilter;
