Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.GEMINI_API_KEY) return res.status(412).json({ error: 'GEMINI_API_KEY não configurada na Vercel.', code: 'MISSING_GEMINI_KEY' });
  const { text, voice = 'Aoede' } = req.body || {};
  try {
    const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
    const data = await response.json(); if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini TTS indisponível.' });
    const part = data?.candidates?.[0]?.content?.parts?.find((item) => item.inlineData); if (!part) return res.status(502).json({ error: 'O Gemini não retornou áudio.' });
    return res.status(200).json({ base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'audio/L16;rate=24000' });
  } catch (error) { return res.status(502).json({ error: error.message, code: 'GEMINI_TTS_ERROR' }); }
}


