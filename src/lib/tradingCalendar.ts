// NSE holidays for 2024-2026 (major holidays)
const NSE_HOLIDAYS: Set<string> = new Set([
  // 2024
  "2024-01-26","2024-03-08","2024-03-25","2024-03-29","2024-04-11","2024-04-14",
  "2024-04-17","2024-04-21","2024-05-01","2024-05-23","2024-06-17","2024-07-17",
  "2024-08-15","2024-10-02","2024-10-12","2024-10-31","2024-11-01","2024-11-15",
  "2024-12-25",
  // 2025
  "2025-01-26","2025-02-26","2025-03-14","2025-03-31","2025-04-10","2025-04-14",
  "2025-04-18","2025-05-01","2025-05-12","2025-06-27","2025-07-06","2025-08-15",
  "2025-08-16","2025-08-27","2025-10-02","2025-10-20","2025-10-21","2025-10-22",
  "2025-11-05","2025-11-26","2025-12-25",
  // 2026
  "2026-01-26","2026-02-17","2026-03-03","2026-03-19","2026-03-20","2026-04-02",
  "2026-04-03","2026-04-14","2026-05-01","2026-05-25","2026-06-16","2026-07-07",
  "2026-08-15","2026-09-04","2026-10-02","2026-10-09","2026-10-20","2026-10-25",
  "2026-11-25","2026-12-25",
]);

const toDateStr = (d: Date): string => d.toISOString().split("T")[0];

export const isTradingDay = (date: Date): boolean => {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  return !NSE_HOLIDAYS.has(toDateStr(date));
};

export const isDateSelectable = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  // Can't select today or future
  if (target >= today) return false;
  return isTradingDay(date);
};

export const getLastTradingDay = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1); // Start from yesterday
  while (!isTradingDay(d)) {
    d.setDate(d.getDate() - 1);
  }
  return toDateStr(d);
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isMarketHoliday = (date: Date): boolean => {
  return NSE_HOLIDAYS.has(toDateStr(date));
};
