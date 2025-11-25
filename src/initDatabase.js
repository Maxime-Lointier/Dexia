import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export async function ensureDatabasePresent() {
  const dbName = 'database.db';
  
  // Pour expo-sqlite, quand on utilise juste le nom, il stocke dans son répertoire par défaut
  // On doit vérifier si la base existe déjà en essayant de l'ouvrir
  try {
    const testDb = await SQLite.openDatabaseAsync(dbName);
    // Vérifier si la table genres existe (pour s'assurer que c'est la bonne base)
    const result = await testDb.getFirstAsync('SELECT name FROM sqlite_master WHERE type="table" AND name="genres"');
    await testDb.closeAsync();
    
    if (result) {
      console.log('Base de données déjà présente et valide');
      return;
    }
  } catch (error) {
    // La base n'existe pas ou n'est pas valide, on continue pour la copier
    console.log('Base de données non trouvée ou invalide, copie depuis assets...');
  }

  // Copier la base depuis assets
  const asset = Asset.fromModule(require('../backend/database.db'));
  await asset.downloadAsync();
  
  // Pour expo-sqlite, on copie dans documentDirectory
  // expo-sqlite cherche aussi dans ce répertoire quand on utilise juste le nom
  const dbLocation = FileSystem.documentDirectory + dbName;
  await FileSystem.copyAsync({ from: asset.localUri, to: dbLocation });
  
  console.log('Base de données copiée avec succès vers:', dbLocation);
}