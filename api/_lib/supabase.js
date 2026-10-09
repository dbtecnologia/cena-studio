Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabase() { return Boolean(url && serviceKey); }

async function request(path, options = {}) {
  if (!hasSupabase()) throw new Error('Supabase ainda não foi configurado na Vercel.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Supabase respondeu HTTP ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

export function listProjects() { return request('projects?select=*&order=updated_at.desc'); }
export function getProject(id) { return request(`projects?id=eq.${encodeURIComponent(id)}&select=*`).then((rows) => rows[0] || null); }
export function saveProject(project) { return request('projects', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: project.id || undefined, name: project.name || 'Sem título', payload: project, updated_at: new Date().toISOString() }) }).then((rows) => rows[0]); }
export function deleteProject(id) { return request(`projects?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }); }


