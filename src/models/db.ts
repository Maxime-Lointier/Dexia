import * as SQLite from 'expo-sqlite';
import { ensureDatabasePresent } from '../initDatabase';

let db: SQLite.SQLiteDatabase | null = null;
let migrationDone = false;

/**
 * Migrations de la base de données
 * Ajoute les colonnes manquantes si elles n'existent pas
 */
async function migrateDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Récupérer toutes les colonnes de la table user_profile
    const tableInfo = await database.getAllAsync('PRAGMA table_info(user_profile)');
    const columnNames = tableInfo.map((col: any) => col.name);
    
    // Migration 1: Ajouter la colonne keywords si elle n'existe pas
    if (!columnNames.includes('keywords')) {
      console.log('🔧 Migration: Ajout de la colonne keywords...');
      try {
        await database.runAsync('ALTER TABLE user_profile ADD COLUMN keywords TEXT DEFAULT "[]"');
        console.log('✅ Colonne keywords ajoutée avec succès');
      } catch (error: any) {
        if (error?.message?.includes('duplicate column') || error?.code === 1) {
          console.log('ℹ️ Colonne keywords déjà présente');
        } else {
          throw error;
        }
      }
    }
    
    // Migration 2: Ajouter la colonne genre_weights si elle n'existe pas
    if (!columnNames.includes('genre_weights')) {
      console.log('🔧 Migration: Ajout de la colonne genre_weights...');
      try {
        await database.runAsync('ALTER TABLE user_profile ADD COLUMN genre_weights TEXT DEFAULT "{}"');
        console.log('✅ Colonne genre_weights ajoutée avec succès');
      } catch (error: any) {
        if (error?.message?.includes('duplicate column') || error?.code === 1) {
          console.log('ℹ️ Colonne genre_weights déjà présente');
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    // Si l'erreur est due à une colonne déjà existante, on l'ignore
    if (error?.message?.includes('duplicate column') || error?.code === 1) {
      console.log('ℹ️ Colonne déjà présente (ignoré)');
    } else {
      console.error('Erreur lors de la migration de la base de données:', error);
    }
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  // S'assurer que la base de données est présente
  await ensureDatabasePresent();

  // Pour expo-sqlite, on utilise juste le nom de la base
  // expo-sqlite cherche dans documentDirectory par défaut
  const dbName = 'database.db';
  db = await SQLite.openDatabaseAsync(dbName);
  
  // Appliquer les migrations si nécessaire (une seule fois)
  if (!migrationDone) {
    migrationDone = true;
    try {
      await migrateDatabase(db);
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      migrationDone = false; // Réessayer la prochaine fois en cas d'erreur
    }
  }
  
  try {
    const genresCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM genres');
    const moviesCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM movies');
    console.log(`Base ouverte - Genres: ${genresCount?.count || 0}, Films: ${moviesCount?.count || 0}`);
  } catch (e) {
    console.error('Erreur lors de la vérification de la base:', e);
  }
  
  return db;
}

