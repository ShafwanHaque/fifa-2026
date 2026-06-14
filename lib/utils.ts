import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchDate(utcDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(utcDate));
}

// The API doesn't expose a live match clock, so approximate the elapsed
// minute from kickoff time. Once a match runs past regulation + stoppage
// time the estimate is no longer meaningful, so fall back to "LIVE".
export function formatLiveMinute(utcDate: string) {
  const elapsed = Math.floor((Date.now() - new Date(utcDate).getTime()) / 60000);
  const minute = Math.max(0, elapsed);
  return minute > 90 ? "LIVE" : `${minute}'`;
}
