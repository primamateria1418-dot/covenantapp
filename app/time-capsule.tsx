import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { getSession, getProfile, getCoupleForUser, getTimeCapsules, getUnlockableCapsules, createTimeCapsule, unlockTimeCapsule, getNextAnniversaryDate } from '@/lib/supabase';
import type { TimeCapsule } from '@/lib/supabase';

export default function TimeCapsuleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User & couple data
  const [coupleId, setCoupleId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [spouseName, setSpouseName] = useState<string>('your spouse');
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  
  // Capsules
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [unlockableCapsules, setUnlockableCapsules] = useState<TimeCapsule[]>([]);
  
  // Compose state
  const [capsuleText, setCapsuleText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  
  // Reveal modal
  const [showReveal, setShowReveal] = useState(false);
  const [revealedCapsule, setRevealedCapsule] = useState<TimeCapsule | null>(null);
  
  // Premium state (would come from couple table)
  const [isPremium] = useState(true);

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { session } = await getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      
      const { profile } = await getProfile(session.user.id);
      if (profile) {
      setSpouseName(profile.spouse_name || 'your spouse');
      setWeddingDate(profile.wedding_date);
      }
      
      const { couple } = await getCoupleForUser(session.user.id);
      if (couple) {
        setCoupleId(couple.id);
        
        // Load all capsules
        const { capsules: all } = await getTimeCapsules(couple.id);
        if (all) setCapsules(all);
        
        // Check for unlockable capsules
        const { capsules: unlockable } = await getUnlockableCapsules(couple.id);
        if (unlockable && unlockable.length > 0) {
          setUnlockableCapsules(unlockable);
          setRevealedCapsule(unlockable[0]);
          setShowReveal(true);
        }
      }
    } catch (e) {
      console.error('Error loading time capsules:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSealCapsule() {
    if (!capsuleText.trim() || !coupleId) return;
    
    const unlockDate = getNextAnniversaryDate();
    
    setSaving(true);
    try {
      const { error } = await createTimeCapsule(coupleId, capsuleText.trim(), unlockDate);
      if (error) {
        Alert.alert('Error', 'Failed to create time capsule. Please try again.');
      } else {
        setCapsuleText('');
        setShowCompose(false);
        Alert.alert(
          '🎁 Time Capsule Sealed!',
          `Your message will be revealed on ${new Date(unlockDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        );
        loadData();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlockCapsule(capsule: TimeCapsule) {
    if (capsule.unlocked) {
      setRevealedCapsule(capsule);
      setShowReveal(true);
      return;
    }
    
    try {
      await unlockTimeCapsule(capsule.id);
      setRevealedCapsule({ ...capsule, unlocked: true });
      setShowReveal(true);
      loadData();
    } catch {
    }
  }

  // Check if can create new capsule (once per year)
  const canCreateNew = () => {
    if (!capsules.length) return true;
    const lastCapsule = capsules[capsules.length - 1];
    const lastDate = new Date(lastCapsule.unlock_date);
    const now = new Date();
    // Can create if last capsule unlock date has passed
    return now >= lastDate;
  };

  // Colors for gradient
  const gradientColors = isDark 
    ? ['#1a3a1a', Colours.darkBg] 
    : ['#2c5f2e', '#f0f7f0'];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator color={Colours.gold} size="large" />
      </View>
    );
  }

  const hasUnlockables = unlockableCapsules.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header */}
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🎁</Text>
        <Text style={styles.headerTitle}>Time Capsule</Text>
        <Text style={styles.headerSubtitle}>
          Write to your future selves
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Anniversary Info */}
        {weddingDate && (
          <View style={[styles.anniversaryInfo, { backgroundColor: cardBg }]}>
            <Text style={[styles.anniversaryLabel, { color: subColor }]}>Your Anniversary</Text>
            <Text style={[styles.anniversaryDate, { color: textColor }]}>{weddingDate}</Text>
          </View>
        )}

        {/* Unlock Notification */}
        {hasUnlockables && (
          <TouchableOpacity 
            style={[styles.unlockBanner, { backgroundColor: Colours.gold }]}
            onPress={() => {
              if (unlockableCapsules[0]) {
                handleUnlockCapsule(unlockableCapsules[0]);
              }
            }}
          >
            <Text style={styles.unlockBannerEmoji}>🎉</Text>
            <View style={styles.unlockBannerText}>
              <Text style={styles.unlockBannerTitle}>Your Time Capsule is Ready!</Text>
              <Text style={styles.unlockBannerSubtitle}>Tap to open your message from the past</Text>
            </View>
            <Text style={styles.unlockBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Create New Capsule */}
        {canCreateNew() && (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: Colours.greenDeep }]}
            onPress={() => setShowCompose(true)}
          >
            <Text style={styles.createButtonEmoji}>✍️</Text>
            <Text style={styles.createButtonText}>Write a New Letter</Text>
            <Text style={styles.createButtonSubtext}>Seal it until next anniversary</Text>
          </TouchableOpacity>
        )}

        {/* Capsule Archive */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Your Time Capsule Archive</Text>
        
        {capsules.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: subColor }]}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No capsules yet</Text>
            <Text style={[styles.emptyText, { color: subColor }]}>
              Create your first time capsule to{'\n'}preserve a message for your future selves.
            </Text>
          </View>
        ) : !isPremium ? (
          // Premium paywall
          <View style={[styles.paywall, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallIcon}>💎</Text>
            <Text style={[styles.paywallTitle, { color: textColor }]}>Premium Feature</Text>
            <Text style={[styles.paywallText, { color: subColor }]}>
              Unlock your full time capsule archive with Covenant Premium.
            </Text>
            <TouchableOpacity style={styles.paywallButton}>
              <Text style={styles.paywallButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.capsulesList}>
            {capsules.map((capsule) => {
              const isUnlocked = capsule.unlocked || new Date() >= new Date(capsule.unlock_date);
              
              return (
                <TouchableOpacity
                  key={capsule.id}
                  style={[styles.capsuleCard, { backgroundColor: cardBg }]}
                  onPress={() => handleUnlockCapsule(capsule)}
                >
                  <View style={styles.capsuleHeader}>
                    <View style={styles.capsuleDateBox}>
                      <Text style={styles.capsuleYear}>
                        {new Date(capsule.unlock_date).getFullYear()}
                      </Text>
                    </View>
                    <View style={styles.capsuleStatus}>
                      {isUnlocked ? (
                        <Text style={styles.statusUnlocked}>✓ Unlocked</Text>
                      ) : (
                        <Text style={styles.statusLocked}>
                          🔒 Opens {new Date(capsule.unlock_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.capsulePreview, { color: textColor }]} numberOfLines={2}>
                    {isUnlocked ? capsule.text : 'A message waiting for you...'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Compose Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompose(false)}
      >
        <View style={[styles.composeContainer, { backgroundColor: bgColor }]}>
          <View style={styles.composeHeader}>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Text style={[styles.composeCancel, { color: subColor }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.composeTitle, { color: textColor }]}>Write to the Future</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.composeContent}>
            <Text style={[styles.composePrompt, { color: textColor }]}>
              Write a letter to your future selves.{'\n'}
              What do you want to remember about this moment in your marriage?
            </Text>

            <Text style={[styles.composeDate, { color: subColor }]}>
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>

            <TextInput
              style={[styles.composeInput, { color: textColor, backgroundColor: cardBg }]}
              multiline
              placeholder="Dear future us, ..."
              placeholderTextColor={subColor}
              value={capsuleText}
              onChangeText={setCapsuleText}
              textAlignVertical="top"
            />

            <Text style={[styles.composeSealDate, { color: Colours.gold }]}>
              🔒 This will be sealed until {getNextAnniversaryDate()}
            </Text>
          </ScrollView>

          <View style={styles.composeFooter}>
            <TouchableOpacity
              style={[
                styles.sealButton,
                { backgroundColor: capsuleText.trim() ? Colours.greenDeep : Colours.brownMid },
              ]}
              onPress={handleSealCapsule}
              disabled={!capsuleText.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={Colours.cream} />
              ) : (
                <Text style={styles.sealButtonText}>🎁 Seal Until Next Anniversary</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reveal Modal */}
      <Modal
        visible={showReveal}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowReveal(false)}
      >
        {revealedCapsule && (
          <CapsuleRevealModal
            capsule={revealedCapsule}
            onClose={() => setShowReveal(false)}
            onWriteNew={() => {
              setShowReveal(false);
              setShowCompose(true);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Capsule Reveal Modal Component ───────────────────────────────────────────

function CapsuleRevealModal({
  capsule,
  onClose,
  onWriteNew,
}: {
  capsule: TimeCapsule;
  onClose: () => void;
  onWriteNew: () => void;
}) {
  const [animation] = useState(new Animated.Value(0));
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => setShowContent(true), 2000);
  }, []);

  return (
    <View style={styles.revealContainer}>
      <LinearGradient
        colors={['#c8943a', '#e8c49a', '#c8943a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View 
        style={[
          styles.revealContent,
          { opacity: animation, transform: [{ scale: animation }] }
        ]}
      >
        {showContent ? (
          <>
            <Text style={styles.revealLabel}>Your message from one year ago</Text>
            <Text style={styles.revealTitle}>✨ Time Capsule Revealed ✨</Text>
            
            <View style={styles.revealMessageBox}>
              <Text style={styles.revealMessageDate}>
                Written on {new Date(capsule.written_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Text style={styles.revealMessageText}>
                {capsule.text}
              </Text>
            </View>
            
            <View style={styles.revealButtons}>
              <TouchableOpacity style={styles.revealCloseButton} onPress={onClose}>
                <Text style={styles.revealCloseButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.revealNewButton} onPress={onWriteNew}>
                <Text style={styles.revealNewButtonText}>Write New Capsule</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.revealEmoji}>🎁</Text>
            <Text style={styles.revealPreparing}>Preparing your surprise...</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.cream,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  anniversaryInfo: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  anniversaryLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  anniversaryDate: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.gold,
    marginTop: 4,
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  unlockBannerEmoji: {
    fontSize: 32,
  },
  unlockBannerText: {
    flex: 1,
  },
  unlockBannerTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
  },
  unlockBannerSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
  },
  unlockBannerArrow: {
    fontSize: 20,
    color: Colours.brownDeep,
  },
  createButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  createButtonEmoji: {
    fontSize: 32,
  },
  createButtonText: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: Colours.cream,
  },
  createButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  paywall: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  paywallIcon: {
    fontSize: 32,
  },
  paywallTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  paywallText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  paywallButton: {
    backgroundColor: Colours.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  paywallButtonText: {
    color: Colours.brownDeep,
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  capsulesList: {
    gap: 12,
  },
  capsuleCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capsuleDateBox: {
    backgroundColor: Colours.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  capsuleYear: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
  },
  capsuleStatus: {},
  statusUnlocked: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
    color: Colours.greenDeep,
  },
  statusLocked: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
  },
  capsulePreview: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 20,
  },

  // Compose Modal
  composeContainer: {
    flex: 1,
    paddingTop: 60,
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  composeCancel: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  composeTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  composeContent: {
    flex: 1,
    padding: 20,
  },
  composePrompt: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 24,
    marginBottom: 16,
  },
  composeDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
  },
  composeInput: {
    minHeight: 250,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  composeSealDate: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    textAlign: 'center',
    marginTop: 16,
  },
  composeFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  sealButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sealButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },

  // Reveal Modal
  revealContainer: {
    flex: 1,
  },
  revealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  revealEmoji: {
    fontSize: 100,
    marginBottom: 24,
  },
  revealPreparing: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colours.brownDeep,
  },
  revealLabel: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: Colours.brownDeep,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  revealTitle: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.brownDeep,
    marginBottom: 24,
    textAlign: 'center',
  },
  revealMessageBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxHeight: 300,
    marginBottom: 24,
  },
  revealMessageDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
    marginBottom: 12,
  },
  revealMessageText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 28,
    color: Colours.brownDeep,
  },
  revealButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  revealCloseButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colours.brownDeep,
  },
  revealCloseButtonText: {
    color: Colours.brownDeep,
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  revealNewButton: {
    backgroundColor: Colours.brownDeep,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  revealNewButtonText: {
    color: Colours.cream,
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
});
