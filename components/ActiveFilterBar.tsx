"use client";

import { useFilterStore } from "@/lib/store/useFilter";
import React from "react";

function FilterTag({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span
      onClick={onRemove}
      className="px-2 py-1 border border-btn-secondary text-btn-secondary rounded cursor-pointer hover:bg-btn-secondary hover:text-primary transition"
    >
      {children} ✕
    </span>
  );
}

function ActiveFilterBar({ filteredData }: { filteredData: any[] }) {
  const { filters, setFilters } = useFilterStore();

  const hasActiveFilters = [
    filters.isActive !== true,
    filters.dateRange[0],
    filters.dateRange[1],
    filters.quantityRange[0] > 0,
    filters.quantityRange[1] < 10000,
    filters.amountRange[0] > 0,
    filters.amountRange[1] < 100000,
    filters.buyAmountRange?.some((v, i) => (i === 0 ? v > 0 : v < 100000)),
    filters.sellAmountRange?.some((v, i) => (i === 0 ? v > 0 : v < 100000)),
    filters.spentAmountRange?.some((v, i) => (i === 0 ? v > 0 : v < 100000)),
    filters.debtRange?.some((v, i) => (i === 0 ? v > 0 : v < 100000)),
  ].some(Boolean);

  if (!hasActiveFilters) return null;

  return (
    <div className="active-filter mb-4 p-3 bg-primary border border-secondary rounded-lg">
      <div className="text-sm text-title text-center flex items-center flex-wrap gap-2">
        <span className="font-medium">Active Filters:</span>

        {/* Active status */}
        {filters.isActive !== true && (
          <FilterTag
            onRemove={() => setFilters({ ...filters, isActive: true })}
          >
            {filters.isActive == null ? "Show All" : "Inactive Only"}
          </FilterTag>
        )}

        {/* Date range */}
        {(filters.dateRange[0] || filters.dateRange[1]) && (
          <FilterTag
            onRemove={() => setFilters({ ...filters, dateRange: [null, null] })}
          >
            Date: {filters.dateRange[0] || "Start"} -{" "}
            {filters.dateRange[1] || "End"}
          </FilterTag>
        )}

        {/* Quantity */}
        {(filters.quantityRange[0] > 0 || filters.quantityRange[1] < 10000) && (
          <FilterTag
            onRemove={() =>
              setFilters({ ...filters, quantityRange: [0, 10000] })
            }
          >
            Quantity: {filters.quantityRange[0]} - {filters.quantityRange[1]}
          </FilterTag>
        )}
        {/* Quantity */}
        {(filters.amountRange[0] > 0 || filters.amountRange[1] < 100000) && (
          <FilterTag
            onRemove={() => setFilters({ ...filters, amountRange: [0, 100000] })}
          >
            Amount: {filters.amountRange[0]} - {filters.amountRange[1]}
          </FilterTag>
        )}

        {/* Buy Amount */}
        {filters.buyAmountRange &&
          (filters.buyAmountRange[0] > 0 ||
            filters.buyAmountRange[1] < 100000) && (
            <FilterTag
              onRemove={() =>
                setFilters({ ...filters, buyAmountRange: [0, 100000] })
              }
            >
              Buy: {filters.buyAmountRange[0]} - {filters.buyAmountRange[1]} DA
            </FilterTag>
          )}

        {/* Sell Amount */}
        {filters.sellAmountRange &&
          (filters.sellAmountRange[0] > 0 ||
            filters.sellAmountRange[1] < 100000) && (
            <FilterTag
              onRemove={() =>
                setFilters({ ...filters, sellAmountRange: [0, 100000] })
              }
            >
              Sell: {filters.sellAmountRange[0]} - {filters.sellAmountRange[1]}{" "}
              DA
            </FilterTag>
          )}

        {/* Spent Amount */}
        {filters.spentAmountRange &&
          (filters.spentAmountRange[0] > 0 ||
            filters.spentAmountRange[1] < 100000) && (
            <FilterTag
              onRemove={() =>
                setFilters({ ...filters, spentAmountRange: [0, 100000] })
              }
            >
              Spent: {filters.spentAmountRange[0]} -{" "}
              {filters.spentAmountRange[1]} DA
            </FilterTag>
          )}

        {/* Debt Amount */}
        {filters.debtRange &&
          (filters.debtRange[0] > 0 || filters.debtRange[1] < 100000) && (
            <FilterTag
              onRemove={() =>
                setFilters({ ...filters, debtRange: [0, 100000] })
              }
            >
              Debt: {filters.debtRange[0]} - {filters.debtRange[1]} DA
            </FilterTag>
          )}

        {/* (Optional) Result count */}
        {/* <span className="text-btn-secondary">({filteredData.length} results)</span> */}
      </div>
    </div>
  );
}

export default ActiveFilterBar;
