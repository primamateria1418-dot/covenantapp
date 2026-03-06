import { ScrollView, View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';

export default function PrivacyPolicyScreen() {
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
      <Text style={[styles.title, { color: Colours.gold }]}>Privacy Policy</Text>
      <Text style={[styles.updated, { color: subColor }]}>Last updated: March 2026</Text>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>1. Information We Collect</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We collect information you provide directly to us, such as your name, email address, and
          marriage details when you create an account or use our services.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>2. How We Use Your Information</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We use the information we collect to provide, maintain, and improve our services, send you
          notifications you've requested, and personalise your experience.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>3. Data Storage</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Your data is stored securely using Supabase. We do not sell your personal information to
          third parties.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>4. Your Rights</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You may request deletion of your account and associated data at any time by contacting us.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>5. Contact</Text>
        <Text style={[styles.body, { color: subColor }]}>
          If you have questions about this Privacy Policy, please contact us at support@covenant.app
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colours.brownWarm }]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 1,
  },
  updated: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
});
