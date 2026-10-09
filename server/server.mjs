Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProject, listProjects, saveProject, deleteProject } from './db.mjs';
import { generateScript, synthesizeSpeech } from './gemini.mjs';
import { enqueue, getJob, ensureQueue, renderDir } from './queue.mjs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const root = process.cwd();
const staticDir = join(root, 'dist');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function route(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, gemini: Boolean(process.env.GEMINI_API_KEY), ffmpeg: Boolean(process.env.FFMPEG_BIN), worker: 'fila persistente ativa' });
    }
    if (req.method === 'GET' && url.pathname === '/api/projects') return send(res, 200, listProjects());
    if (req.method === 'GET' && url.pathname.startsWith('/api/projects/')) {
      const project = getProject(url.pathname.split('/').pop());
      return project ? send(res, 200, project) : send(res, 404, { error: 'Projeto não encontrado.' });
    }
    if (req.method === 'POST' && url.pathname === '/api/projects') return send(res, 200, saveProject(await body(req)));
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/projects/')) { deleteProject(url.pathname.split('/').pop()); return send(res, 204, ''); }
    if (req.method === 'POST' && url.pathname === '/api/generate-script') return send(res, 200, await generateScript(await body(req)));
    if (req.method === 'POST' && url.pathname === '/api/synthesize') {
      const result = await synthesizeSpeech(await body(req));
      return send(res, 200, result);
    }
    if (req.method === 'POST' && url.pathname === '/api/render') return send(res, 202, await enqueue(await body(req)));
    if (req.method === 'GET' && url.pathname.startsWith('/api/jobs/')) {
      const job = await getJob(url.pathname.split('/').pop());
      return job ? send(res, 200, job) : send(res, 404, { error: 'Renderização não encontrada.' });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/renders/')) {
      const filename = url.pathname.split('/').pop();
      if (!/^[a-f0-9-]+\.mp4$/i.test(filename)) return send(res, 404, { error: 'Arquivo não encontrado.' });
      const file = join(renderDir, filename);
      try { await import('node:fs/promises').then((fs) => fs.access(file)); } catch { return send(res, 404, { error: 'Arquivo não encontrado.' }); }
      res.writeHead(200, { 'content-type': 'video/mp4', 'content-disposition': `attachment; filename="${filename}"` });
      return createReadStream(file).pipe(res);
    }
    if (req.method === 'GET') {
      const safe = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^([.][.][/\\])+/, '');
      const file = join(staticDir, safe);
      try {
        const stat = await import('node:fs/promises').then((fs) => fs.stat(file));
        if (stat.isFile()) return createReadStream(file).on('open', () => res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' })).pipe(res);
      } catch {}
    }
    return send(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    const status = error.code === 'MISSING_GEMINI_KEY' ? 412 : (error.status || 500);
    return send(res, status, { error: error.message, code: error.code || 'SERVER_ERROR' });
  }
}

await mkdir(join(root, 'data'), { recursive: true });
await ensureQueue();
createServer(route).listen(port, () => console.log(`CENA Studio em http://localhost:${port}`));


