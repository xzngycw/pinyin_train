import { defaultSettings } from '../data/pinyin';
import type { Metrics, ParentSettings } from '../types';

const SETTINGS_KEY = 'pinyin-train-settings';
const DB_NAME = 'pinyin-train-db';
const STORE_NAME = 'app-store';
const METRICS_KEY = 'metrics';

export const emptyMetrics: Metrics = {
  attempts: 0,
  successCount: 0,
  errorCount: 0,
  streak: 0,
  bestStreak: 0,
  completedChallenges: 0,
  todayCount: 0,
  lastPlayedDate: '',
  recentSuccesses: [],
  masteredSyllables: [],
  wrongSyllables: {}
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStore<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        db.close();
        resolve((request.result as T | undefined) ?? fallback);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return fallback;
  }
}

async function writeStore<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function loadSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) } as ParentSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: ParentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadMetrics(): Promise<Metrics> {
  const stored = await readStore<Metrics>(METRICS_KEY, emptyMetrics);
  const today = getTodayKey();
  if (stored.lastPlayedDate !== today) {
    return {
      ...stored,
      todayCount: 0,
      lastPlayedDate: today
    };
  }
  return stored;
}

export async function saveMetrics(metrics: Metrics) {
  await writeStore(METRICS_KEY, metrics);
}

export async function clearAppData() {
  localStorage.removeItem(SETTINGS_KEY);

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // noop
  }
}
