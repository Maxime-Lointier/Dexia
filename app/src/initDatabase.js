import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export async function ensureDatabasePresent() {
  const dbLocation = FileSystem.documentDirectory + 'SQLite/database.db';
  const dir = FileSystem.documentDirectory + 'SQLite';
  const exists = await FileSystem.getInfoAsync(dbLocation);
  if (exists.exists) return;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const asset = Asset.fromModule(require('../../assets/database.db'));
  await asset.downloadAsync();
  await FileSystem.copyAsync({ from: asset.localUri, to: dbLocation });
}