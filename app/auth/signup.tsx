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
} from 'react-native';
import { Link } from 'expo-router';
import { Colours } from '@/constants/colours';
import { signUp } from '@/lib/supabase';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const inputBg = isDark ? Colours.brownDeep : '#f5f0ea';
  const borderColor = isDark ? Colours.brownMid : '#d4c4b0';

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const passwordLongEnough = password.length === 0 || password.length >= 8;
  const canSubmit =
    email.trim() !== '' &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const handleSignup = useCallback(async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(email.trim(), password);

      if (authError) {
        setError(authError.message);
        return;
      }

      // Show email verification message
      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.successEmoji}>✉️</Text>
        <Text style={[styles.successTitle, { color: textColor }]}>
          Check your email
        </Text>
        <Text style={[styles.successText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          We've sent a verification link to{'\n'}
          <Text style={{ fontFamily: 'Lato_700Bold', color: Colours.gold }}>{email}</Text>
          {'\n\n'}
          Please verify your email before logging in.
        </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={[styles.button, { backgroundColor: Colours.brownWarm }]}>
            <Text style={styles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </Link>
        <Text style={[styles.verse, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "Where you go I will go." — Ruth 1:16
        </Text>
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
          Begin your journey together
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

          <Text style={[styles.label, { color: textColor }]}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: inputBg,
                  borderColor: !passwordLongEnough ? '#e05555' : borderColor,
                  color: textColor,
                },
              ]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="Min. 8 characters"
              placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {!passwordLongEnough && (
            <Text style={styles.fieldError}>Password must be at least 8 characters</Text>
          )}

          <Text style={[styles.label, { color: textColor }]}>Confirm Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: inputBg,
                  borderColor: !passwordsMatch ? '#e05555' : borderColor,
                  color: textColor,
                },
              ]}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              placeholder="Confirm your password"
              placeholderTextColor={isDark ? Colours.brownMid : '#a09080'}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setShowConfirmPassword((v) => !v)}
            >
              <Text style={{ fontSize: 18 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {!passwordsMatch && (
            <Text style={styles.fieldError}>Passwords do not match</Text>
          )}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#3a1515' : '#fdecea' }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: canSubmit ? Colours.brownWarm : '#ccc' },
          ]}
          onPress={handleSignup}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.loginLink, { color: Colours.gold }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Privacy Policy & Terms of Service */}
        <View style={styles.legalRow}>
          <Text style={[styles.legalText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
            By creating an account you agree to our{' '}
          </Text>
          <Link href="/auth/privacy" asChild>
            <TouchableOpacity>
              <Text style={[styles.legalLink, { color: Colours.gold }]}>Privacy Policy</Text>
            </TouchableOpacity>
          </Link>
          <Text style={[styles.legalText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
            {' '}and{' '}
          </Text>
          <Link href="/auth/terms" asChild>
            <TouchableOpacity>
              <Text style={[styles.legalLink, { color: Colours.gold }]}>Terms of Service</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={[styles.verse, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "Where you go I will go." — Ruth 1:16
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
  successContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 24,
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
  fieldError: {
    color: '#e05555',
    fontSize: 12,
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
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  legalLink: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  verse: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
