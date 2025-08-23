"use client";

import { useFilterStore } from "@/lib/store/useFilter";
import React from "react";
function ActiveFilterBar({ filteredData }: { filteredData: any[] }) {
  const filters = useFilterStore((state) => state.filters);

  return (
    <div className="active-filter">
      {(filters.isActive === null ||
        filters.isActive === false ||
        filters.dateRange[0] ||
        filters.dateRange[1] ||
        filters.quantityRange[0] > 0 ||
        filters.quantityRange[1] < 10000) && (
        <div className="mb-4 p-3 bg-primary border border-secondary rounded-lg">
          <div className="text-sm text-title">
            <span className="font-medium">Active Filters:</span>
            {filters.isActive !== true && (
              <span className="ml-2 px-2 py-1 border border-btn-secondary text-btn-secondary rounded">
                {filters.isActive === null ? "Show All" : "Inactive Only"}
              </span>
            )}
            {(filters.dateRange[0] || filters.dateRange[1]) && (
              <span className="ml-2 px-2 py-1 border border-btn-secondary text-btn-secondary rounded">
                Date: {filters.dateRange[0] || "Start"} -{" "}
                {filters.dateRange[1] || "End"}
              </span>
            )}
            {(filters.quantityRange[0] > 0 ||
              filters.quantityRange[1] < 10000) && (
              <span className="ml-2 px-2 py-1 border border-btn-secondary text-btn-secondary rounded">
                Amount: {filters.quantityRange[0]} - {filters.quantityRange[1]}{" "}
                DA
              </span>
            )}
            {/* <span className="ml-2 text-btn-secondary">
              ({filteredData.length} results)
            </span> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveFilterBar;
