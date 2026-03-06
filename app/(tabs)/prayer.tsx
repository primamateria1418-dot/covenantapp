import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { Colours } from '@/constants/colours';
import { TipBox } from '@/components/TipBox';

export default function PrayerScreen() {
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
      <View style={[styles.emptyState, { borderColor: isDark ? Colours.brownMid : '#d4c4b0' }]}>
        <Text style={styles.emptyEmoji}>🕊️</Text>
        <Text style={[styles.emptyText, { color: subColor }]}>
          No prayer requests yet.{'\n'}Add your first prayer request.
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
