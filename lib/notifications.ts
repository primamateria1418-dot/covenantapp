import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyVerse } from '../constants/data';

// ─── Notification Types ───────────────────────────────────────────────────────────

export interface NotificationSettings {
  weeklyCheckin: {
    enabled: boolean;
    day: number; // 0 = Sunday
    hour: number;
    minute: number;
  };
  dailyVerse: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  partnerNudge: {
    enabled: boolean;
  };
  anniversary: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  streakReminder: {
    enabled: boolean;
    day: number; // 6 = Saturday
    hour: number;
    minute: number;
  };
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  weeklyCheckin: {
    enabled: true,
    day: 0, // Sunday
    hour: 19, // 7pm
    minute: 0,
  },
  dailyVerse: {
    enabled: true,
    hour: 8, // 8am
    minute: 0,
  },
  partnerNudge: {
    enabled: true,
  },
  anniversary: {
    enabled: true,
    hour: 8, // 8am
    minute: 0,
  },
  streakReminder: {
    enabled: true,
    day: 6, // Saturday
    hour: 18, // 6pm
    minute: 0,
  },
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────────

const NOTIFICATION_SETTINGS_KEY = '@covenant_notification_settings';
const LAST_PARTNER_NUDGE_KEY = '@covenant_last_partner_nudge';
const WEDDING_ANNIVERSARY_KEY = '@covenant_wedding_anniversary';

// ─── Notification Handler Setup ──────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Permission Handling ─────────────────────────────────────────────────────────

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token: permission not granted.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c8943a',
    });

    // Create separate channels for each notification type
    await Notifications.setNotificationChannelAsync('weekly-checkin', {
      name: 'Weekly Check-In',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c8943a',
    });

    await Notifications.setNotificationChannelAsync('daily-verse', {
      name: 'Daily Verse',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6b3322',
    });

    await Notifications.setNotificationChannelAsync('partner-nudge', {
      name: 'Partner Nudge',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e8c49a',
    });

    await Notifications.setNotificationChannelAsync('anniversary', {
      name: 'Anniversary',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250, 250, 250],
      lightColor: '#c8943a',
    });

    await Notifications.setNotificationChannelAsync('streak-reminder', {
      name: 'Streak Reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#5a2d1a',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function getNotificationPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ─── Settings Persistence ────────────────────────────────────────────────────────

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
}

export async function updateNotificationSetting<K extends keyof NotificationSettings>(
  key: K,
  value: NotificationSettings[K]
): Promise<void> {
  const settings = await loadNotificationSettings();
  settings[key] = value;
  await saveNotificationSettings(settings);
}

// ─── Weekly Check-In Reminder ────────────────────────────────────────────────────

export async function scheduleWeeklyCheckinReminder(
  settings: NotificationSettings['weeklyCheckin']
): Promise<string | null> {
  // Cancel existing weekly reminder first
  await cancelNotificationByIdentifier('weekly-checkin');

  if (!settings.enabled) {
    return null;
  }

  // expo-notifications uses 1-7 for weekday (Sunday = 1)
  const weekday = settings.day + 1;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for your weekly check-in ✝',
        body: 'Take 5 minutes to invest in your marriage.',
        sound: true,
        data: { type: 'weekly-checkin' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: settings.hour,
        minute: settings.minute,
      },
      identifier: 'weekly-checkin',
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule weekly check-in reminder:', error);
    return null;
  }
}

export async function cancelWeeklyCheckinReminder(): Promise<void> {
  await cancelNotificationByIdentifier('weekly-checkin');
}

// ─── Daily Verse Notification ─────────────────────────────────────────────────────

export async function scheduleDailyVerseReminder(
  settings: NotificationSettings['dailyVerse']
): Promise<string | null> {
  await cancelNotificationByIdentifier('daily-verse');

  if (!settings.enabled) {
    return null;
  }

  try {
    const today = new Date();
    const { verse } = getDailyVerse(today);
    
    // Get first 8 words of verse
    const words = verse.text.split(' ').slice(0, 8).join(' ');
    const body = `${verse.reference}: "${words}..."`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's verse for your marriage",
        body,
        sound: true,
        data: { type: 'daily-verse', verseId: verse.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
      },
      identifier: 'daily-verse',
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule daily verse reminder:', error);
    return null;
  }
}

export async function cancelDailyVerseReminder(): Promise<void> {
  await cancelNotificationByIdentifier('daily-verse');
}

// ─── Partner Nudge ────────────────────────────────────────────────────────────────

export async function canSendPartnerNudge(): Promise<boolean> {
  try {
    const lastNudge = await AsyncStorage.getItem(LAST_PARTNER_NUDGE_KEY);
    if (!lastNudge) {
      return true;
    }

    const lastNudgeTime = new Date(lastNudge).getTime();
    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;

    return (now - lastNudgeTime) >= fortyEightHours;
  } catch (error) {
    console.error('Failed to check partner nudge eligibility:', error);
    return false;
  }
}

export async function sendPartnerNudge(senderName: string): Promise<{ success: boolean; message: string }> {
  const settings = await loadNotificationSettings();
  
  if (!settings.partnerNudge.enabled) {
    return { success: false, message: 'Partner nudge is disabled' };
  }

  const canNudge = await canSendPartnerNudge();
  if (!canNudge) {
    return { success: false, message: 'You can only send one nudge every 48 hours' };
  }

  try {
    // Send immediate local notification (in real app, this would be push notification to spouse)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${senderName} is thinking of you 💛`,
        body: 'Open Covenant together today.',
        sound: true,
        data: { type: 'partner-nudge', senderName },
      },
      trigger: null, // Immediate
    });

    // Record that nudge was sent
    await AsyncStorage.setItem(LAST_PARTNER_NUDGE_KEY, new Date().toISOString());

    return { success: true, message: 'Nudge sent!' };
  } catch (error) {
    console.error('Failed to send partner nudge:', error);
    return { success: false, message: 'Failed to send nudge' };
  }
}

export async function getTimeUntilNextNudge(): Promise<string | null> {
  const canNudge = await canSendPartnerNudge();
  if (canNudge) {
    return null;
  }

  try {
    const lastNudge = await AsyncStorage.getItem(LAST_PARTNER_NUDGE_KEY);
    if (!lastNudge) {
      return null;
    }

    const lastNudgeTime = new Date(lastNudge).getTime();
    const nextAvailableTime = lastNudgeTime + (48 * 60 * 60 * 1000);
    const now = Date.now();
    const remaining = nextAvailableTime - now;

    if (remaining <= 0) {
      return null;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } catch {
    return null;
  }
}

// ─── Anniversary Notification ────────────────────────────────────────────────────

export async function setWeddingAnniversary(date: Date): Promise<void> {
  try {
    await AsyncStorage.setItem(WEDDING_ANNIVERSARY_KEY, date.toISOString());
  } catch (error) {
    console.error('Failed to save wedding anniversary:', error);
  }
}

export async function getWeddingAnniversary(): Promise<Date | null> {
  try {
    const stored = await AsyncStorage.getItem(WEDDING_ANNIVERSARY_KEY);
    if (stored) {
      return new Date(stored);
    }
  } catch (error) {
    console.error('Failed to get wedding anniversary:', error);
  }
  return null;
}

export async function scheduleAnniversaryReminder(
  settings: NotificationSettings['anniversary'],
  weddingDate: Date
): Promise<string | null> {
  await cancelNotificationByIdentifier('anniversary');

  if (!settings.enabled) {
    return null;
  }

  try {
    const now = new Date();
    const anniversaryThisYear = new Date(now.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());
    
    // If anniversary has passed this year, schedule for next year
    if (anniversaryThisYear < now) {
      anniversaryThisYear.setFullYear(anniversaryThisYear.getFullYear() + 1);
    }

    const yearsTogether = anniversaryThisYear.getFullYear() - weddingDate.getFullYear();

    // Schedule for the anniversary date at the specified time
    const triggerDate = new Date(anniversaryThisYear);
    triggerDate.setHours(settings.hour, settings.minute, 0, 0);

    // If the trigger date is in the past (anniversary already passed today), schedule for next year
    if (triggerDate < now) {
      triggerDate.setFullYear(triggerDate.getFullYear() + 1);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Happy Anniversary! ✝',
        body: `Today marks ${yearsTogether} years together. Open Covenant to celebrate.`,
        sound: true,
        data: { type: 'anniversary', years: yearsTogether },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
      identifier: 'anniversary',
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule anniversary reminder:', error);
    return null;
  }
}

// ─── Streak Grace Reminder ───────────────────────────────────────────────────────

export async function scheduleStreakReminder(
  settings: NotificationSettings['streakReminder'],
  currentStreak: number
): Promise<string | null> {
  await cancelNotificationByIdentifier('streak-reminder');

  if (!settings.enabled || currentStreak === 0) {
    return null;
  }

  // expo-notifications uses 1-7 for weekday (Sunday = 1)
  const weekday = settings.day + 1;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't lose your streak 🔥",
        body: `Check in before midnight to keep your ${currentStreak} week streak alive.`,
        sound: true,
        data: { type: 'streak-reminder', streak: currentStreak },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: settings.hour,
        minute: settings.minute,
      },
      identifier: 'streak-reminder',
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule streak reminder:', error);
    return null;
  }
}

export async function cancelStreakReminder(): Promise<void> {
  await cancelNotificationByIdentifier('streak-reminder');
}

// ─── Bulk Scheduling ───────────────────────────────────────────────────────────────

export async function scheduleAllNotifications(
  settings: NotificationSettings,
  weddingDate?: Date,
  currentStreak?: number
): Promise<void> {
  // Schedule weekly check-in
  await scheduleWeeklyCheckinReminder(settings.weeklyCheckin);

  // Schedule daily verse
  await scheduleDailyVerseReminder(settings.dailyVerse);

  // Schedule anniversary if wedding date provided
  if (weddingDate) {
    await scheduleAnniversaryReminder(settings.anniversary, weddingDate);
  }

  // Schedule streak reminder if streak provided
  if (currentStreak !== undefined) {
    await scheduleStreakReminder(settings.streakReminder, currentStreak);
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Helper Functions ─────────────────────────────────────────────────────────────

async function cancelNotificationByIdentifier(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Notification might not exist, ignore error
  }
}

// ─── Check-In Complete Handler ─────────────────────────────────────────────────

export async function onCheckInSubmitted(currentStreak: number): Promise<void> {
  // When check-in is submitted, cancel and reschedule for next week
  const settings = await loadNotificationSettings();
  
  // Cancel streak reminder (since they just checked in)
  await cancelStreakReminder();
  
  // Reschedule for next week with updated streak
  await scheduleStreakReminder(settings.streakReminder, currentStreak);
}

// ─── Notification Preferences UI Helpers ───────────────────────────────────────

export const WEEKDAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// ─── Notification Status ───────────────────────────────────────────────────────

export interface NotificationStatus {
  permissionGranted: boolean;
  weeklyCheckinScheduled: boolean;
  dailyVerseScheduled: boolean;
  anniversaryScheduled: boolean;
  streakReminderScheduled: boolean;
}

export async function getNotificationStatus(): Promise<NotificationStatus> {
  const permissionGranted = await getNotificationPermissionStatus() === 'granted';
  
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  const hasNotification = (type: string) => 
    scheduled.some(n => n.content.data?.type === type);

  return {
    permissionGranted,
    weeklyCheckinScheduled: hasNotification('weekly-checkin'),
    dailyVerseScheduled: hasNotification('daily-verse'),
    anniversaryScheduled: hasNotification('anniversary'),
    streakReminderScheduled: hasNotification('streak-reminder'),
  };
}
