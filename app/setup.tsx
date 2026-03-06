import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';
import { getSession, upsertProfile, generateCoupleCode } from '@/lib/supabase';
import { registerForPushNotificationsAsync, scheduleDailyCheckinReminder } from '@/lib/notifications';

export default function SetupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [yourName, setYourName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const inputBg = isDark ? Colours.brownDeep : '#f5f0ea';
  const borderColor = isDark ? Colours.brownMid : '#d4c4b0';
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;

  const requestNotificationPermission = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setNotificationStatus('granted');
        // Schedule the daily reminder
        await scheduleDailyCheckinReminder(8, 0);
        return true;
      } else {
        setNotificationStatus('denied');
        return false;
      }
    } catch (error) {
      console.warn('Notification permission error:', error);
      setNotificationStatus('denied');
      return false;
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const handleContinue = useCallback(async () => {
    if (!yourName.trim()) {
      Alert.alert('Required', 'Please enter your name to continue.');
      return;
    }

    setLoading(true);
    try {
      const { session } = await getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      // Generate couple code
      const coupleCode = generateCoupleCode();

      // Save profile with couple code
      const { error } = await upsertProfile({
        id: session.user.id,
        name: yourName.trim(),
        spouse_name: spouseName.trim() || null,
        wedding_date: weddingDate.trim() || null,
        couple_code: coupleCode,
      });

      if (error) {
        console.warn('Profile save error (non-blocking):', error.message);
      }

      // Request notification permission
      await requestNotificationPermission();

      router.replace('/(tabs)/checkin');
    } catch {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [yourName, spouseName, weddingDate, requestNotificationPermission]);

  const isFormValid = yourName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ring emoji at top */}
        <Text style={styles.ringEmoji}>💍</Text>
        
        <Text style={[styles.title, { color: textColor }]}>Tell us about your marriage</Text>
        <Text style={[styles.subtitle, { color: subColor }]}>
          This helps us personalise your experience
        </Text>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: textColor }]}>Your Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={yourName}
            onChangeText={setYourName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: textColor }]}>Your Spouse's Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={spouseName}
            onChangeText={setSpouseName}
            placeholder="Enter your spouse's name"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: textColor }]}>Wedding Anniversary</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={weddingDate}
            onChangeText={setWeddingDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Notification Permission */}
        {notificationStatus === 'pending' && (
          <View style={[styles.notificationCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <Text style={[styles.notificationTitle, { color: textColor }]}>
              Stay Connected
            </Text>
            <Text style={[styles.notificationText, { color: subColor }]}>
              We'll remind you each week to check in together. You can change this any time.
            </Text>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: Colours.brownWarm }]}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.notificationButtonText}>Enable Reminders</Text>
            </TouchableOpacity>
          </View>
        )}

        {notificationStatus === 'denied' && (
          <View style={[styles.notificationCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.notificationTitle, { color: textColor }]}>
              Reminders Off
            </Text>
            <Text style={[styles.notificationText, { color: subColor }]}>
              No worries! You can enable them anytime in your device settings.
            </Text>
            <TouchableOpacity
              style={[styles.settingsButton, { borderColor }]}
              onPress={openSettings}
            >
              <Text style={[styles.settingsButtonText, { color: textColor }]}>
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isFormValid && !loading ? Colours.brownWarm : '#ccc' },
          ]}
          onPress={handleContinue}
          disabled={!isFormValid || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Begin Together'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.verse, { color: subColor }]}>
          "Two are better than one" — Ecclesiastes 4:9
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  ringEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  notificationCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  notificationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 17,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 6,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  notificationButtonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  settingsButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  settingsButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: Colours.cream,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  verse: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    textAlign: 'center',
    marginTop: 24,
  },
});
