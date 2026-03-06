import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { Colours } from '@/constants/colours';

interface PromptBoxProps {
  prompt: string;
  onRefresh?: () => void;
}

export function PromptBox({ prompt, onRefresh }: PromptBoxProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? Colours.darkCard : Colours.goldLight,
          borderColor: Colours.gold,
        },
      ]}
    >
      <Text style={[styles.label, { color: Colours.gold }]}>Today's Prompt</Text>
      <Text
        style={[
          styles.prompt,
          { color: isDark ? Colours.cream : Colours.brownDeep },
        ]}
      >
        {prompt}
      </Text>
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: Colours.brownWarm }]}>
            New Prompt ↻
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  refreshButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
