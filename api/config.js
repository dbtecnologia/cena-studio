export default function handler(_req, res) {
  res.status(200).json({ url: process.env.SUPABASE_URL || '', publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '' });
}

