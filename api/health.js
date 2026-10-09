Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
import { hasSupabase } from './_lib/supabase.js';

export default function handler(_req, res) {
  res.status(200).json({ ok: true, hosted: true, supabase: hasSupabase(), gemini: Boolean(process.env.GEMINI_API_KEY), render: 'browser-webm; ffmpeg local' });
}


