import FilterState from "@/types/FilterState";
import { create } from "zustand";

interface FilterStore {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  dateRange: ["", ""],
  quantityRange: [0, 10000],
  buyAmountRange: [0, 100000],
  sellAmountRange: [0, 100000],
  amountRange: [0, 100000],
  spentAmountRange: [0, 100000],
  debtRange: [0, 100000],
  isActive: true,
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: initialFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: initialFilters }),
}));
