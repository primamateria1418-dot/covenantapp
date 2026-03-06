import { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';

export default function IndexScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Redirect to tabs after a brief splash
    const timer = setTimeout(() => {
      router.replace('/(tabs)/checkin');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? Colours.darkBg : Colours.cream },
      ]}
    >
      <Text style={[styles.title, { color: Colours.gold }]}>Covenant</Text>
      <Text style={[styles.subtitle, { color: isDark ? Colours.goldLight : Colours.brownMid }]}>
        A Christian Marriage App
      </Text>
      <ActivityIndicator
        style={styles.loader}
        color={Colours.gold}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 48,
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato_300Light',
    letterSpacing: 1,
  },
  loader: {
    marginTop: 32,
  },
});
