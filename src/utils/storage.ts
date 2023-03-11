const LOCAL_STORAGE_KEY = 'CHATGPT_WITH_VOICE';

interface PersistableData {
  [key: string]: any;
}

export function save(data: PersistableData) {
  const serialized = JSON.stringify(data);
  localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
}

export function load(): PersistableData | null {
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
