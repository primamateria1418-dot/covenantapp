import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';

export default function SplashScreen() {
  // Floating animation for cross
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3d1f0f', '#5a3020', '#6b3322']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Gold Cross with animation */}
        <Animated.View
          style={[
            styles.crossContainer,
            {
              transform: [
                { translateY: floatAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <Text style={styles.cross}>✝️</Text>
        </Animated.View>

        {/* App Name */}
        <Text style={styles.title}>Covenant</Text>
        <Text style={styles.tagline}>Your Marriage, Rooted in Faith</Text>

        {/* Verse Card */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            "Two are better than one, because they{'\n'}
            have a good reward for their toil."
          </Text>
          <Text style={styles.verseRef}>Ecclesiastes 4:9</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.primaryButtonText}>Begin Your Journey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d1f0f',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  crossContainer: {
    marginBottom: 24,
  },
  cross: {
    fontSize: 72,
    textAlign: 'center',
  },
  title: {
    fontSize: 52,
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    color: Colours.cream,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: Colours.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  verseCard: {
    backgroundColor: 'rgba(253, 248, 243, 0.12)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(200, 148, 58, 0.3)',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    color: Colours.goldLight,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: Colours.gold,
    letterSpacing: 1,
  },
  primaryButton: {
    backgroundColor: Colours.gold,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: Colours.goldLight,
    textDecorationLine: 'underline',
  },
});
