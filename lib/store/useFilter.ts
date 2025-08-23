// stores/filterStore.ts
import { create } from "zustand";

export interface FilterState {
  dateRange: [string, string];
  quantityRange: [number, number];
  isActive: boolean | null;
}

interface FilterStore {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: {
    dateRange: ["", ""],
    quantityRange: [0, 10000],
    isActive: true,
  },
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () =>
    set({
      filters: {
        dateRange: ["", ""],
        quantityRange: [0, 10000],
        isActive: true,
      },
    }),
}));
