Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
const base = 'https://generativelanguage.googleapis.com/v1beta/models';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.GEMINI_API_KEY) return res.status(412).json({ error: 'GEMINI_API_KEY não configurada na Vercel. O rascunho local continua disponível.', code: 'MISSING_GEMINI_KEY' });
  const { topic, duration = 30, style = 'Cinematográfico', format = 'vertical' } = req.body || {};
  const prompt = `Você é roteirista de vídeos curtos em português brasileiro. Crie um roteiro de ${duration} segundos sobre "${topic}". Estilo: ${style}. Formato: ${format}. Responda somente JSON válido no formato {"title": string, "scenes": [{"title": string, "visual": string, "narration": string, "duration": number}]} com 3 a 5 cenas. As durações devem somar exatamente ${duration}.`;
  try {
    const response = await fetch(`${base}/${process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, responseMimeType: 'application/json' } }) });
    const data = await response.json(); if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini indisponível.' });
    const text = data?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || '{}';
    return res.status(200).json(JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()));
  } catch (error) { return res.status(502).json({ error: error.message, code: 'GEMINI_ERROR' }); }
}


