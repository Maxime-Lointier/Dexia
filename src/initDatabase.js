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