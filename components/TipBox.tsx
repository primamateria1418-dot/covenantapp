import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colours } from '@/constants/colours';

interface TipBoxProps {
  tip: string;
  icon?: string;
}

export function TipBox({ tip, icon = '💡' }: TipBoxProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? Colours.darkCard : '#f0ebe3',
          borderLeftColor: Colours.brownWarm,
        },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: Colours.brownWarm }]}>
          Marriage Tip
        </Text>
        <Text
          style={[
            styles.tip,
            { color: isDark ? Colours.cream : Colours.brownDeep },
          ]}
        >
          {tip}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 14,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    fontSize: 22,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
  },
});
