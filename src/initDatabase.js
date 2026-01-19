import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export async function ensureDatabasePresent() {
  const dbName = 'database.db';
  const sqlDir = FileSystem.documentDirectory + 'SQLite/';
  
  try {
    const testDb = await SQLite.openDatabaseAsync(dbName);
    const tableExists = await testDb.getFirstAsync('SELECT name FROM sqlite_master WHERE type="table" AND name="genres"');
    if (tableExists) {
      const genresCount = await testDb.getFirstAsync('SELECT COUNT(*) as count FROM genres');
      await testDb.closeAsync();
      
      // @ts-ignore
      if (genresCount && genresCount.count > 0) {
        console.log('Base de données déjà présente et valide');
        return;
      } else {
        console.log('Base de données vide, recopie depuis assets...');
        const dbLocation = sqlDir + dbName;
        try {
          await FileSystem.deleteAsync(dbLocation, { idempotent: true });
        } catch (e) {
        }
      }
    } else {
      await testDb.closeAsync();
    }
  } catch (error) {
    console.log('Base de données non trouvée ou invalide, copie depuis assets...');
  }

  const sqlDirInfo = await FileSystem.getInfoAsync(sqlDir);
  if (!sqlDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqlDir, { intermediates: true });
  }

  const asset = Asset.fromModule(require('../backend/database.db'));
  await asset.downloadAsync();
  
  const dbLocation = sqlDir + dbName;
  await FileSystem.copyAsync({ from: asset.localUri, to: dbLocation });
  
  console.log('Base de données copiée avec succès vers:', dbLocation);
}

/**
 * Ajoute les colonnes manquantes pour les nouvelles fonctionnalités
 * Cette fonction est maintenant gérée dans db.ts pour éviter les conflits
 */
export async function updateDatabaseSchema() {
  const dbName = 'database.db';
  
  try {
    const db = await SQLite.openDatabaseAsync(dbName);
    
    // Vérifier si la colonne genre_weights existe
    const tableInfo = await db.getAllAsync('PRAGMA table_info(user_profile)');
    const columnNames = tableInfo.map(column => column.name);
    const hasGenreWeights = columnNames.includes('genre_weights');
    
    if (!hasGenreWeights) {
      console.log('🔧 Ajout de la colonne genre_weights...');
      try {
        await db.runAsync('ALTER TABLE user_profile ADD COLUMN genre_weights TEXT DEFAULT "{}"');
        console.log('✅ Colonne genre_weights ajoutée avec succès');
      } catch (addError) {
        // Si la colonne existe déjà (erreur de colonne en double), on ignore
        if (addError.message?.includes('duplicate column') || addError.code === 1) {
          console.log('ℹ️ Colonne genre_weights déjà présente');
        } else {
          throw addError;
        }
      }
    }
    
    // DEV: Réinitialiser les données utilisateur à chaque lancement, a supprimer en prod
    console.log('🧹 DEV: Nettoyage des données utilisateur...');
    await db.runAsync('DELETE FROM user_interactions');
    await db.runAsync('DELETE FROM user_profile');
    console.log('✅ Tables utilisateur vidées pour les tests');
    await db.closeAsync();
  } catch (error) {
    // Ignorer les erreurs de colonne en double
    if (error.message?.includes('duplicate column') || error.code === 1) {
      console.log('ℹ️ Colonne déjà présente (ignoré)');
    } else {
      console.error('Erreur lors de la mise à jour du schéma:', error);
    }
  }
}