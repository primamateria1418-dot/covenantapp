import { useState, useEffect, useCallback } from 'react';
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
import { router, Link } from 'expo-router';
import { Colours } from '@/constants/colours';
import { signIn, getSession, getProfile } from '@/lib/supabase';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState('');

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const inputBg = isDark ? Colours.brownDeep : '#f5f0ea';
  const borderColor = isDark ? Colours.brownMid : '#d4c4b0';

  // Auto-login if valid session exists
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { session } = await getSession();
        if (session) {
          const { profile } = await getProfile(session.user.id);
          if (!profile || !profile.name) {
            router.replace('/setup');
          } else {
            router.replace('/(tabs)/checkin');
          }
          return;
        }
      } catch {
        // No valid session, stay on login
      } finally {
        setCheckingSession(false);
      }
    }
    checkExistingSession();
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setLockCountdown('');
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setLockCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleLogin = useCallback(async () => {
    if (isLocked) return;

    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signIn(email.trim(), password);

      if (authError) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
          setError(`Too many failed attempts. Try again in 15 minutes.`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(
            authError.message.includes('Invalid login credentials')
              ? `Incorrect email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
              : authError.message
          );
        }
        return;
      }

      if (!data.session) {
        setError('Sign in failed. Please try again.');
        return;
      }

      // Reset rate limit on success
      setFailedAttempts(0);
      setLockedUntil(null);

      // Check if profile setup is complete
      const { profile } = await getProfile(data.session.user.id);
      if (!profile || !profile.name) {
        router.replace('/setup');
      } else {
        router.replace('/(tabs)/checkin');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, failedAttempts, isLocked]);

  if (checkingSession) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <Text style={[styles.title, { color: Colours.gold }]}>Covenant</Text>
      </View>
    );
  }

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
          Welcome back
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
            editable={!isLocked}
          />

          <Text style={[styles.label, { color: textColor }]}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                { backgroundColor: inputBg, borderColor, color: textColor },
              ]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
              secureTextEntry={!showPassword}
              editable={!isLocked}
            />
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={[styles.forgotText, { color: Colours.gold }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#3a1515' : '#fdecea' }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isLocked ? (
          <View style={[styles.lockBox, { backgroundColor: isDark ? '#2a1a0a' : '#fff8ee' }]}>
            <Text style={[styles.lockText, { color: Colours.gold }]}>
              🔒 Account temporarily locked. Try again in {lockCountdown}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isLocked || loading ? '#999' : Colours.brownWarm },
          ]}
          onPress={handleLogin}
          disabled={loading || isLocked}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.signupLink, { color: Colours.gold }]}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={[styles.verse, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "I found the one my heart loves." — Song of Solomon 3:4
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: 18,
    fontFamily: 'Lato_300Light',
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
  passwordRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  errorBox: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  lockBox: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
  },
  lockText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
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
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  signupLink: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  verse: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
