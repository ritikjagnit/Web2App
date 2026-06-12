
-- Restrict bucket SELECT to specific paths (no listing the whole bucket)
DROP POLICY IF EXISTS "Public read app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read apk-artifacts" ON storage.objects;

CREATE POLICY "Public read app-assets files" ON storage.objects FOR SELECT
  USING (bucket_id = 'app-assets' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Public read apk-artifacts files" ON storage.objects FOR SELECT
  USING (bucket_id = 'apk-artifacts' AND (storage.foldername(name))[1] IS NOT NULL);

-- Revoke broad EXECUTE on SECURITY DEFINER helpers; allow only authenticated for has_role
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
