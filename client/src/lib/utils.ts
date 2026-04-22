import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:5000";

/** Prepends the API base URL to relative /api/storage paths. Pass-through for absolute URLs. */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}
