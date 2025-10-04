import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const plFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export function formatPLN(value: number, fractionDigits = 0) {
  if (!Number.isFinite(value)) return "-";
  const { minimumFractionDigits, maximumFractionDigits } = plFormatter.resolvedOptions();
  // Clone formatter with desired fraction digits
  const fmt = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: fractionDigits ?? minimumFractionDigits,
    maximumFractionDigits: fractionDigits ?? maximumFractionDigits,
  });
  return fmt.format(value);
}
