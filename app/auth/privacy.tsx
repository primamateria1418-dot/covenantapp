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
          We collect information you provide directly to us, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Email address and account credentials</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Your name and your spouse's name</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Wedding anniversary date</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Prayer journal entries</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Weekly check-in answers</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Journal letters to your spouse</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Marriage goals and bucket list items</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Photos and videos uploaded to Memory Lane</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>2. How We Use Your Information</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We use your information to provide, maintain, and improve our services:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• To connect you with your spouse on the platform</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• To send you requested notifications and reminders</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• To personalise your experience with relevant content</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• To track your check-in streak and provide insights</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• To display your progress in church leaderboards (if opted in)</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>3. Data Storage & Security</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Your data is stored securely using Supabase, a cloud database service with enterprise-grade security. All data is encrypted at rest and in transit.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          Your prayer content is never shared with anyone—including pastors, church administrators, or other couples. Your spiritual conversations remain private between you and your spouse.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>4. Data Sharing</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We do not sell your personal information to third parties. We only share your information in the following circumstances:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• With your spouse, to provide the core functionality of the app</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• With your church, if you voluntarily opt-in to the leaderboard (only your names and streak length are shown)</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• With service providers who help us operate the app (bound by confidentiality)</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• When required by law or to protect rights and safety</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>5. Church Leaderboard</Text>
        <Text style={[styles.body, { color: subColor }]}>
          The church leaderboard feature is entirely optional. When enabled, only the following information is visible to other couples at your church:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Your names (e.g., "John & Mary")</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Your check-in streak length</Text>
        </View>
        <Text style={[styles.body, { color: subColor }]}>
          You can enable or disable this feature at any time from your Profile settings. Your prayer content, journal entries, and other personal data are never shared.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>6. Your Rights (GDPR)</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Under the General Data Protection Regulation (GDPR), you have the following rights:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• <Text style={{ fontWeight: '700' }}>Right to Access</Text>: Request a copy of your personal data</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• <Text style={{ fontWeight: '700' }}>Right to Rectification</Text>: Request correction of inaccurate data</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• <Text style={{ fontWeight: '700' }}>Right to Erasure</Text>: Request deletion of your account and data</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• <Text style={{ fontWeight: '700' }}>Right to Data Portability</Text>: Request your data in a machine-readable format</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• <Text style={{ fontWeight: '700' }}>Right to Object</Text>: Object to processing of your data</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>7. Children's Privacy (COPPA)</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Covenant is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information without parental consent, please contact us, and we will delete such information.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          Users between 13 and 18 years old should have parental permission before using the app.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>8. Data Retention</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We retain your personal information for as long as your account is active or as needed to provide you services. When you request data deletion, we will delete your data within 48 hours, except where we are required to retain certain information for legal or accounting purposes.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>9. Contact Us</Text>
        <Text style={[styles.body, { color: subColor }]}>
          If you have questions about this Privacy Policy, want to exercise your rights, or need to request data deletion, please contact us at:
        </Text>
        <Text style={[styles.contact, { color: Colours.gold }]}>privacy@covenant.app</Text>
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
    gap: 16,
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
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  bulletList: {
    gap: 4,
    marginLeft: 4,
  },
  bullet: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  contact: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    marginTop: 8,
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
