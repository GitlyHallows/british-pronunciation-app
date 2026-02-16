import { formatInTimeZone } from "date-fns-tz";

const LONDON_TZ = "Europe/London";

export function toLondonDateBucket(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatInTimeZone(date, LONDON_TZ, "yyyy-MM-dd");
}

export function toLondonIso(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatInTimeZone(date, LONDON_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function formatLocalDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatLocalDate(isoDate: string): string {
  // Noon avoids day-shift artifacts when formatting a date-only bucket in local time.
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function londonNowDateBucket(): string {
  return toLondonDateBucket(new Date());
}

export const LONDON_TIMEZONE = LONDON_TZ;
