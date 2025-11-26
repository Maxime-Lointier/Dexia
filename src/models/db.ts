import * as SQLite from 'expo-sqlite';
import { ensureDatabasePresent } from '../initDatabase';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Ajoute la colonne keywords à la table user_profile si elle n'existe pas
 */
async function migrateDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Vérifier si la colonne keywords existe déjà
    const tableInfo = await database.getAllAsync('PRAGMA table_info(user_profile)');
    const hasKeywordsColumn = tableInfo.some((col: any) => col.name === 'keywords');
    
    if (!hasKeywordsColumn) {
      console.log('Migration: Ajout de la colonne keywords à user_profile');
      await database.runAsync('ALTER TABLE user_profile ADD COLUMN keywords TEXT DEFAULT "[]"');
      console.log('Migration terminée avec succès');
    }
  } catch (error) {
    console.error('Erreur lors de la migration de la base de données:', error);
  }
}

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
  
  // Appliquer les migrations si nécessaire
  await migrateDatabase(db);
  
  return db;
}

