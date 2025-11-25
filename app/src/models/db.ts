import * as SQLite from 'expo-sqlite';
import { ensureDatabasePresent } from '../initDatabase';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  // S'assurer que la base de données est présente
  await ensureDatabasePresent();

  // Ouvrir la base de données
  db = await SQLite.openDatabaseAsync('database.db');
  return db;
}

