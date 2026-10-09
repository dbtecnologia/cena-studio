import { deleteProject, getProject, requireBearer } from '../_lib/supabase.js';

export default async function handler(req, res) {
  try {
    const id = req.query.id;
    const bearer = requireBearer(req);
    if (req.method === 'GET') {
      const project = await getProject(id, bearer);
      return project ? res.status(200).json(project.payload || project) : res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    if (req.method === 'DELETE') { await deleteProject(id, bearer); return res.status(204).end(); }
    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.message, code: error.statusCode === 401 ? 'AUTH_REQUIRED' : 'SUPABASE_NOT_READY' });
  }
}


