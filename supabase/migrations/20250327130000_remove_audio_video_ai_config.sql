-- Elimina configuraciones de features ya retiradas del panel admin
DELETE FROM ai_config
WHERE feature IN ('audio_greeting', 'video_script');
