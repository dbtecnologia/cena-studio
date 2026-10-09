Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ensureQueue, queueDir, renderDir } from './queue.mjs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

await ensureQueue();
const bin = process.env.FFMPEG_BIN || 'ffmpeg';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg terminou com código ${code}`)));
  });
}

async function processJob(file) {
  const path = join(queueDir, file);
  const job = JSON.parse(await readFile(path, 'utf8'));
  if (job.status !== 'queued') return;
  job.status = 'processing'; job.progress = 12;
  await writeFile(path, JSON.stringify(job, null, 2));
  const out = join(renderDir, `${job.id}.mp4`);
  try {
    // Render mínimo e determinístico para a fila: o próximo passo é substituir os inputs
    // por assets do projeto. O FFmpeg continua fora da requisição HTTP, como requerido.
    const duration = Math.max(1, Number(job.payload?.duration || 5));
    await run(bin, ['-y', '-f', 'lavfi', '-i', `color=c=0x101217:s=720x1280:r=30`, '-t', String(duration), '-pix_fmt', 'yuv420p', out]);
    job.status = 'completed'; job.progress = 100; job.output = `/renders/${job.id}.mp4`;
  } catch (error) {
    job.status = 'error'; job.progress = 100; job.error = process.env.FFMPEG_BIN ? error.message : 'FFmpeg não encontrado. Instale FFmpeg e defina FFMPEG_BIN.';
  }
  await writeFile(path, JSON.stringify(job, null, 2));
}

console.log('Worker CENA ativo; observando data/queue');
setInterval(async () => {
  for (const file of await readdir(queueDir)) if (file.endsWith('.json')) await processJob(file);
}, 800);


