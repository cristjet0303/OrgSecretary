import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app ? app.getPath('userData') : process.cwd();
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'orgsecretary.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run initial schema
  const schemaCandidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../database/schema.sql'),
    path.join(process.cwd(), 'desktop/database/schema.sql'),
  ];

  for (const sPath of schemaCandidates) {
    if (fs.existsSync(sPath)) {
      const schema = fs.readFileSync(sPath, 'utf-8');
      db.exec(schema);
      break;
    }
  }

  return db;
}
