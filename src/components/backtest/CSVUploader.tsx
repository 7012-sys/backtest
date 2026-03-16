import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { detectTimeframe, validateCsvSize, parseFlexibleDate } from "@/lib/csv/timeframeDetector";

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CSVUploaderProps {
  onDataLoaded: (data: CandleData[], detectedTimeframe?: string) => void;
  onClear: () => void;
  onDateRangeDetected?: (min: string, max: string) => void;
  isPro?: boolean;
}

export const CSVUploader = ({ onDataLoaded, onClear, onDateRangeDetected, isPro = false }: CSVUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedTimeframe, setDetectedTimeframe] = useState<string | null>(null);
  const [detectedDateRange, setDetectedDateRange] = useState<{ min: string; max: string } | null>(null);
  const [totalCandles, setTotalCandles] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError("Please upload a CSV file");
      return;
    }

    const sizeError = validateCsvSize(uploadedFile.size, isPro);
    if (sizeError) {
      setError(sizeError);
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setIsValidated(false);

    // Auto-validate immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headerRow = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Auto-detect columns
        const autoMap: Record<string, number> = {};
        headerRow.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('date') || lower.includes('time')) autoMap.date = i;
          else if (lower === 'open' || lower === 'o') autoMap.open = i;
          else if (lower === 'high' || lower === 'h') autoMap.high = i;
          else if (lower === 'low' || lower === 'l') autoMap.low = i;
          else if (lower === 'close' || lower === 'c') autoMap.close = i;
          else if (lower.includes('volume') || lower === 'vol' || lower === 'v') autoMap.volume = i;
        });

        if (autoMap.date === undefined || autoMap.open === undefined || autoMap.high === undefined || autoMap.low === undefined || autoMap.close === undefined) {
          setError("CSV must contain Date, Open, High, Low, Close columns. Please check your file.");
          return;
        }

        const data: CandleData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length < 5) continue;
          const open = parseFloat(values[autoMap.open]);
          const high = parseFloat(values[autoMap.high]);
          const low = parseFloat(values[autoMap.low]);
          const close = parseFloat(values[autoMap.close]);
          const volume = autoMap.volume !== undefined ? parseFloat(values[autoMap.volume]) : undefined;
          if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;
          data.push({
            date: values[autoMap.date],
            open, high, low, close,
            volume: volume && !isNaN(volume) ? volume : undefined,
          });
        }

        if (data.length < 10) {
          setError(`CSV must contain at least 10 valid data rows (found ${data.length}).`);
          return;
        }

        const tf = detectTimeframe(data.map(d => d.date));
        setDetectedTimeframe(tf);

        // Normalize dates to YYYY-MM-DD for proper sorting and date input compatibility
        const parsedDates = data
          .map(d => {
            const parsed = parseFlexibleDate(d.date);
            return parsed ? parsed.toISOString().split('T')[0] : null;
          })
          .filter((d): d is string => d !== null)
          .sort();
        
        const minDate = parsedDates[0] || data[0]?.date || "";
        const maxDate = parsedDates[parsedDates.length - 1] || data[data.length - 1]?.date || "";
        setDetectedDateRange({ min: minDate, max: maxDate });
        if (onDateRangeDetected) onDateRangeDetected(minDate, maxDate);

        setIsValidated(true);
        setError(null);
        setTotalCandles(data.length);
        onDataLoaded(data, tf);
        toast.success(`Loaded ${data.length} candles from CSV (detected ${tf} timeframe)`);
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(uploadedFile);
  }, [isPro, onDataLoaded, onDateRangeDetected]);

  const clearFile = () => {
    setFile(null);
    setIsValidated(false);
    setError(null);
    setDetectedTimeframe(null);
    setDetectedDateRange(null);
    setTotalCandles(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-accent" />
          Upload Custom Data (CSV)
          <InfoTooltip content="Upload your own historical price data in CSV format. The file should contain Date, Open, High, Low, Close columns. Volume is optional." />
        </CardTitle>
        <CardDescription>
          Test your strategy on custom historical data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <label
            className="block cursor-pointer touch-manipulation"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 active:border-accent transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Tap to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date, Open, High, Low, Close columns required · Max {isPro ? "50" : "10"}MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            {isValidated ? (
              <>
                {/* Clean Data Summary Card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Timeframe</p>
                    <p className="text-lg font-bold text-foreground">{detectedTimeframe || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Date Range</p>
                    <p className="text-xs font-medium text-foreground">
                      {detectedDateRange ? `${detectedDateRange.min} → ${detectedDateRange.max}` : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Candles</p>
                    <p className="text-lg font-bold text-foreground">{totalCandles.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                  <Button variant="ghost" size="sm" onClick={clearFile} className="h-6 text-xs">
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Loading state while parsing */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
