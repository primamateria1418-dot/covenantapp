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
          By accessing or using Covenant, you agree to be bound by these Terms of Service. If you
          do not agree to these terms, please do not use the app.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>2. Use of Service</Text>
        <Text style={[styles.body, { color: subColor }]}>
          Covenant is designed for personal, non-commercial use by married couples. You agree to
          use the service only for lawful purposes and in accordance with these terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>3. Account Responsibility</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>4. Content</Text>
        <Text style={[styles.body, { color: subColor }]}>
          You retain ownership of content you create within the app. By using the service, you
          grant us a limited licence to store and display your content to provide the service.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>5. Termination</Text>
        <Text style={[styles.body, { color: subColor }]}>
          We reserve the right to terminate or suspend your account at our discretion if you
          violate these terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>6. Contact</Text>
        <Text style={[styles.body, { color: subColor }]}>
          If you have questions about these Terms, please contact us at support@covenant.app
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
