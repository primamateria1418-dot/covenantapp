import { ScrollView, View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';

export default function TermsOfServiceScreen() {
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
      <Text style={[styles.title, { color: Colours.gold }]}>Terms of Service</Text>
      <Text style={[styles.updated, { color: subColor }]}>Last updated: March 2026</Text>

      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.body, { color: subColor }]}>
          By accessing or using Covenant ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          We may update these terms from time to time. Your continued use of the App after any changes constitutes acceptance of the new terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>2. Eligibility</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You must be at least 18 years old to use Covenant. If you are between 16 and 18 years old, you must have parental or guardian consent to use the App.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          Covenant is designed specifically for married couples. You agree to use the App only if you are in a marriage relationship.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>3. Use of Service</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Covenant is provided for personal, non-commercial use by married couples to strengthen their marriage through prayer, communication, and shared spiritual growth.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          You agree to use the App only for lawful purposes and in accordance with these terms. You shall not:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Use the App in any way that violates any applicable law or regulation</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Attempt to gain unauthorized access to any part of the App</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Use the App to harass, abuse, or harm others</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Submit false or misleading information</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Use the App for any commercial or promotional purpose without our written consent</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>4. Account Responsibilities</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You are responsible for maintaining the confidentiality of your account credentials (email and password). You agree to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Provide accurate and complete information when creating your account</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Keep your password secure and not share it with others</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Accept responsibility for all activities that occur under your account</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Notify us immediately of any unauthorized use of your account</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>5. Content You Create</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You retain ownership of all content you create within the App, including prayers, journal entries, letters to your spouse, photos, and videos. By using the App, you grant us a limited, non-exclusive license to store and display your content solely to provide the App's services to you.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          You represent and warrant that you have the right to share any content you upload and that such content does not violate the rights of any third party.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>6. Subscription & Payment</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Certain features of Covenant require a Premium subscription. Subscription terms:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Subscriptions are billed monthly or annually, depending on your chosen plan</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Your subscription will automatically renew unless cancelled at least 24 hours before the end of the current period</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• You can cancel your subscription at any time through your device's app store settings</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Subscription fees are non-refundable, except as required by law</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>7. Refund Policy</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We want you to be satisfied with Covenant. If you are not satisfied, please contact us within 14 days of your purchase at support@covenant.app to discuss a refund.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          Refunds for subscription renewals are handled according to the refund policies of your device's app store (Apple App Store or Google Play Store).
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>8. Intellectual Property</Text>
        <Text style={[styles.body, { color: subColor }]}>
          The App, including all content, features, and functionality, is owned by Covenant and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the App without our prior written consent.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          The Covenant name, logo, and all related names, logos, product names, and designs are trademarks of Covenant. You may not use these marks without our prior written permission.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>9. Limitation of Liability</Text>
        <Text style={[styles.body, { color: subColor }]}>
          To the maximum extent permitted by law, Covenant shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Your use or inability to use the App</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Any unauthorized access to or use of our servers</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Any interruption or cessation of transmission to or from the App</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Any bugs, viruses, or other harmful code that may be transmitted to or through the App</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>10. Disclaimer of Warranties</Text>
        <Text style={[styles.body, { color: subColor }]}>
          The App is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the App's accuracy, completeness, reliability, or availability.
        </Text>
        <Text style={[styles.body, { color: subColor }]}>
          You acknowledge that your use of the App is at your sole risk.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>11. Termination</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We reserve the right to terminate or suspend your account at our sole discretion, without notice, for any reason, including but not limited to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: subColor }]}>• Violation of these Terms of Service</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Fraudulent or illegal activity</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Non-payment of subscription fees</Text>
          <Text style={[styles.bullet, { color: subColor }]}>• Behavior that harms other users or the App</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>12. Governing Law</Text>
        <Text style={[styles.body, { color: subColor }]}>
          These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>13. Contact</Text>
        <Text style={[styles.body, { color: subColor }]}>
          If you have questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={[styles.contact, { color: Colours.gold }]}>support@covenant.app</Text>
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
