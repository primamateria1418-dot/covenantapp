import { Tabs } from 'expo-router';
import { useColorScheme, Text } from 'react-native';
import { Colours } from '@/constants/colours';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tabBarBg = isDark ? Colours.darkCard : Colours.cream;
  const borderColor = isDark ? Colours.brownMid : '#e0d4c4';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colours.brownWarm,
        tabBarInactiveTintColor: isDark ? '#888' : '#999',
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Lato_400Regular',
          fontSize: 11,
          marginBottom: 2,
        },
        headerStyle: {
          backgroundColor: isDark ? Colours.darkCard : Colours.cream,
        },
        headerTintColor: isDark ? Colours.cream : Colours.brownDeep,
        headerTitleStyle: {
          fontFamily: 'CormorantGaramond_600SemiBold',
          fontSize: 22,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check-In',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✅" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🙏" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scripture"
        options={{
          title: 'Scripture',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📖" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="devotional"
        options={{
          title: 'Devotional',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌿" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
