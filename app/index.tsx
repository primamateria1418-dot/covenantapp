import { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';
import { getSession, getProfile } from '@/lib/supabase';

export default function IndexScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    async function checkAuth() {
      try {
        const { session } = await getSession();

        if (!session) {
          // No session — go to login
          router.replace('/auth/login');
          return;
        }

        // Session exists — check if profile/setup is complete
        const { profile } = await getProfile(session.user.id);

        if (!profile || !profile.name) {
          // No profile yet — go to setup
          router.replace('/setup');
        } else {
          // All good — go to main app
          router.replace('/(tabs)/checkin');
        }
      } catch {
        // On any error, fall back to login
        router.replace('/auth/login');
      }
    }

    checkAuth();
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
