-- 015: Storage buckets + RLS policies for review-proofs and claim-documents.
-- These were previously expected to be created manually in the Supabase
-- dashboard ("create in dashboard" per CODEBASE.md) but were never actually
-- created/policied in production, causing all proof uploads to fail.
--
-- Buckets are set public=true because the application code reads files via
-- getPublicUrl() (not signed URLs). Paths are namespaced by uploader's user
-- id + a timestamp, so URLs are not guessable/enumerable, but note this is
-- not a hard access control, anyone with the exact URL can view the file.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('review-proofs', 'review-proofs', true, 10485760, array['image/png','image/jpeg','image/jpg','application/pdf']),
  ('claim-documents', 'claim-documents', true, 10485760, array['image/png','image/jpeg','image/jpg','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users may upload into a path prefixed with their own user id
-- (both buckets use `${userId}/...` as the first path segment).
drop policy if exists "Authenticated upload to review-proofs" on storage.objects;
create policy "Authenticated upload to review-proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated upload to claim-documents" on storage.objects;
create policy "Authenticated upload to claim-documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is public; policy still required for the objects table).
drop policy if exists "Public read review-proofs" on storage.objects;
create policy "Public read review-proofs"
  on storage.objects for select
  to public
  using (bucket_id = 'review-proofs');

drop policy if exists "Public read claim-documents" on storage.objects;
create policy "Public read claim-documents"
  on storage.objects for select
  to public
  using (bucket_id = 'claim-documents');
