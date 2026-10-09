const apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';

function keyOrThrow() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY não configurada. O modo local continua disponível.');
    error.code = 'MISSING_GEMINI_KEY';
    throw error;
  }
  return process.env.GEMINI_API_KEY;
}

async function generate(model, body) {
  const key = keyOrThrow();
  const response = await fetch(`${apiBase}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || `Gemini respondeu HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function firstText(data) {
  return data?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || '';
}

function parseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function generateScript({ topic, duration, style, format }) {
  // Gemini 2.5 Flash is restricted for new API users. Keep the model
  // configurable, but default to the current text model documented by Google.
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
  const prompt = `Você é roteirista de vídeos curtos em português brasileiro. Crie um roteiro de ${duration} segundos sobre "${topic}". Estilo: ${style}. Formato: ${format}. Responda somente JSON válido no formato {"title": string, "scenes": [{"title": string, "visual": string, "narration": string, "duration": number}]} com 3 a 5 cenas. As durações devem somar exatamente ${duration}. Cada cena precisa ter uma narração natural e uma descrição visual objetiva para uma imagem. Não use markdown.`;
  const data = await generate(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });
  return parseJson(firstText(data));
}

export async function synthesizeSpeech({ text, voice = 'Aoede' }) {
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  const data = await generate(model, {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
    }
  });
  const part = data?.candidates?.[0]?.content?.parts?.find((item) => item.inlineData);
  if (!part?.inlineData?.data) throw new Error('O Gemini não retornou áudio.');
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'audio/L16;rate=24000' };
}


