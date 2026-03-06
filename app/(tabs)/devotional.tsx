import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { getTodayDevotional, CUSTOM_PLANS, Devotional, CustomPlan } from '@/constants/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DevotionalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  // Get today's devotional
  const todayDevotional = getTodayDevotional();
  const [currentDevotional] = useState<Devotional>(todayDevotional);
  const [currentDay] = useState(todayDevotional.day);
  const [streak, setStreak] = useState(3); // Simulated streak
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration] = useState(180000); // 3 minutes simulated duration
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showPaywall, setShowPaywall] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Animation
  const celebrationScale = useRef(new Animated.Value(0)).current;

  // Audio on cleanup
  useEffect(() => {
    return () => {
      // Cleanup audio resources if needed
    };
  }, []);

  // Simulated audio loading (since we don't have actual audio files)
  const handlePlayPause = async () => {
    // In production, this would load and play actual TTS audio
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Simulate playback progress
      const interval = setInterval(() => {
        setPlaybackPosition((prev) => {
          const newPosition = prev + 1000;
          if (newPosition >= playbackDuration && playbackDuration > 0) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return newPosition;
        });
      }, 1000 / playbackSpeed);
    }
  };

  const handleSpeedToggle = () => {
    setPlaybackSpeed((prev) => (prev === 1.0 ? 1.5 : 1.0));
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    setShowCelebration(true);
    setStreak((prev) => prev + 1);
    
    // Animate celebration
    Animated.sequence([
      Animated.spring(celebrationScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.delay(1500),
      Animated.timing(celebrationScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowCelebration(false));
  };

  const handlePlanSelect = (plan: CustomPlan) => {
    if (plan.free) {
      // Start the free plan
      setSelectedPlan(plan.id);
    } else {
      setShowPaywall(true);
    }
  };

  const getProgress = () => {
    if (playbackDuration > 0) {
      return playbackPosition / playbackDuration;
    }
    return 0;
  };

  // Format time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: Colours.gold }]}>TODAY'S</Text>
        <Text style={[styles.heading, { color: textColor }]}>Devotional Together</Text>
      </View>

      {/* Streak Counter */}
      <View style={styles.streakContainer}>
        <Text style={styles.streakText}>🔥 {streak} day streak</Text>
      </View>

      {/* Seasonal Banner */}
      {currentDevotional.isSeasonal && (
        <View style={[styles.seasonalBanner, { backgroundColor: Colours.greenDeep }]}>
          <Text style={styles.seasonalText}>{currentDevotional.seasonalName} Devotional</Text>
        </View>
      )}

      {/* Main Devotional Card */}
      <View style={[styles.devotionalCard, { backgroundColor: cardBg }]}>
        {/* Audio Player (Premium) */}
        <View style={styles.audioSection}>
          <View style={styles.listenLabel}>
            <Text style={styles.listenIcon}>🎧</Text>
            <Text style={[styles.listenText, { color: Colours.purple }]}>Listen Together</Text>
          </View>
          
          <View style={styles.audioPlayer}>
            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: Colours.purple }]}
              onPress={handlePlayPause}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: Colours.purple,
                      width: `${getProgress() * 100}%` 
                    }
                  ]} 
                />
              </View>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: subColor }]}>{formatTime(playbackPosition)}</Text>
                <Text style={[styles.timeText, { color: subColor }]}>{formatTime(playbackDuration || 180000)}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.speedButton, { borderColor: Colours.purple }]}
              onPress={handleSpeedToggle}
            >
              <Text style={[styles.speedText, { color: Colours.purple }]}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Green Banner */}
        <LinearGradient
          colors={[Colours.greenDeep, '#1e4a20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greenBanner}
        >
          <Text style={styles.dayLabel}>DAY {currentDay} OF 30 · {currentDevotional.theme}</Text>
          <Text style={styles.devotionalTitle}>{currentDevotional.title}</Text>
          <View style={styles.verseBox}>
            <Text style={styles.verseText}>{currentDevotional.verse}</Text>
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={styles.bodySection}>
          {/* Reading */}
          {currentDevotional.reading.map((paragraph, index) => (
            <Text key={index} style={[styles.readingText, { color: textColor }]}>
              {paragraph}
            </Text>
          ))}

          {/* Discuss Together */}
          <Text style={[styles.discussHeading, { color: Colours.gold }]}>Discuss Together</Text>
          
          {currentDevotional.discussions.map((discussion, index) => (
            <View 
              key={index} 
              style={[
                styles.discussionCard, 
                { 
                  backgroundColor: isDark ? '#2a1a14' : '#fff8f0',
                  borderLeftColor: Colours.gold 
                }
              ]}
            >
              <Text style={[styles.discussionQuestion, { color: Colours.gold }]}>{discussion.question}</Text>
              <Text style={[styles.discussionPrompt, { color: textColor }]}>{discussion.prompt}</Text>
            </View>
          ))}

          {/* Prayer Box */}
          <LinearGradient
            colors={['#5a4575', Colours.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.prayerBox}
          >
            <Text style={styles.prayerLabel}>PRAY TOGETHER</Text>
            <Text style={styles.prayerText}>{currentDevotional.prayer}</Text>
          </LinearGradient>

          {/* Mark as Complete Button */}
          <TouchableOpacity
            style={[
              styles.completeButton, 
              { backgroundColor: isCompleted ? Colours.greenDeep : Colours.brownWarm }
            ]}
            onPress={handleMarkComplete}
            disabled={isCompleted}
          >
            <Text style={styles.completeButtonText}>
              {isCompleted ? '✓ Completed!' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Plans Section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Custom Plans</Text>
      <View style={styles.plansContainer}>
        {CUSTOM_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { backgroundColor: cardBg },
              plan.free && styles.planCardFree
            ]}
            onPress={() => handlePlanSelect(plan)}
          >
            <Text style={styles.planIcon}>{plan.icon}</Text>
            <Text style={[styles.planTitle, { color: textColor }]}>{plan.title}</Text>
            <Text style={[styles.planDays, { color: subColor }]}>{plan.days} days</Text>
            {!plan.free && (
              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>🔒</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Celebration Modal */}
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <Animated.View 
            style={[
              styles.celebrationModal,
              { transform: [{ scale: celebrationScale }] }
            ]}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Amazing!</Text>
            <Text style={styles.celebrationText}>
              Day {currentDay} complete!{'\n'}
              Keep your {streak} day streak going!
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.paywallOverlay}>
          <View style={[styles.paywallModal, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallEmoji}>💜</Text>
            <Text style={[styles.paywallTitle, { color: textColor }]}>Premium Content</Text>
            <Text style={[styles.paywallText, { color: subColor }]}>
              This plan is available with Covenant Premium. Unlock access to all custom plans, exclusive content, and more!
            </Text>
            <TouchableOpacity 
              style={[styles.paywallButton, { backgroundColor: Colours.purple }]}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.paywallButtonText}>Unlock Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywall(false)}>
              <Text style={[styles.paywallClose, { color: subColor }]}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 2,
    marginBottom: 2,
  },
  heading: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  streakContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 148, 58, 0.15)',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: Colours.gold,
  },
  seasonalBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  seasonalText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: Colours.goldLight,
    textAlign: 'center',
    letterSpacing: 1,
  },
  devotionalCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  audioSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listenLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  listenIcon: {
    fontSize: 18,
  },
  listenText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  speedText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  greenBanner: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: Colours.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  devotionalTitle: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.cream,
    marginBottom: 12,
  },
  verseBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 14,
  },
  verseText: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  bodySection: {
    padding: 20,
    gap: 16,
  },
  readingText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 24,
  },
  discussHeading: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
    marginBottom: 4,
  },
  discussionCard: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 14,
    marginVertical: 6,
  },
  discussionQuestion: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  discussionPrompt: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 21,
  },
  prayerBox: {
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  prayerLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  prayerText: {
    fontSize: 15,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    color: Colours.cream,
    lineHeight: 24,
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 16,
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  planCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  planCardFree: {
    borderWidth: 1.5,
    borderColor: Colours.gold,
  },
  planIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  planDays: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockText: {
    fontSize: 14,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationModal: {
    backgroundColor: Colours.cream,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.brownDeep,
    marginBottom: 8,
  },
  celebrationText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
    textAlign: 'center',
    lineHeight: 22,
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallModal: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  paywallEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 12,
  },
  paywallText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  paywallButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 12,
  },
  paywallButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  paywallClose: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
});
