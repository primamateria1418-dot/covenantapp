import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';

export default function MemoryLaneScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Memory Lane</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Cherish every moment together
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colours.brownWarm }]}
        >
          <Text style={styles.actionButtonText}>📷 Add Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colours.brownMid }]}
        >
          <Text style={styles.actionButtonText}>🎥 Add Video</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.emptyState, { borderColor: isDark ? Colours.brownMid : '#d4c4b0' }]}>
        <Text style={styles.emptyEmoji}>🖼️</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          Your memories live here
        </Text>
        <Text style={[styles.emptyText, { color: subColor }]}>
          Add photos and videos to preserve your most precious moments together.
        </Text>
      </View>

      <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.verseText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "I thank my God every time I remember you."
        </Text>
        <Text style={[styles.verseRef, { color: Colours.gold }]}>Philippians 1:3</Text>
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  verseCard: {
    borderRadius: 12,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  verseText: {
    fontSize: 17,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 26,
    textAlign: 'center',
  },
  verseRef: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
});
