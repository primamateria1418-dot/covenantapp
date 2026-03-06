import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { Colours } from '@/constants/colours';
import { PromptBox } from '@/components/PromptBox';
import { DAILY_PROMPTS } from '@/constants/data';
import { useState } from 'react';

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [promptIndex, setPromptIndex] = useState(0);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;

  const handleRefreshPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

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

      <View style={[styles.moodRow]}>
        {['😔', '😐', '🙂', '😊', '😄'].map((emoji, i) => (
          <Text key={i} style={styles.moodEmoji}>{emoji}</Text>
        ))}
      </View>
      <Text style={[styles.moodLabel, { color: subColor }]}>
        Tap your mood to log it
      </Text>
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
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  moodEmoji: {
    fontSize: 36,
  },
  moodLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
});
