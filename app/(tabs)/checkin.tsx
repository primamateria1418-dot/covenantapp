import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';
import { PromptBox } from '@/components/PromptBox';
import { DAILY_PROMPTS } from '@/constants/data';

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [promptIndex, setPromptIndex] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const handleRefreshPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  const handleMoodSelect = (mood: number) => {
    setHasCheckedIn(true);
    // In a real app, this would save to Supabase
    console.log('Mood selected:', mood);
  };

  // Empty state for new users
  if (!hasCheckedIn) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌅</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Your first check-in is waiting
          </Text>
          <Text style={[styles.emptySubtitle, { color: subColor }]}>
            It only takes 5 minutes
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: Colours.brownWarm }]}
            onPress={() => setHasCheckedIn(true)}
          >
            <Text style={styles.startButtonText}>Start Check-In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Daily Check-In</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        How is your heart today?
      </Text>

      <PromptBox
        prompt={DAILY_PROMPTS[promptIndex]}
        onRefresh={handleRefreshPrompt}
      />

      <Text style={[styles.moodTitle, { color: textColor }]}>Your Mood</Text>
      <View style={[styles.moodRow]}>
        {[
          { emoji: '😔', mood: 1, label: 'Heavy' },
          { emoji: '😐', mood: 2, label: 'Neutral' },
          { emoji: '🙂', mood: 3, label: 'Good' },
          { emoji: '😊', mood: 4, label: 'Great' },
          { emoji: '😄', mood: 5, label: 'Amazing' },
        ].map((item) => (
          <TouchableOpacity
            key={item.mood}
            style={styles.moodItem}
            onPress={() => handleMoodSelect(item.mood)}
          >
            <Text style={styles.moodEmoji}>{item.emoji}</Text>
            <Text style={[styles.moodLabel, { color: subColor }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.tipCard, { backgroundColor: cardBg }]}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={[styles.tipText, { color: subColor }]}>
          Tip: Regular check-ins help you stay connected and identify patterns in your relationship.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    marginBottom: 8,
  },
  moodTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  moodItem: {
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  startButtonText: {
    color: Colours.cream,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
});
