-- Create the absence-certificates storage bucket (referenced in Absences.tsx but never created)
INSERT INTO storage.buckets (id, name, public)
VALUES ('absence-certificates', 'absence-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own certificates
CREATE POLICY "Users can upload absence certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'absence-certificates');

-- Allow anyone to read certificates (public bucket)
CREATE POLICY "Public read access for absence certificates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'absence-certificates');