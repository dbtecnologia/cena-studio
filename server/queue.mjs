Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const queueDir = join(process.cwd(), 'data', 'queue');
const renderDir = join(process.cwd(), 'data', 'renders');

export async function ensureQueue() {
  await mkdir(queueDir, { recursive: true });
  await mkdir(renderDir, { recursive: true });
}

export async function enqueue(payload) {
  await ensureQueue();
  const id = crypto.randomUUID();
  const job = { id, type: 'render', status: 'queued', progress: 0, createdAt: new Date().toISOString(), payload };
  await writeFile(join(queueDir, `${id}.json`), JSON.stringify(job, null, 2));
  return job;
}

export async function getJob(id) {
  try { return JSON.parse(await readFile(join(queueDir, `${id}.json`), 'utf8')); }
  catch { return null; }
}

export { queueDir, renderDir };


