export default interface FilterState {
  dateRange: [string, string];
  quantityRange: [number, number];
  buyAmountRange: [number, number];
  sellAmountRange: [number, number];
  spentAmountRange: [number, number];
  debtRange: [number, number];
  amountRange: [number, number];
  isActive: boolean | null;
}

export type FilterType =
  | "date"
  | "quantity"
  | "amount"
  | "active"
  | "buyAmount"
  | "spentAmount"
  | "debtAmount"
  | "sellAmount";
