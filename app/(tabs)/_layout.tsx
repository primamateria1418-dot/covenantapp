import { useEffect, useState } from 'react';
import { useColorScheme, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Colours } from '@/constants/colours';
import { getSession, getProfile } from '@/lib/supabase';
import { checkAnniversary } from '@/components/AnniversaryCelebration';
import { SCRIPTURE_VERSES } from '@/constants/data';

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

  const [showAnniversary, setShowAnniversary] = useState(false);
  const [anniversaryData, setAnniversaryData] = useState<{
    isAnniversary: boolean;
    yearsMarried: number;
    name1: string;
    name2: string;
  } | null>(null);

  const tabBarBg = isDark ? Colours.darkCard : Colours.cream;
  const borderColor = isDark ? Colours.brownMid : '#e0d4c4';
  const textColor = isDark ? Colours.cream : Colours.brownDeep;

  useEffect(() => {
    async function checkAnniversaryDate() {
      try {
        const { session } = await getSession();
        if (!session) return;

        const { profile } = await getProfile(session.user.id);
        if (!profile || !profile.name) return;

        const anniversaryResult = checkAnniversary(profile.wedding_date);
        
        if (anniversaryResult && anniversaryResult.isAnniversary) {
          setAnniversaryData({
            isAnniversary: true,
            yearsMarried: anniversaryResult.yearsMarried,
            name1: profile.name,
            name2: profile.spouse_name || 'Partner',
          });
          // Show the celebration (could be a modal in real implementation)
          setShowAnniversary(true);
        }
      } catch (error) {
        console.warn('Error checking anniversary:', error);
      }
    }

    checkAnniversaryDate();
  }, []);

  const handleDismissAnniversary = () => {
    setShowAnniversary(false);
  };

  return (
    <>
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
          headerTintColor: textColor,
          headerTitleStyle: {
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 22,
          },
          headerShadowVisible: false,
          headerRight: () => 
            anniversaryData?.isAnniversary && !showAnniversary ? (
              <TouchableOpacity
                style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => setShowAnniversary(true)}
              >
                <Text>💍</Text>
                <Text style={{ color: Colours.gold, fontSize: 12, fontFamily: 'Lato_700Bold' }}>
                  Anniversary
                </Text>
              </TouchableOpacity>
            ) : null,
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

      {/* Anniversary Celebration Modal */}
      {showAnniversary && anniversaryData && (
        <View style={StyleSheet.absoluteFill}>
          {/* Import and render the celebration inline since we can't do conditional imports */}
          <AnniversaryOverlay
            name1={anniversaryData.name1}
            name2={anniversaryData.name2}
            yearsMarried={anniversaryData.yearsMarried}
            onDismiss={handleDismissAnniversary}
          />
        </View>
      )}
    </>
  );
}

// Inline anniversary overlay component
function AnniversaryOverlay({
  name1,
  name2,
  yearsMarried,
  onDismiss,
}: {
  name1: string;
  name2: string;
  yearsMarried: number;
  onDismiss: () => void;
}) {
  const verse = SCRIPTURE_VERSES[Math.floor(Math.random() * SCRIPTURE_VERSES.length)];

  return (
    <View style={{
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#3d1f0f',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <View style={{
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
      }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💍💍</Text>
        
        <Text style={{
          fontSize: 36,
          fontFamily: 'CormorantGaramond_700Bold',
          color: Colours.gold,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Happy Anniversary!
        </Text>
        
        <Text style={{
          fontSize: 56,
          fontFamily: 'CormorantGaramond_700Bold_Italic',
          color: Colours.cream,
          marginBottom: 8,
        }}>
          {yearsMarried} {yearsMarried === 1 ? 'Year' : 'Years'}
        </Text>
        
        <Text style={{
          fontSize: 20,
          fontFamily: 'CormorantGaramond_600SemiBold',
          color: Colours.goldLight,
          marginBottom: 32,
        }}>
          {name1} & {name2}
        </Text>

        <View style={{
          backgroundColor: 'rgba(253, 248, 243, 0.12)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: 'rgba(200, 148, 58, 0.3)',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 15,
            fontFamily: 'CormorantGaramond_400Regular_Italic',
            color: Colours.goldLight,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 12,
          }}>
            "{verse.text}"
          </Text>
          <Text style={{
            fontSize: 13,
            fontFamily: 'Lato_700Bold',
            color: Colours.gold,
            letterSpacing: 1,
          }}>
            {verse.reference}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: Colours.gold,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 30,
          }}
          onPress={onDismiss}
        >
          <Text style={{
            fontSize: 17,
            fontFamily: 'Lato_700Bold',
            color: Colours.brownDeep,
          }}>
            Celebrate Together 🎉
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
