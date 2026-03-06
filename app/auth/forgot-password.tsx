import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Colours } from '@/constants/colours';
import { resetPassword } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const inputBg = isDark ? Colours.brownDeep : '#f5f0ea';
  const borderColor = isDark ? Colours.brownMid : '#d4c4b0';

  const handleReset = useCallback(async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email.trim());

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {sent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>✉️</Text>
            <Text style={[styles.successTitle, { color: textColor }]}>
              Check your email
            </Text>
            <Text style={[styles.successText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
              We've sent a password reset link to{'\n'}
              <Text style={{ fontFamily: 'Lato_700Bold', color: Colours.gold }}>{email}</Text>
            </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: Colours.brownWarm }]}
              >
                <Text style={styles.buttonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <>
            <Text style={[styles.heading, { color: textColor }]}>Reset Password</Text>
            <Text style={[styles.description, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.label, { color: textColor }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#3a1515' : '#fdecea' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: email.trim() && !loading ? Colours.brownWarm : '#ccc' },
              ]}
              onPress={handleReset}
              disabled={loading || !email.trim()}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>

            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.backLink}>
                <Text style={[styles.backLinkText, { color: Colours.gold }]}>
                  ← Back to Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  description: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  card: {
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
  errorBox: {
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  button: {
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
  backLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  successText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});
