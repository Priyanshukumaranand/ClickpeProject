import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatApr(apr: number) {
  return `${apr.toFixed(2)}% APR`;
}

export function formatTenure(minMonths: number, maxMonths: number) {
  if (!minMonths && !maxMonths) return "Flexible tenure";
  if (minMonths === maxMonths) return `${minMonths} months`;
  return `${minMonths}-${maxMonths} months`;
}

export function normalizeSearch(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}
