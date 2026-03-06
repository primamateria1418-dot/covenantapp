import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const milestones = [
    { emoji: '💍', label: 'Engagement', date: 'Add date' },
    { emoji: '⛪', label: 'Wedding Day', date: 'Add date' },
    { emoji: '🏠', label: 'First Home', date: 'Add date' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Our Timeline</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Every chapter of your story
      </Text>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
      >
        <Text style={styles.addButtonText}>+ Add Milestone</Text>
      </TouchableOpacity>

      <View style={styles.timeline}>
        {milestones.map((m, i) => (
          <View key={i} style={styles.milestoneRow}>
            <View style={styles.timelineLeft}>
              <View style={[styles.dot, { backgroundColor: Colours.gold }]} />
              {i < milestones.length - 1 && (
                <View style={[styles.line, { backgroundColor: isDark ? Colours.brownMid : '#d4c4b0' }]} />
              )}
            </View>
            <View style={[styles.milestoneCard, { backgroundColor: cardBg }]}>
              <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
              <View>
                <Text style={[styles.milestoneLabel, { color: textColor }]}>{m.label}</Text>
                <Text style={[styles.milestoneDate, { color: Colours.gold }]}>{m.date}</Text>
              </View>
            </View>
          </View>
        ))}
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
  addButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  timeline: {
    gap: 0,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -4,
  },
  milestoneCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneLabel: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  milestoneDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
});
