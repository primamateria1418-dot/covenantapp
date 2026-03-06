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
} from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';
import { getSession, upsertProfile } from '@/lib/supabase';

export default function SetupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [yourName, setYourName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [loading, setLoading] = useState(false);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const inputBg = isDark ? Colours.brownDeep : '#f5f0ea';
  const borderColor = isDark ? Colours.brownMid : '#d4c4b0';

  const handleContinue = useCallback(async () => {
    if (!yourName.trim()) return;

    setLoading(true);
    try {
      const { session } = await getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const { error } = await upsertProfile({
        id: session.user.id,
        name: yourName.trim(),
        spouse_name: spouseName.trim() || null,
        wedding_date: weddingDate.trim() || null,
      });

      if (error) {
        // If the profiles table doesn't exist yet, still proceed
        // (Supabase table may not be created yet in dev)
        console.warn('Profile save error (non-blocking):', error.message);
      }

      router.replace('/(tabs)/checkin');
    } catch (err) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [yourName, spouseName, weddingDate]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: Colours.gold }]}>Covenant</Text>
        <Text style={[styles.subtitle, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          Let's set up your marriage profile
        </Text>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.label, { color: textColor }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={yourName}
            onChangeText={setYourName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
          />

          <Text style={[styles.label, { color: textColor }]}>Spouse's Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={spouseName}
            onChangeText={setSpouseName}
            placeholder="Enter your spouse's name"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
          />

          <Text style={[styles.label, { color: textColor }]}>Wedding Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={weddingDate}
            onChangeText={setWeddingDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: yourName.trim() && !loading ? Colours.brownWarm : '#ccc' },
          ]}
          onPress={handleContinue}
          disabled={!yourName.trim() || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Begin Your Journey →'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.verse, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
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
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 44,
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
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
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  verse: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
