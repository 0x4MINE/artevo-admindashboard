import FilterState from "@/types/FilterState";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import mongoose from "mongoose";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generate7DigitId(): string {
  const num = Math.floor(Math.random() * 10_000_000);
  return num.toString().padStart(7, "0");
}
export function generate3DigitId(): string {
  const num = Math.floor(Math.random() * 1000);
  return num.toString().padStart(3, "0");
}

export function filterData(
  search: string,
  filtered: any,
  filters: FilterState
): any {
  if (search.trim()) {
    const searchTerm = search.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.id.toLowerCase().includes(searchTerm) ||
        item.phone.includes(searchTerm)
    );
  }

  if (filters.isActive !== null) {
    if (filters.isActive) {
      filtered = filtered.filter((item) => item.status === "active");
    } else {
      filtered = filtered.filter((item) => item.status === "not active");
    }
  }

  const [dateFrom, dateTo] = filters.dateRange;
  if (dateFrom || dateTo) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  }

  const [minQty, maxQty] = filters.quantityRange;
  if (minQty > 0 || maxQty < 10000) {
    filtered = filtered.filter((item) => {
      const amount = item.spentThisMonth;
      return amount >= minQty && amount <= maxQty;
    });
  }

  return filtered;
}

export function generateCustomId(prefix: string, seqLength: number = 3) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const seq = String(now.getTime()).slice(-seqLength).padStart(seqLength, "0");

  return `${prefix}${yy}${mm}-${seq}`;
}

export async function generateShortIdWithMonth(
  model: any,
  prefix: string,
  field: string,
  length: number = 3
) {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const pattern = `${prefix}${year}${month}`;

  const lastDoc = await model
    .findOne({ [field]: { $regex: `^${pattern}` } })
    .sort({ [field]: -1 })
    .lean();

  let seq = 1;
  if (lastDoc?.[field]) {
    seq = parseInt(lastDoc[field].slice(pattern.length), 10) + 1;
  }

  return `${pattern}${String(seq).padStart(length, "0")}`;
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function formatBillNo(num: number): string {
  const year = new Date().getFullYear();
  const formatted = `${String(num).padStart(5, "0")}/${year}`;
  return formatted;
}
