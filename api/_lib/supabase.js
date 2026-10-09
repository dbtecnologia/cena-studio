const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

export function hasSupabase() { return Boolean(url && publishableKey); }

export function requireBearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) { const error = new Error('Faça login para acessar seus projetos.'); error.statusCode = 401; throw error; }
  return header;
}

async function request(path, options = {}, bearer) {
  if (!hasSupabase()) throw new Error('Supabase ainda não foi configurado na Vercel.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: bearer,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Supabase respondeu HTTP ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

export function listProjects(bearer) { return request('projects?select=*&order=updated_at.desc', {}, bearer); }
export function getProject(id, bearer) { return request(`projects?id=eq.${encodeURIComponent(id)}&select=*`, {}, bearer).then((rows) => rows[0] || null); }
export function saveProject(project, bearer) { return request('projects', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: project.id || undefined, name: project.name || 'Sem título', payload: project, updated_at: new Date().toISOString() }) }, bearer).then((rows) => rows[0]); }
export function deleteProject(id, bearer) { return request(`projects?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, bearer); }
