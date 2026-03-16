
-- Create storage bucket for CSV data files
INSERT INTO storage.buckets (id, name, public) VALUES ('csv-data', 'csv-data', false);

-- Users can upload their own files
CREATE POLICY "Users can upload own CSV files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'csv-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own files
CREATE POLICY "Users can read own CSV files"
ON storage.objects FOR SELECT
USING (bucket_id = 'csv-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own CSV files"
ON storage.objects FOR DELETE
USING (bucket_id = 'csv-data' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users can update own CSV files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'csv-data' AND auth.uid()::text = (storage.foldername(name))[1]);
