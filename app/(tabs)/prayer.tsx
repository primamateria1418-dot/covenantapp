import { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';
import { TipBox } from '@/components/TipBox';

export default function PrayerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [hasPrayers, setHasPrayers] = useState(false);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  // Empty state for new users
  if (!hasPrayers) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={styles.emptyContainer}
      >
        <Text style={[styles.heading, { color: textColor }]}>Prayer</Text>
        <Text style={[styles.subheading, { color: subColor }]}>
          Pray together, stay together
        </Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕊️</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Your prayer journal is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: subColor }]}>
            What would you like to bring to God today?
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
            onPress={() => setHasPrayers(true)}
          >
            <Text style={styles.addButtonText}>Add Prayer Request</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.verseText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
            "Again, truly I tell you that if two of you on earth agree about anything they ask for,
            it will be done for them by my Father in heaven."
          </Text>
          <Text style={[styles.verseRef, { color: Colours.gold }]}>Matthew 18:19</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Prayer</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Pray together, stay together
      </Text>

      <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.verseText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "Again, truly I tell you that if two of you on earth agree about anything they ask for,
          it will be done for them by my Father in heaven."
        </Text>
        <Text style={[styles.verseRef, { color: Colours.gold }]}>Matthew 18:19</Text>
      </View>

      <TipBox
        tip="Pray together every day, even if just for a minute. It transforms your marriage."
        icon="🙏"
      />

      <Text style={[styles.sectionTitle, { color: textColor }]}>Prayer Requests</Text>
      <TouchableOpacity
        style={[styles.newPrayerButton, { borderColor: Colours.brownWarm }]}
        onPress={() => {}}
      >
        <Text style={[styles.newPrayerText, { color: Colours.brownWarm }]}>
          + Add New Prayer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  emptyContainer: {
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
  verseCard: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  verseText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 26,
  },
  verseRef: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  newPrayerButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  newPrayerText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  // Empty state styles
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 8,
  },
  addButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
});
