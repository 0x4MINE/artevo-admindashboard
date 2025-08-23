import React from "react";
import DropdownFilter from "@/components/DropdownFilter";

interface FilterState {
  dateRange: [string, string];
  quantityRange: [number, number];
  isActive: boolean | null;
}

interface Props {
  setPopUp: (state: boolean) => void;
  setSearch: (state: string) => void;
}

function ContentNavbar({ setPopUp, setSearch }: Props) {
  return (
    <div className="flex flex-col-reverse sm:flex-row bg-background justify-between items-center p-4 gap-4">
      <div className="hidden md:block" />

      {/* Search Input */}
      <div className="flex-1 max-w-sm">
        <input
          type="text"
          className="w-full bg-primary text-[#B0B0B0] py-2 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />
      </div>

      {/* Filter Dropdown and Add Button */}
      <div className="flex gap-3 items-center">
        <DropdownFilter />

        <button
          onClick={() => setPopUp(true)}
          className="py-2 px-4 bg-btn-primary text-white rounded-[10px] whitespace-nowrap hover:opacity-90 transition-opacity flex items-center gap-2 font-bold"
        >
          <span className="text-lg">+</span>
        </button>
      </div>
    </div>
  );
}

export default ContentNavbar;
