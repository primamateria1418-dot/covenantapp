import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Colours } from '@/constants/colours';

type GoalCategory = 'spiritual' | 'relational' | 'financial' | 'family';

interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  progress: number;
  target: number;
}

const SAMPLE_GOALS: Goal[] = [
  { id: '1', title: 'Read the Bible together daily', category: 'spiritual', progress: 12, target: 30 },
  { id: '2', title: 'Weekly date nights', category: 'relational', progress: 3, target: 12 },
  { id: '3', title: 'Save for family holiday', category: 'financial', progress: 40, target: 100 },
];

const CATEGORY_COLOURS: Record<GoalCategory, string> = {
  spiritual: Colours.greenDeep,
  relational: Colours.brownWarm,
  financial: Colours.gold,
  family: Colours.purple,
};

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  spiritual: '✝️ Spiritual',
  relational: '❤️ Relational',
  financial: '💰 Financial',
  family: '👨‍👩‍👧 Family',
};

export default function GoalsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [goals] = useState(SAMPLE_GOALS);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.heading, { color: textColor }]}>Marriage Goals</Text>
      <Text style={[styles.subheading, { color: subColor }]}>
        Growing together with intention
      </Text>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
      >
        <Text style={styles.addButtonText}>+ Add Goal</Text>
      </TouchableOpacity>

      {goals.map((goal) => {
        const pct = Math.round((goal.progress / goal.target) * 100);
        const catColor = CATEGORY_COLOURS[goal.category];
        return (
          <View key={goal.id} style={[styles.goalCard, { backgroundColor: cardBg }]}>
            <View style={styles.goalHeader}>
              <Text style={[styles.categoryBadge, { color: catColor }]}>
                {CATEGORY_LABELS[goal.category]}
              </Text>
              <Text style={[styles.pctText, { color: catColor }]}>{pct}%</Text>
            </View>
            <Text style={[styles.goalTitle, { color: textColor }]}>{goal.title}</Text>
            <View style={[styles.progressBar, { backgroundColor: isDark ? Colours.brownMid : '#e0d4c4' }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: catColor, width: `${pct}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: subColor }]}>
              {goal.progress} / {goal.target}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 14,
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
  goalCard: {
    borderRadius: 14,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  pctText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  goalTitle: {
    fontSize: 17,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 24,
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
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
});
