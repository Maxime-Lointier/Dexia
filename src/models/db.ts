import * as SQLite from 'expo-sqlite';
import { ensureDatabasePresent } from '../initDatabase';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  // S'assurer que la base de données est présente
  await ensureDatabasePresent();

  // Pour expo-sqlite, on utilise juste le nom de la base
  // expo-sqlite gère automatiquement le chemin
  const dbName = 'database.db';
  db = await SQLite.openDatabaseAsync(dbName);
  
  return db;
}

