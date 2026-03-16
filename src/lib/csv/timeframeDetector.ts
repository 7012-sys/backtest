/**
 * Auto-detect timeframe from CSV date intervals.
 * Analyzes the gaps between consecutive date entries to determine the data frequency.
 */
export const detectTimeframe = (dates: string[]): string => {
  if (dates.length < 3) return "1d";

  // Parse dates and compute intervals in minutes
  const parsedDates = dates
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (parsedDates.length < 3) return "1d";

  const intervals: number[] = [];
  for (let i = 1; i < Math.min(parsedDates.length, 50); i++) {
    const diffMs = parsedDates[i].getTime() - parsedDates[i - 1].getTime();
    const diffMin = diffMs / 60000;
    if (diffMin > 0) intervals.push(diffMin);
  }

  if (intervals.length === 0) return "1d";

  // Use median interval for robustness
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  if (median <= 2) return "1m";
  if (median <= 8) return "5m";
  if (median <= 20) return "15m";
  if (median <= 45) return "30m";
  if (median <= 120) return "1h";
  if (median <= 300) return "4h";
  if (median <= 1600) return "1d";
  if (median <= 11000) return "1w";
  return "1M";
};

/**
 * Validate CSV file size based on user plan.
 * Free: 10MB, Pro: 50MB
 */
export const validateCsvSize = (fileSize: number, isPro: boolean): string | null => {
  const maxSizeMB = isPro ? 50 : 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (fileSize > maxSizeBytes) {
    return `File size exceeds ${maxSizeMB}MB limit${!isPro ? ". Upgrade to Pro for 50MB uploads" : ""}.`;
  }
  return null;
};

/**
 * Parse various date formats commonly found in financial CSVs.
 * Supports: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY, MM/DD/YYYY, etc.
 */
export const parseFlexibleDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  
  // Try native parse first (handles ISO, YYYY-MM-DD)
  const native = new Date(trimmed);
  if (!isNaN(native.getTime())) return native;

  // DD-MMM-YYYY (e.g., 15-Jan-2024)
  const ddMmmYyyy = trimmed.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})/);
  if (ddMmmYyyy) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = months[ddMmmYyyy[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(parseInt(ddMmmYyyy[3]), month, parseInt(ddMmmYyyy[1]));
    }
  }

  // DD/MM/YYYY
  const ddMmYyyy = trimmed.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})/);
  if (ddMmYyyy) {
    const day = parseInt(ddMmYyyy[1]);
    const month = parseInt(ddMmYyyy[2]) - 1;
    const year = parseInt(ddMmYyyy[3]);
    if (day <= 31 && month <= 11) {
      return new Date(year, month, day);
    }
  }

  return null;
};
