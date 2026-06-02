import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { sv } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: sv });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy HH:mm", { locale: sv });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: sv });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: sv });
}

/** Day heading for grouped lists: "Idag", "Igår", or "2 juni 2026". */
export function formatDayLabel(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return "Idag";
  if (isYesterday(d)) return "Igår";
  return format(d, "d MMMM yyyy", { locale: sv });
}

export function formatCurrency(value: number, currency: string = "SEK"): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
