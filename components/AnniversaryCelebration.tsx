import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { SCRIPTURE_VERSES } from '@/constants/data';

interface AnniversaryCelebrationProps {
  name1: string;
  name2: string;
  yearsMarried: number;
  onDismiss: () => void;
}

export function AnniversaryCelebration({
  name1,
  name2,
  yearsMarried,
  onDismiss,
}: AnniversaryCelebrationProps) {
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Random verse for the celebration
  const verse = SCRIPTURE_VERSES[Math.floor(Math.random() * SCRIPTURE_VERSES.length)];

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation loop
    Animated.loop(
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confettiTranslate = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, Dimensions.get('window').height + 100],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3d1f0f', '#5a3020', '#6b3322']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Confetti */}
      {[...Array(20)].map((_, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.confetti,
            {
              left: `${Math.random() * 100}%`,
              transform: [{ translateY: confettiTranslate }, { rotate: `${Math.random() * 360}deg` }],
              opacity: confettiAnim,
              fontSize: 16 + Math.random() * 16,
            },
          ]}
        >
          {['💛', '💍', '❤️', '✨', '🌟', '🤍', '💝', '🎉'][i % 8]}
        </Animated.Text>
      ))}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.celebrationEmoji}>💍💍</Text>
        
        <Text style={styles.title}>Happy Anniversary!</Text>
        
        <Text style={styles.years}>
          {yearsMarried} {yearsMarried === 1 ? 'Year' : 'Years'}
        </Text>
        
        <Text style={styles.names}>
          {name1} & {name2}
        </Text>

        <View style={styles.verseCard}>
          <Text style={styles.verseText}>"{verse.text}"</Text>
          <Text style={styles.verseRef}>{verse.reference}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onDismiss}
        >
          <Text style={styles.buttonText}>Celebrate Together 🎉</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Helper to check if today is anniversary
export function checkAnniversary(weddingDate: string | null): { isAnniversary: boolean; yearsMarried: number } | null {
  if (!weddingDate) return null;

  try {
    const [day, month, year] = weddingDate.split('/').map(Number);
    if (!day || !month || !year) return null;

    const today = new Date();

    // Check if today matches anniversary (month and day)
    if (today.getMonth() === month - 1 && today.getDate() === day) {
      const yearsMarried = today.getFullYear() - year;
      return { isAnniversary: true, yearsMarried };
    }

    return null;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.gold,
    textAlign: 'center',
    marginBottom: 8,
  },
  years: {
    fontSize: 56,
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    color: Colours.cream,
    marginBottom: 8,
  },
  names: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colours.goldLight,
    marginBottom: 32,
  },
  verseCard: {
    backgroundColor: 'rgba(253, 248, 243, 0.12)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(200, 148, 58, 0.3)',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 15,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    color: Colours.goldLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: Colours.gold,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colours.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
  },
});
