const LOCAL_STORAGE_KEY = 'CHATGPT_WITH_VOICE';

interface PersistableData {
  [key: string]: any;
}

class StorageManager {
  save(data: PersistableData) {
    const serialized = JSON.stringify(data);
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  }

  load(): PersistableData | null {
    const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    try {
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }
}

const Storage = new StorageManager();

export default Storage;
