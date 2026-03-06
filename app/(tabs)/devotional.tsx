import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';
import { DEVOTIONAL_TOPICS, MARRIAGE_TIPS } from '@/constants/data';
import { TipBox } from '@/components/TipBox';

export default function DevotionalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const todayTip = MARRIAGE_TIPS[new Date().getDay() % MARRIAGE_TIPS.length];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Devotional</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Grow together in faith
      </Text>

      <TipBox tip={todayTip} icon="🌿" />

      <Text style={[styles.sectionTitle, { color: textColor }]}>Topics</Text>
      <View style={styles.topicsGrid}>
        {DEVOTIONAL_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[styles.topicCard, { backgroundColor: cardBg }]}
          >
            <Text style={styles.topicIcon}>{topic.icon}</Text>
            <Text style={[styles.topicTitle, { color: textColor }]}>{topic.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>Today's Reading</Text>
      <View style={[styles.readingCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.readingTitle, { color: Colours.gold }]}>
          Building a Christ-Centred Home
        </Text>
        <Text style={[styles.readingText, { color: subColor }]}>
          "Unless the Lord builds the house, the builders labour in vain." — Psalm 127:1
        </Text>
        <Text style={[styles.readingBody, { color: textColor }]}>
          Every marriage is a covenant — not just between two people, but with God as the
          foundation. When we invite Christ into the centre of our home, we build on a rock
          that cannot be shaken. Today, reflect on how you can make God the cornerstone of
          your daily life together.
        </Text>
        <TouchableOpacity
          style={[styles.readButton, { backgroundColor: Colours.brownWarm }]}
        >
          <Text style={styles.readButtonText}>Continue Reading →</Text>
        </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topicIcon: {
    fontSize: 28,
  },
  topicTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  readingCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  readingTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  readingText: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 22,
  },
  readingBody: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 24,
  },
  readButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  readButtonText: {
    color: Colours.cream,
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
});
