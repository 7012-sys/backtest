import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Trash2, Upload, Database, FileSpreadsheet, Lock, Calendar, Clock, Hash, Info, Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { detectTimeframe, validateCsvSize } from "@/lib/csv/timeframeDetector";

interface UploadedFile {
  id: string;
  file_name: string;
  symbol: string;
  timeframe: string;
  date_range_start: string | null;
  date_range_end: string | null;
  file_size: number | null;
  row_count: number | null;
  created_at: string;
  csv_hash: string | null;
  data_source: string | null;
  exchange_source: string | null;
}

const DataLibrary = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isPro, isLoading: subLoading } = useSubscription(userId);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [uploadMapping, setUploadMapping] = useState({ date: "", open: "", high: "", low: "", close: "", volume: "" });
  const [uploadSymbol, setUploadSymbol] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      fetchFiles(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchFiles = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load files"); }
    else { setFiles(data || []); }
    setIsLoading(false);
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    // Delete from storage too
    if (userId) {
      await supabase.storage.from("csv-data").remove([`${userId}/${fileId}.csv`]);
    }
    const { error } = await supabase.from("uploaded_files").delete().eq("id", fileId);
    if (error) { toast.error("Failed to delete file"); }
    else { toast.success(`Deleted ${fileName}`); setFiles(files.filter(f => f.id !== fileId)); }
  };

  const startRename = (file: UploadedFile) => {
    setRenamingId(file.id);
    setRenameValue(file.file_name);
  };

  const saveRename = async (fileId: string) => {
    if (!renameValue.trim()) { toast.error("Name cannot be empty"); return; }
    const { error } = await supabase.from("uploaded_files").update({ file_name: renameValue.trim() }).eq("id", fileId);
    if (error) { toast.error("Failed to rename"); return; }
    setFiles(files.map(f => f.id === fileId ? { ...f, file_name: renameValue.trim() } : f));
    setRenamingId(null);
    toast.success("File renamed");
  };

  // Handle file selection for upload
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error("Please upload a CSV file"); return; }
    const sizeError = validateCsvSize(file.size, true);
    if (sizeError) { toast.error(sizeError); return; }

    setUploadFile(file);
    setUploadSymbol(file.name.replace(/\.csv$/i, '').toUpperCase().slice(0, 20));

    // Auto-detect columns internally
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length > 0) {
        const headerRow = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setUploadHeaders(headerRow);
        const autoMap = { date: "", open: "", high: "", low: "", close: "", volume: "" };
        headerRow.forEach(h => {
          const l = h.toLowerCase();
          if (l.includes('date') || l.includes('time')) autoMap.date = h;
          else if (l === 'open' || l === 'o') autoMap.open = h;
          else if (l === 'high' || l === 'h') autoMap.high = h;
          else if (l === 'low' || l === 'l') autoMap.low = h;
          else if (l === 'close' || l === 'c') autoMap.close = h;
          else if (l.includes('volume') || l === 'vol' || l === 'v') autoMap.volume = h;
        });

        // Validate required columns exist
        if (!autoMap.date || !autoMap.open || !autoMap.high || !autoMap.low || !autoMap.close) {
          toast.error("CSV must contain Date, Open, High, Low, Close columns. Please check your file.");
          setUploadFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setUploadMapping(autoMap);
      }
    };
    reader.readAsText(file);
    setShowUploadForm(true);
  }, []);

  const processAndSave = async () => {
    if (!uploadFile || !userId) return;
    if (!uploadMapping.date || !uploadMapping.open || !uploadMapping.high || !uploadMapping.low || !uploadMapping.close) {
      toast.error("Map all required columns"); return;
    }
    if (!uploadSymbol.trim()) { toast.error("Enter a symbol name"); return; }

    setUploading(true);
    try {
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headerRow = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dateIdx = headerRow.indexOf(uploadMapping.date);
      const openIdx = headerRow.indexOf(uploadMapping.open);
      const highIdx = headerRow.indexOf(uploadMapping.high);
      const lowIdx = headerRow.indexOf(uploadMapping.low);
      const closeIdx = headerRow.indexOf(uploadMapping.close);

      let rowCount = 0;
      const dates: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (vals.length < 5) continue;
        const close = parseFloat(vals[closeIdx]);
        if (isNaN(close)) continue;
        dates.push(vals[dateIdx]);
        rowCount++;
      }
      if (rowCount < 10) { toast.error("CSV must have at least 10 valid rows"); setUploading(false); return; }

      const sortedDates = [...dates].sort();
      const tf = detectTimeframe(dates);

      // Hash for provenance
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const csvHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

      // Insert record first to get ID
      const { data: inserted, error: insertErr } = await supabase.from("uploaded_files").insert({
        user_id: userId,
        file_name: uploadSymbol.trim(),
        symbol: uploadSymbol.trim(),
        timeframe: tf,
        date_range_start: sortedDates[0],
        date_range_end: sortedDates[sortedDates.length - 1],
        file_size: uploadFile.size,
        row_count: rowCount,
        csv_hash: csvHash,
      }).select().single();
      if (insertErr) throw insertErr;

      // Upload to storage
      const { error: storageErr } = await supabase.storage
        .from("csv-data")
        .upload(`${userId}/${inserted.id}.csv`, uploadFile, { contentType: 'text/csv', upsert: true });
      if (storageErr) {
        console.error("Storage upload failed:", storageErr);
        // Record is still saved, just won't be downloadable
      }

      toast.success(`"${uploadSymbol.trim()}" saved to Data Library`);
      setFiles(prev => [inserted, ...prev]);
      resetUploadForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save file");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadHeaders([]);
    setUploadMapping({ date: "", open: "", high: "", low: "", close: "", volume: "" });
    setUploadSymbol("");
    setShowUploadForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSignOut = async () => { await supabase.auth.signOut({ scope: 'local' }); navigate("/auth"); };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTimeframeLabel = (tf: string) => {
    const labels: Record<string, string> = { "1m": "1 Min", "5m": "5 Min", "15m": "15 Min", "1h": "1 Hour", "1d": "Daily", "1w": "Weekly", "1M": "Monthly" };
    return labels[tf] || tf;
  };

  return (
    <AppLayout showBack backTo="/dashboard" title="Data Library" subtitle="Manage your uploaded market data files" onSignOut={handleSignOut}>
      <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-foreground">Data Library</h1>
              <p className="text-muted-foreground mt-1">Manage your uploaded market data files</p>
            </div>
            <div className="flex items-center gap-3">
              {isPro ? (
                <Button onClick={() => fileInputRef.current?.click()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Upload className="h-4 w-4 mr-2" /> Upload CSV
                </Button>
              ) : (
                <Button onClick={() => navigate("/upgrade")} variant="outline">
                  <Lock className="h-4 w-4 mr-2" /> Pro Only
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>

          {/* Upload Form */}
          {showUploadForm && uploadFile && isPro && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-accent" />
                  Configure Upload: {uploadFile.name}
                </CardTitle>
                <CardDescription>Set a name for this dataset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dataset Name / Symbol</Label>
                  <Input value={uploadSymbol} onChange={e => setUploadSymbol(e.target.value)} placeholder="e.g. RELIANCE, NIFTY50" maxLength={30} />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={processAndSave} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {uploading ? "Saving..." : "Save to Library"}
                  </Button>
                  <Button variant="ghost" onClick={resetUploadForm}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Pro Banner */}
          {!isPro && !subLoading && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="py-6 text-center">
                <Lock className="h-8 w-8 mx-auto mb-3 text-accent" />
                <h3 className="font-medium mb-1">Pro Feature</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload and manage your own historical data with a Pro plan</p>
                <Button onClick={() => navigate("/upgrade")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Files Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                Saved Datasets
              </CardTitle>
              <CardDescription>{files.length} dataset{files.length !== 1 ? 's' : ''} saved</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || subLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No datasets yet</h3>
                  <p className="text-muted-foreground text-sm">
                    {isPro ? "Upload a CSV file to save it here for reuse in backtests" : "Upgrade to Pro to upload and save datasets"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Timeframe</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Date Range</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Rows</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Size</th>
                        <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Uploaded</th>
                        <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map(file => (
                        <tr key={file.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-3">
                            {renamingId === file.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  className="h-7 text-sm w-36"
                                  autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') saveRename(file.id); if (e.key === 'Escape') setRenamingId(null); }}
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveRename(file.id)}>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRenamingId(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-accent" />
                                <span className="font-medium text-foreground text-sm">{file.file_name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-xs">{getTimeframeLabel(file.timeframe)}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            {file.date_range_start && file.date_range_end ? (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(file.date_range_start), "MMM d, yy")} → {format(new Date(file.date_range_end), "MMM d, yy")}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="py-3 px-3 text-sm text-muted-foreground">{file.row_count?.toLocaleString() || "—"}</td>
                          <td className="py-3 px-3 text-sm text-muted-foreground">{formatFileSize(file.file_size)}</td>
                          <td className="py-3 px-3 text-sm text-muted-foreground">{format(new Date(file.created_at), "MMM d, yyyy")}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startRename(file)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(file.id, file.file_name)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </AppLayout>
  );
};

export default DataLibrary;
