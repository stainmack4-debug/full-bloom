
CREATE POLICY "pod_read" ON storage.objects FOR SELECT USING (bucket_id = 'proof-of-delivery');
CREATE POLICY "pod_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proof-of-delivery');
CREATE POLICY "pod_update" ON storage.objects FOR UPDATE USING (bucket_id = 'proof-of-delivery');
CREATE POLICY "pod_delete" ON storage.objects FOR DELETE USING (bucket_id = 'proof-of-delivery');
