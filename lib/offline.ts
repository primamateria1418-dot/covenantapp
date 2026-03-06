import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { DAILY_VERSES, TOPIC_VERSES, DEVOTIONALS, getDailyVerse, Devotional } from '../constants/data';

// ─── Storage Keys ─────────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  DAILY_VERSE: '@covenant_cache_daily_verse',
  DEVOTIONAL: '@covenant_cache_devotional',
  SCRIPTURE_LIBRARY: '@covenant_cache_scripture',
  PRAYERS: '@covenant_cache_prayers',
  LAST_CACHE_DATE: '@covenant_cache_last_date',
  CHECKIN_QUEUE: '@covenant_queue_checkin',
  PRAYER_QUEUE: '@covenant_queue_prayers',
  LAST_SYNC_DATE: '@covenant_last_sync',
  IS_ONLINE: '@covenant_is_online',
};

// ─── Types ────────────────────────────────────────────────────────────────────────

interface QueuedCheckIn {
  id: string;
  answers: Record<string, string>;
  submittedAt: string;
  synced: boolean;
}

interface QueuedPrayer {
  id: string;
  text: string;
  isAnswered: boolean;
  createdAt: string;
  synced: boolean;
}

interface CachedVerse {
  verse: typeof DAILY_VERSES[0];
  isSeasonal: boolean;
  seasonalTheme?: string;
  cachedAt: string;
}

interface CachedDevotional {
  devotional: Devotional;
  dayOfYear: number;
  cachedAt: string;
}

interface CachedScripture {
  topics: typeof TOPIC_VERSES;
  verses: typeof DAILY_VERSES;
  cachedAt: string;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCheckIns: number;
  pendingPrayers: number;
  lastSyncAt: string | null;
}

// ─── Network State ────────────────────────────────────────────────────────────────

let currentNetworkState: NetInfoState | null = null;
let networkListeners: ((isOnline: boolean) => void)[] = [];

// Initialize network listener
NetInfo.addEventListener((state) => {
  currentNetworkState = state;
  const isOnline = state.isConnected ?? false;
  
  // Notify all listeners
  networkListeners.forEach(listener => listener(isOnline));
  
  // Update online status in storage
  AsyncStorage.setItem(CACHE_KEYS.IS_ONLINE, JSON.stringify(isOnline));
});

export function subscribeToNetworkChanges(callback: (isOnline: boolean) => void): () => void {
  networkListeners.push(callback);
  
  // Immediately call with current state
  if (currentNetworkState) {
    callback(currentNetworkState.isConnected ?? false);
  }
  
  // Return unsubscribe function
  return () => {
    networkListeners = networkListeners.filter(listener => listener !== callback);
  };
}

export async function getNetworkStatus(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Failed to get network status:', error);
    return false;
  }
}

// ─── Cache Functions ──────────────────────────────────────────────────────────────

export async function getCachedDailyVerse(): Promise<CachedVerse | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.DAILY_VERSE);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached daily verse:', error);
  }
  return null;
}

export async function getCachedDevotional(): Promise<CachedDevotional | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.DEVOTIONAL);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached devotional:', error);
  }
  return null;
}

export async function getCachedScripture(): Promise<CachedScripture | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.SCRIPTURE_LIBRARY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached scripture:', error);
  }
  return null;
}

export async function getCachedPrayers(): Promise<QueuedPrayer[]> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.PRAYERS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached prayers:', error);
  }
  return [];
}

// ─── Cache Writing Functions ────────────────────────────────────────────────────

async function cacheDailyVerse(): Promise<void> {
  try {
    const today = new Date();
    const { verse, isSeasonal, seasonalTheme } = getDailyVerse(today);
    
    const cachedVerse: CachedVerse = {
      verse,
      isSeasonal,
      seasonalTheme,
      cachedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(CACHE_KEYS.DAILY_VERSE, JSON.stringify(cachedVerse));
  } catch (error) {
    console.error('Failed to cache daily verse:', error);
  }
}

async function cacheDevotional(): Promise<void> {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Get devotional for today (cycle through the 30 devotions)
    const devotionalIndex = dayOfYear % DEVOTIONALS.length;
    const devotional = DEVOTIONALS[devotionalIndex];
    
    const cached: CachedDevotional = {
      devotional,
      dayOfYear,
      cachedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(CACHE_KEYS.DEVOTIONAL, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache devotional:', error);
  }
}

async function cacheScriptureLibrary(): Promise<void> {
  try {
    const cached: CachedScripture = {
      topics: TOPIC_VERSES,
      verses: DAILY_VERSES,
      cachedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(CACHE_KEYS.SCRIPTURE_LIBRARY, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache scripture library:', error);
  }
}

async function cacheLastThreePrayers(prayers: QueuedPrayer[]): Promise<void> {
  try {
    // Only keep last 3 prayers
    const recentPrayers = prayers.slice(-3);
    await AsyncStorage.setItem(CACHE_KEYS.PRAYERS, JSON.stringify(recentPrayers));
  } catch (error) {
    console.error('Failed to cache prayers:', error);
  }
}

// ─── Cache Invalidation & Refresh ───────────────────────────────────────────────

export async function shouldRefreshCache(): Promise<boolean> {
  try {
    const lastCacheDate = await AsyncStorage.getItem(CACHE_KEYS.LAST_CACHE_DATE);
    if (!lastCacheDate) {
      return true;
    }

    const lastDate = new Date(lastCacheDate);
    const today = new Date();
    
    // Check if it's a different day
    return lastDate.toDateString() !== today.toDateString();
  } catch (error) {
    console.error('Failed to check cache date:', error);
    return true;
  }
}

export async function refreshAllCache(prayers: QueuedPrayer[] = []): Promise<void> {
  const isOnline = await getNetworkStatus();
  
  if (!isOnline) {
    console.log('Offline - not refreshing cache');
    return;
  }

  await Promise.all([
    cacheDailyVerse(),
    cacheDevotional(),
    cacheScriptureLibrary(),
    cacheLastThreePrayers(prayers),
  ]);

  await AsyncStorage.setItem(CACHE_KEYS.LAST_CACHE_DATE, new Date().toISOString());
}

export async function initializeCache(prayers: QueuedPrayer[] = []): Promise<void> {
  const shouldRefresh = await shouldRefreshCache();
  
  if (shouldRefresh) {
    await refreshAllCache(prayers);
  } else {
    // Even if not refreshing, ensure we have cache
    const cachedVerse = await getCachedDailyVerse();
    if (!cachedVerse) {
      await cacheDailyVerse();
    }
    
    const cachedDevotional = await getCachedDevotional();
    if (!cachedDevotional) {
      await cacheDevotional();
    }
    
    const cachedScripture = await getCachedScripture();
    if (!cachedScripture) {
      await cacheScriptureLibrary();
    }
  }
}

// ─── Offline Queue Functions ────────────────────────────────────────────────────

export async function queueCheckIn(answers: Record<string, string>): Promise<string> {
  const isOnline = await getNetworkStatus();
  
  const queuedItem: QueuedCheckIn = {
    id: `checkin_${Date.now()}`,
    answers,
    submittedAt: new Date().toISOString(),
    synced: isOnline,
  };

  try {
    const existingQueue = await getQueuedCheckIns();
    existingQueue.push(queuedItem);
    await AsyncStorage.setItem(CACHE_KEYS.CHECKIN_QUEUE, JSON.stringify(existingQueue));
    
    // If online, try to sync immediately
    if (isOnline) {
      syncCheckIn(queuedItem);
    }
    
    return queuedItem.id;
  } catch (error) {
    console.error('Failed to queue check-in:', error);
    throw error;
  }
}

export async function getQueuedCheckIns(): Promise<QueuedCheckIn[]> {
  try {
    const queue = await AsyncStorage.getItem(CACHE_KEYS.CHECKIN_QUEUE);
    if (queue) {
      return JSON.parse(queue);
    }
  } catch (error) {
    console.error('Failed to get queued check-ins:', error);
  }
  return [];
}

export async function queuePrayer(text: string, isAnswered: boolean = false): Promise<string> {
  const isOnline = await getNetworkStatus();
  
  const queuedItem: QueuedPrayer = {
    id: `prayer_${Date.now()}`,
    text,
    isAnswered,
    createdAt: new Date().toISOString(),
    synced: isOnline,
  };

  try {
    const existingQueue = await getQueuedPrayers();
    existingQueue.push(queuedItem);
    await AsyncStorage.setItem(CACHE_KEYS.PRAYER_QUEUE, JSON.stringify(existingQueue));
    
    // Update cached prayers
    await cacheLastThreePrayers(existingQueue);
    
    // If online, try to sync immediately
    if (isOnline) {
      syncPrayer(queuedItem);
    }
    
    return queuedItem.id;
  } catch (error) {
    console.error('Failed to queue prayer:', error);
    throw error;
  }
}

export async function getQueuedPrayers(): Promise<QueuedPrayer[]> {
  try {
    const queue = await AsyncStorage.getItem(CACHE_KEYS.PRAYER_QUEUE);
    if (queue) {
      return JSON.parse(queue);
    }
  } catch (error) {
    console.error('Failed to get queued prayers:', error);
  }
  return [];
}

export async function removeQueuedItem(type: 'checkin' | 'prayer', id: string): Promise<void> {
  try {
    if (type === 'checkin') {
      const queue = await getQueuedCheckIns();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(CACHE_KEYS.CHECKIN_QUEUE, JSON.stringify(filtered));
    } else {
      const queue = await getQueuedPrayers();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(CACHE_KEYS.PRAYER_QUEUE, JSON.stringify(filtered));
      await cacheLastThreePrayers(filtered);
    }
  } catch (error) {
    console.error('Failed to remove queued item:', error);
  }
}

// ─── Sync Functions ──────────────────────────────────────────────────────────────

// These would connect to Supabase in a real implementation
// For now, they simulate the sync process

async function syncCheckIn(checkIn: QueuedCheckIn): Promise<boolean> {
  // In a real app, this would call Supabase to save the check-in
  console.log('Syncing check-in:', checkIn.id);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mark as synced
  checkIn.synced = true;
  return true;
}

async function syncPrayer(prayer: QueuedPrayer): Promise<boolean> {
  // In a real app, this would call Supabase to save the prayer
  console.log('Syncing prayer:', prayer.id);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mark as synced
  prayer.synced = true;
  return true;
}

export async function syncAllQueuedItems(
  onProgress?: (type: string, current: number, total: number) => void
): Promise<{ syncedCheckIns: number; syncedPrayers: number }> {
  const isOnline = await getNetworkStatus();
  
  if (!isOnline) {
    console.log('Cannot sync - offline');
    return { syncedCheckIns: 0, syncedPrayers: 0 };
  }

  let syncedCheckIns = 0;
  let syncedPrayers = 0;

  // Sync check-ins
  const checkIns = await getQueuedCheckIns();
  const unsyncedCheckIns = checkIns.filter(c => !c.synced);
  
  for (let i = 0; i < unsyncedCheckIns.length; i++) {
    const success = await syncCheckIn(unsyncedCheckIns[i]);
    if (success) {
      syncedCheckIns++;
      await removeQueuedItem('checkin', unsyncedCheckIns[i].id);
    }
    onProgress?.('checkin', i + 1, unsyncedCheckIns.length);
  }

  // Sync prayers
  const prayers = await getQueuedPrayers();
  const unsyncedPrayers = prayers.filter(p => !p.synced);
  
  for (let i = 0; i < unsyncedPrayers.length; i++) {
    const success = await syncPrayer(unsyncedPrayers[i]);
    if (success) {
      syncedPrayers++;
      await removeQueuedItem('prayer', unsyncedPrayers[i].id);
    }
    onProgress?.('prayer', i + 1, unsyncedPrayers.length);
  }

  // Update last sync time
  await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC_DATE, new Date().toISOString());

  return { syncedCheckIns, syncedPrayers };
}

// ─── Sync Status ─────────────────────────────────────────────────────────────────

export async function getSyncStatus(): Promise<SyncStatus> {
  const isOnline = await getNetworkStatus();
  const checkIns = await getQueuedCheckIns();
  const prayers = await getQueuedPrayers();
  const lastSyncDate = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC_DATE);

  return {
    isOnline,
    isSyncing: false, // This would be tracked by a state variable in real usage
    pendingCheckIns: checkIns.filter(c => !c.synced).length,
    pendingPrayers: prayers.filter(p => !p.synced).length,
    lastSyncAt: lastSyncDate,
  };
}

// ─── Offline Banner Helper ─────────────────────────────────────────────────────

export function useOfflineIndicator(): {
  isOnline: boolean;
  showBanner: boolean;
  bannerMessage: string;
} {
  // This would be used with React hooks in a component
  // Returns the current offline state
  const isOnline = currentNetworkState?.isConnected ?? false;
  
  return {
    isOnline,
    showBanner: !isOnline,
    bannerMessage: "You're offline — showing saved content",
  };
}

// ─── Clear Cache (for testing/logout) ────────────────────────────────────────────

export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.DAILY_VERSE,
      CACHE_KEYS.DEVOTIONAL,
      CACHE_KEYS.SCRIPTURE_LIBRARY,
      CACHE_KEYS.PRAYERS,
      CACHE_KEYS.LAST_CACHE_DATE,
      CACHE_KEYS.CHECKIN_QUEUE,
      CACHE_KEYS.PRAYER_QUEUE,
      CACHE_KEYS.LAST_SYNC_DATE,
      CACHE_KEYS.IS_ONLINE,
    ]);
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
}
