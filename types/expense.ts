export interface Expense {
  _id?: string;
  id: string;
  name: string;
  price: string | number;
  createdAt: number | Date;
  user?: {
    id: string;
    name: string;
  };
  by?: string;
}

export interface ExpenseFormData {
  id: string;
  name: string;
  price: string;
  createdAt: number;
}