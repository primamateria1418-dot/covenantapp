import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colours } from '@/constants/colours';
import {
  PREMIUM_FEATURES,
  PREMIUM_PRICE,
  CHURCH_LICENCE_PRICE,
  getPremiumStatus,
  startFreeTrial,
  restorePurchases,
} from '@/lib/premium';

export default function PremiumScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const [loading, setLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean;
    isInTrial: boolean;
    daysRemaining: number | null;
  } | null>(null);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    const status = await getPremiumStatus();
    setPremiumStatus({
      isPremium: status.isPremium,
      isInTrial: status.isInTrial,
      daysRemaining: status.daysRemaining,
    });
  };

  const handleStartTrial = async () => {
    setLoading(true);
    const result = await startFreeTrial();
    if (result.success) {
      Alert.alert(
        'Trial Started! 🎉',
        'You now have 7 days of premium access. Enjoy growing together!',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to start trial');
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    const result = await restorePurchases();
    if (result.isPremium) {
      Alert.alert('Restored!', 'Your premium access has been restored.');
      router.back();
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
    }
    setLoading(false);
  };

  const handleContactChurch = () => {
    Linking.openURL('mailto:hello@covenantapp.com?subject=Church License Inquiry');
  };

  // If already premium, show success state
  if (premiumStatus?.isPremium) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <LinearGradient
          colors={[Colours.brownWarm, Colours.brownDeep]}
          style={styles.header}
        >
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.headerTitle}>You're Premium!</Text>
          <Text style={styles.headerSubtitle}>
            {premiumStatus.isInTrial
              ? `${premiumStatus.daysRemaining} days remaining in your trial`
              : 'Thank you for investing in your marriage'}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.successCard, { backgroundColor: cardBg }]}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.successTitle, { color: textColor }]}>
              Premium Active
            </Text>
            <Text style={[styles.successText, { color: subColor }]}>
              You have full access to all features. Keep growing together!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colours.brownWarm, Colours.brownDeep]}
        style={styles.header}
      >
        <Text style={styles.heartEmoji}>💛</Text>
        <Text style={styles.headerTitle}>Grow Deeper Together</Text>
        <Text style={styles.headerSubtitle}>
          Unlock the full Covenant experience for your marriage
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Features List */}
        <View style={[styles.featuresCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Everything in Premium
          </Text>
          
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={[styles.featureText, { color: textColor }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        <View style={[styles.pricingCard, { backgroundColor: cardBg }]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.planName, { color: textColor }]}>
                Premium Couple
              </Text>
              <Text style={[styles.price, { color: textColor }]}>
                {PREMIUM_PRICE}
              </Text>
            </View>
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
            </View>
          </View>
          
          <Text style={[styles.priceDescription, { color: subColor }]}>
            Per couple, billed monthly. Cancel anytime.
          </Text>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleStartTrial}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colours.cream} />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Start Free Trial
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <Text style={[styles.restoreText, { color: subColor }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
        </View>

        {/* Church License */}
        <View style={[styles.churchCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.churchTitle, { color: textColor }]}>
            Church License
          </Text>
          <Text style={[styles.churchDescription, { color: subColor }]}>
            Provide Covenant premium to all couples in your church
          </Text>
          <View style={styles.churchPriceRow}>
            <Text style={[styles.churchPrice, { color: textColor }]}>
              {CHURCH_LICENCE_PRICE}
            </Text>
            <Text style={[styles.churchPriceNote, { color: subColor }]}>
              per year
            </Text>
          </View>
          <TouchableOpacity
            style={styles.churchButton}
            onPress={handleContactChurch}
          >
            <Text style={styles.churchButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsText, { color: subColor }]}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Your subscription will automatically renew unless cancelled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  crownEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colours.cream,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colours.goldLight,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCheck: {
    fontSize: 16,
    color: Colours.greenDeep,
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  pricingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  trialBadge: {
    backgroundColor: Colours.greenDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trialBadgeText: {
    color: Colours.cream,
    fontSize: 11,
    fontWeight: '700',
  },
  priceDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: Colours.brownWarm,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  churchCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colours.greenDeep,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  churchTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  churchDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  churchPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  churchPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  churchPriceNote: {
    fontSize: 14,
    marginLeft: 4,
  },
  churchButton: {
    backgroundColor: Colours.greenDeep,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  churchButtonText: {
    color: Colours.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  successCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 48,
    color: Colours.greenDeep,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colours.brownWarm,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  termsSection: {
    marginTop: 8,
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
