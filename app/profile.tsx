import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Colours } from '@/constants/colours';
import { signOut, getSession, getProfile } from '@/lib/supabase';

type Profile = {
  id: string;
  name: string;
  spouse_name: string | null;
  wedding_date: string | null;
  avatar_url: string | null;
  created_at: string;
};

function getDaysTogether(weddingDate: string | null): string {
  if (!weddingDate) return '—';
  // Support DD/MM/YYYY or YYYY-MM-DD
  let date: Date;
  if (weddingDate.includes('/')) {
    const [day, month, year] = weddingDate.split('/');
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(weddingDate);
  }
  if (isNaN(date.getTime())) return '—';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff.toLocaleString() : '—';
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  useEffect(() => {
    async function loadProfile() {
      try {
        const { session } = await getSession();
        if (!session) {
          router.replace('/auth/login');
          return;
        }
        const { profile: p } = await getProfile(session.user.id);
        setProfile(p);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/auth/login');
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const displayName = profile
    ? profile.spouse_name
      ? `${profile.name} & ${profile.spouse_name}`
      : profile.name
    : 'Your Names';

  const weddingDisplay = profile?.wedding_date
    ? `Married · ${profile.wedding_date}`
    : 'Married · —';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator color={Colours.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: Colours.brownWarm }]}>
          <Text style={styles.avatarText}>👫</Text>
        </View>
        <Text style={[styles.name, { color: textColor }]}>{displayName}</Text>
        <Text style={[styles.date, { color: Colours.gold }]}>{weddingDisplay}</Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Days Together', value: getDaysTogether(profile?.wedding_date ?? null) },
          { label: 'Prayers', value: '0' },
          { label: 'Journal Entries', value: '0' },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statValue, { color: Colours.gold }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Links</Text>
      {[
        { label: '📔 Journal', route: '/journal' as const },
        { label: '📅 Our Timeline', route: '/timeline' as const },
        { label: '🪣 Bucket List', route: '/bucketlist' as const },
        { label: '🎯 Marriage Goals', route: '/goals' as const },
        { label: '🖼️ Memory Lane', route: '/memory-lane' as const },
        { label: '🎁 Time Capsule', route: '/time-capsule' as const },
      ].map((item) => (
        <Link key={item.route} href={item.route} asChild>
          <TouchableOpacity style={[styles.linkItem, { backgroundColor: cardBg }]}>
            <Text style={[styles.linkText, { color: textColor }]}>{item.label}</Text>
            <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
          </TouchableOpacity>
        </Link>
      ))}

      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: Colours.brownWarm }]}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Text style={[styles.signOutText, { color: Colours.brownWarm }]}>
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  linkItem: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  linkArrow: {
    fontSize: 16,
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
});
