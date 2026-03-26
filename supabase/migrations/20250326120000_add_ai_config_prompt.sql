-- Ejecutar en Supabase SQL Editor si no usas migraciones locales
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS prompt text;
