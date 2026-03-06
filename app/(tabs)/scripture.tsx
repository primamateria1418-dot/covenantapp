import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Colours } from '@/constants/colours';
import { SCRIPTURE_VERSES } from '@/constants/data';

export default function ScriptureScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const verse = SCRIPTURE_VERSES[currentIndex];

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SCRIPTURE_VERSES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SCRIPTURE_VERSES.length) % SCRIPTURE_VERSES.length);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Scripture</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        God's Word for your marriage
      </Text>

      <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.verseText, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
          "{verse.text}"
        </Text>
        <Text style={[styles.verseRef, { color: Colours.gold }]}>
          — {verse.reference}
        </Text>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: isDark ? Colours.darkCard : '#f0ebe3' }]}
          onPress={handlePrev}
        >
          <Text style={[styles.navButtonText, { color: Colours.brownWarm }]}>← Previous</Text>
        </TouchableOpacity>
        <Text style={[styles.counter, { color: subColor }]}>
          {currentIndex + 1} / {SCRIPTURE_VERSES.length}
        </Text>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: isDark ? Colours.darkCard : '#f0ebe3' }]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, { color: Colours.brownWarm }]}>Next →</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>All Verses</Text>
      {SCRIPTURE_VERSES.map((v, i) => (
        <TouchableOpacity
          key={v.id}
          style={[
            styles.verseListItem,
            {
              backgroundColor: i === currentIndex
                ? (isDark ? Colours.brownMid : Colours.goldLight)
                : (isDark ? Colours.darkCard : '#fff'),
            },
          ]}
          onPress={() => setCurrentIndex(i)}
        >
          <Text style={[styles.verseListRef, { color: Colours.gold }]}>{v.reference}</Text>
          <Text
            style={[styles.verseListText, { color: textColor }]}
            numberOfLines={2}
          >
            {v.text}
          </Text>
        </TouchableOpacity>
      ))}
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
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verseText: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 32,
    textAlign: 'center',
  },
  verseRef: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  counter: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  verseListItem: {
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  verseListRef: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  verseListText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
});
