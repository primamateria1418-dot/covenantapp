import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleDailyCheckinReminder(hour = 8, minute = 0): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🙏 Daily Check-In',
      body: 'How is your heart today? Take a moment to connect with your spouse.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

export async function schedulePrayerReminder(hour = 20, minute = 0): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '✝️ Prayer Time',
      body: 'Come together in prayer. Strengthen your covenant.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleWeeklyReminder(
  dayOfWeek: number = 1, // 0 = Sunday, 1 = Monday, etc.
  time: string = '09:00'
): Promise<string> {
  // Cancel existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Parse time
  const [hour, minute] = time.split(':').map(Number);
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Weekly Check-In',
      body: "It's time for your weekly marriage check-in. Take time to invest in your covenant.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek + 1, // expo-notifications uses 1-7 (Sunday-Saturday)
      hour,
      minute,
    },
  });
  
  return id;
}
