export default interface FilterState {
  dateRange: [string, string];
  quantityRange: [number, number];
  isActive: boolean | null;
}
