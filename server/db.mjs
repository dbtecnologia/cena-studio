Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = join(process.cwd(), 'data');
mkdirSync(root, { recursive: true });
const db = new DatabaseSync(join(root, 'cena.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export function listProjects() {
  return db.prepare('SELECT id, name, payload, created_at, updated_at FROM projects ORDER BY updated_at DESC').all()
    .map((row) => ({ ...row, payload: JSON.parse(row.payload) }));
}

export function saveProject(project) {
  const now = new Date().toISOString();
  const id = project.id || crypto.randomUUID();
  const payload = JSON.stringify({ ...project, id });
  db.prepare(`
    INSERT INTO projects (id, name, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, payload=excluded.payload, updated_at=excluded.updated_at
  `).run(id, project.name || 'Projeto sem nome', payload, project.createdAt || now, now);
  return { ...project, id, updatedAt: now };
}

export function getProject(id) {
  const row = db.prepare('SELECT payload FROM projects WHERE id = ?').get(id);
  return row ? JSON.parse(row.payload) : null;
}

export function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}


