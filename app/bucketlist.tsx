import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Colours } from '@/constants/colours';

const SAMPLE_ITEMS = [
  { id: '1', text: 'Renew our vows on our 10th anniversary', done: false },
  { id: '2', text: 'Travel to the Holy Land together', done: false },
  { id: '3', text: 'Plant a garden together', done: true },
  { id: '4', text: 'Read the Bible cover to cover as a couple', done: false },
];

export default function BucketListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [items, setItems] = useState(SAMPLE_ITEMS);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completed = items.filter((i) => i.done).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Bucket List</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Dreams to chase together
      </Text>

      <View style={[styles.progressCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.progressText, { color: Colours.gold }]}>
          {completed} / {items.length} completed
        </Text>
        <View style={[styles.progressBar, { backgroundColor: isDark ? Colours.brownMid : '#e0d4c4' }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: Colours.gold,
                width: `${(completed / items.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
      >
        <Text style={styles.addButtonText}>+ Add Dream</Text>
      </TouchableOpacity>

      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, { backgroundColor: cardBg }]}
          onPress={() => toggleItem(item.id)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: item.done ? Colours.gold : 'transparent',
                borderColor: item.done ? Colours.gold : (isDark ? Colours.brownMid : '#d4c4b0'),
              },
            ]}
          >
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text
            style={[
              styles.itemText,
              {
                color: item.done ? subColor : textColor,
                textDecorationLine: item.done ? 'line-through' : 'none',
              },
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
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
  progressCard: {
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
  item: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: Colours.cream,
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
});
