import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';
import { PromptBox } from '@/components/PromptBox';
import { DAILY_PROMPTS } from '@/constants/data';
import { useState } from 'react';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [promptIndex, setPromptIndex] = useState(0);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Journal</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Record your heart's journey
      </Text>

      <PromptBox
        prompt={DAILY_PROMPTS[promptIndex]}
        onRefresh={() => setPromptIndex((p) => (p + 1) % DAILY_PROMPTS.length)}
      />

      <TouchableOpacity
        style={[styles.newEntryButton, { backgroundColor: Colours.brownWarm }]}
      >
        <Text style={styles.newEntryText}>+ New Entry</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: textColor }]}>Past Entries</Text>
      <View style={[styles.emptyState, { borderColor: isDark ? Colours.brownMid : '#d4c4b0' }]}>
        <Text style={styles.emptyEmoji}>📔</Text>
        <Text style={[styles.emptyText, { color: subColor }]}>
          Your journal is empty.{'\n'}Write your first entry today.
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
  newEntryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newEntryText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
