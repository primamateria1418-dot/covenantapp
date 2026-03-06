import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { Colours } from '@/constants/colours';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: Colours.brownWarm }]}>
          <Text style={styles.avatarText}>👫</Text>
        </View>
        <Text style={[styles.name, { color: textColor }]}>Your Names</Text>
        <Text style={[styles.date, { color: Colours.gold }]}>
          Married · DD/MM/YYYY
        </Text>
      </View>

      <View style={[styles.statsRow]}>
        {[
          { label: 'Days Together', value: '—' },
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
        { label: '📔 Journal', route: '/journal' },
        { label: '📅 Our Timeline', route: '/timeline' },
        { label: '🪣 Bucket List', route: '/bucketlist' },
        { label: '🎯 Marriage Goals', route: '/goals' },
        { label: '🖼️ Memory Lane', route: '/memory-lane' },
      ].map((item) => (
        <TouchableOpacity
          key={item.route}
          style={[styles.linkItem, { backgroundColor: cardBg }]}
        >
          <Text style={[styles.linkText, { color: textColor }]}>{item.label}</Text>
          <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.signOutButton, { borderColor: Colours.brownWarm }]}>
        <Text style={[styles.signOutText, { color: Colours.brownWarm }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
