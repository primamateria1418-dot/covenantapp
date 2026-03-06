import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Lato_400Regular,
  Lato_700Bold,
  Lato_300Light,
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';
import { Colours } from '@/constants/colours';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Lato_400Regular,
    Lato_700Bold,
    Lato_300Light,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const headerBg = isDark ? Colours.darkCard : Colours.cream;
  const headerText = isDark ? Colours.cream : Colours.brownDeep;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: headerText,
          headerTitleStyle: {
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 20,
          },
          contentStyle: { backgroundColor: bgColor },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'Set Up Your Covenant' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Sign In', headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ title: 'Create Account', headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ title: 'Reset Password' }} />
        <Stack.Screen name="auth/privacy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="auth/terms" options={{ title: 'Terms of Service' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal' }} />
        <Stack.Screen name="timeline" options={{ title: 'Our Timeline' }} />
        <Stack.Screen name="bucketlist" options={{ title: 'Bucket List' }} />
        <Stack.Screen name="goals" options={{ title: 'Marriage Goals' }} />
        <Stack.Screen name="memory-lane" options={{ title: 'Memory Lane' }} />
      </Stack>
    </>
  );
}
