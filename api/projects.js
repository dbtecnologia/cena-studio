import { listProjects, saveProject, requireBearer } from './_lib/supabase.js';

export default async function handler(req, res) {
  try {
    const bearer = requireBearer(req);
    if (req.method === 'GET') return res.status(200).json(await listProjects(bearer));
    if (req.method === 'POST') return res.status(200).json(await saveProject(req.body || {}, bearer));
    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.message, code: error.statusCode === 401 ? 'AUTH_REQUIRED' : 'SUPABASE_NOT_READY' });
  }
}


