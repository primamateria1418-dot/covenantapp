import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { PREMIUM_FEATURES, PREMIUM_PRICE, startFreeTrial } from '@/lib/premium';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  description?: string;
  onSubscribe?: () => void;
}

export default function PaywallModal({
  visible,
  onClose,
  feature = 'this feature',
  description,
  onSubscribe,
}: PaywallModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  const [loading, setLoading] = useState(false);

  // Get 3 random premium features for display
  const displayFeatures = PREMIUM_FEATURES.slice(0, 3);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const result = await startFreeTrial();
      if (result.success) {
        onSubscribe?.();
        onClose();
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactChurch = () => {
    Linking.openURL('mailto:hello@covenantapp.com?subject=Church License Inquiry');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={[styles.container, { backgroundColor: cardBg }]}>
          {/* Header with gradient */}
          <LinearGradient
            colors={[Colours.brownWarm, Colours.brownDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.headerTitle}>You've built something beautiful here</Text>
            <Text style={styles.headerSubtitle}>
              Unlock everything to keep growing together
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Feature being accessed */}
            <View style={styles.featureBox}>
              <Text style={[styles.featureLabel, { color: subColor }]}>
                {feature.toUpperCase()}
              </Text>
              {description && (
                <Text style={[styles.featureDescription, { color: textColor }]}>
                  {description}
                </Text>
              )}
            </View>

            {/* Premium benefits */}
            <View style={styles.benefitsSection}>
              <Text style={[styles.benefitsTitle, { color: textColor }]}>
                Premium includes:
              </Text>
              {displayFeatures.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={[styles.benefitText, { color: textColor }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
              {PREMIUM_FEATURES.length > 3 && (
                <Text style={[styles.moreText, { color: subColor }]}>
                  +{PREMIUM_FEATURES.length - 3} more features
                </Text>
              )}
            </View>

            {/* Pricing */}
            <View style={styles.pricingSection}>
              <Text style={[styles.price, { color: textColor }]}>
                {PREMIUM_PRICE}
              </Text>
              <Text style={[styles.priceNote, { color: subColor }]}>
                Cancel anytime
              </Text>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartTrial}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colours.gold, Colours.brownWarm]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Starting...' : 'Start 7-Day Free Trial'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: subColor }]}>
                Maybe later
              </Text>
            </TouchableOpacity>

            {/* Church licence option */}
            <TouchableOpacity
              style={styles.churchButton}
              onPress={handleContactChurch}
            >
              <Text style={[styles.churchButtonText, { color: Colours.greenDeep }]}>
                Interested in a church license? Contact us
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colours.cream,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colours.goldLight,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  featureBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 14,
    color: Colours.greenDeep,
    marginRight: 10,
    fontWeight: '700',
  },
  benefitText: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pricingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  priceNote: {
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  churchButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  churchButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
