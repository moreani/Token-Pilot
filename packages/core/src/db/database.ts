import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { runMigrations } from './migrations.js';

export function createDatabase(dbPath: string = ':memory:'): DatabaseSync {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  runMigrations(db);
  return db;
}
