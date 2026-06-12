-- Add target_platform, android_build_format and html_file_url to apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS target_platform TEXT NOT NULL DEFAULT 'android';
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS android_build_format TEXT NOT NULL DEFAULT 'apk';
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS html_file_url TEXT;

-- Update existing rows to have default values if they are null
UPDATE public.apps SET target_platform = 'android' WHERE target_platform IS NULL;
UPDATE public.apps SET android_build_format = 'apk' WHERE android_build_format IS NULL;
