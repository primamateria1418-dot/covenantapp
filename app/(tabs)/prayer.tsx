import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getProfile, getSession } from '@/lib/supabase';
import { Colours } from '@/constants/colours';
import * as Notifications from 'expo-notifications';

// Types
interface Prayer {
  id: string;
  couple_id: string;
  text: string;
  date: string;
  answered: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  spouse_name: string | null;
  couple_id: string | null;
}

interface Couple {
  id: string;
  user_id_1: string;
  user_id_2: string | null;
  name1: string;
  name2: string;
}

const FREE_PRAYER_LIMIT = 10;

export default function PrayerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const inputBg = isDark ? '#3d2517' : '#f5f0eb';

  // State
  const [loading, setLoading] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [newPrayerText, setNewPrayerText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [partnerLastActive, setPartnerLastActive] = useState<string | null>(null);
  const [canNudge, setCanNudge] = useState(false);
  const [memoryLanePrayer, setMemoryLanePrayer] = useState<Prayer | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { session } = await getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Get profile
      const { profile: userProfile } = await getProfile(session.user.id);
      if (userProfile) {
        setProfile(userProfile);

        // Get couple data
        if (userProfile.couple_id) {
          const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .eq('id', userProfile.couple_id)
            .single();
          
          if (coupleData) {
            setCouple(coupleData);

            // Get prayers
            const { data: prayersData } = await supabase
              .from('prayers')
              .select('*')
              .eq('couple_id', userProfile.couple_id)
              .order('created_at', { ascending: false });
            
            if (prayersData) {
              setPrayers(prayersData);

              // Check for memory lane prayer (1+ months ago)
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              const oldPrayers = prayersData.filter(
                (p: Prayer) => new Date(p.created_at) < oneMonthAgo
              );
              
              if (oldPrayers.length > 0) {
                // Find prayer from same date last year or month
                const today = new Date();
                const lastYear = new Date(today);
                lastYear.setFullYear(lastYear.getFullYear() - 1);
                
                const matchingPrayer = prayersData.find((p: Prayer) => {
                  const prayerDate = new Date(p.created_at);
                  return (
                    prayerDate.getMonth() === today.getMonth() &&
                    prayerDate.getDate() === today.getDate()
                  );
                });

                if (matchingPrayer) {
                  setMemoryLanePrayer(matchingPrayer);
                }
              }
            }

            // Check partner activity
            const partnerId = coupleData.user_id_1 === session.user.id 
              ? coupleData.user_id_2 
              : coupleData.user_id_1;

            if (partnerId) {
              // Get partner's last prayer
              const { data: partnerPrayers } = await supabase
                .from('prayers')
                .select('created_at')
                .eq('couple_id', userProfile.couple_id)
                .order('created_at', { ascending: false })
                .limit(1);

              if (partnerPrayers && partnerPrayers.length > 0) {
                const lastPrayerDate = new Date(partnerPrayers[0].created_at);
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - lastPrayerDate.getTime()) / (1000 * 60 * 60 * 24));
                
                setPartnerLastActive(daysDiff === 0 ? 'Today' : `${daysDiff} days ago`);
                setCanNudge(daysDiff >= 3);

                // Check if can nudge (48 hours since last nudge)
                // For simplicity, we'll just allow it if partner inactive 3+ days
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrayer = async () => {
    if (!newPrayerText.trim()) {
      Alert.alert('Empty Prayer', 'Please write a prayer request.');
      return;
    }

    // Check free tier limit
    if (prayers.length >= FREE_PRAYER_LIMIT) {
      setShowPaywall(true);
      return;
    }

    try {
      setSubmitting(true);
      const { session } = await getSession();
      if (!session?.user || !couple) return;

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('prayers').insert({
        couple_id: couple.id,
        text: newPrayerText.trim(),
        date: today,
        answered: false,
      });

      if (error) throw error;

      setNewPrayerText('');
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Error adding prayer:', error);
      Alert.alert('Error', 'Failed to add prayer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAnswered = async (prayer: Prayer) => {
    try {
      await supabase
        .from('prayers')
        .update({ answered: !prayer.answered })
        .eq('id', prayer.id);

      loadData();
    } catch (error) {
      console.error('Error updating prayer:', error);
    }
  };

  const handleNudgePartner = async () => {
    if (!canNudge || !profile?.spouse_name) return;

    try {
      // Send push notification to partner
      // In a real app, you'd send this via your server or Supabase Edge Function
      // For now, we'll schedule a local notification as a simulation
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💛 Partner Nudge',
          body: `Your spouse ${profile.spouse_name} is thinking of you — Open Covenant together today.`,
          sound: true,
        },
        trigger: null, // Send immediately
      });

      Alert.alert('Nudge Sent! 💛', `You've nudged ${profile.spouse_name}. Hopefully they'll respond soon!`);
      setCanNudge(false);
      
      // Reset nudge availability after 48 hours (in real app, track this in DB)
      setTimeout(() => setCanNudge(true), 48 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Error sending nudge:', error);
      Alert.alert('Error', 'Failed to send nudge. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={Colours.gold} />
      </View>
    );
  }

  // Empty state - show initial form
  if (prayers.length === 0 && !showAddForm) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={styles.emptyContainer}
      >
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#2c1810', '#1a0f08'] : ['#5a2d1a', '#2c1810']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.sharedLabel}>SHARED</Text>
            <Text style={styles.headerTitle}>Prayer Journal</Text>
            {profile?.spouse_name && (
              <TouchableOpacity
                style={[styles.nudgeButton, { opacity: canNudge ? 1 : 0.5 }]}
                onPress={() => setShowNudgeModal(true)}
                disabled={!canNudge}
              >
                <Text style={styles.nudgeButtonText}>
                  Send {profile.spouse_name} a nudge 💛
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕊️</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Your prayer journal is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: subColor }]}>
            What would you like to bring to God today?
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>Add Prayer Request</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.verseText, { color: subColor }]}>
            "Again, truly I tell you that if two of you on earth agree about anything they ask for,
            it will be done for them by my Father in heaven."
          </Text>
          <Text style={[styles.verseRef, { color: Colours.gold }]}>Matthew 18:19</Text>
        </View>

        {/* Nudge Modal */}
        <Modal
          visible={showNudgeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNudgeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Send a nudge? 💛
              </Text>
              <Text style={[styles.modalText, { color: subColor }]}>
                Let {profile?.spouse_name} know you're thinking about them. 
                They can tap the heart to respond.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNudgeModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton, { backgroundColor: Colours.brownWarm }]}
                  onPress={() => {
                    setShowNudgeModal(false);
                    handleNudgePartner();
                  }}
                >
                  <Text style={styles.confirmButtonText}>Send Nudge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Main view with prayers
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#2c1810', '#1a0f08'] : ['#5a2d1a', '#2c1810']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.sharedLabel}>SHARED</Text>
          <Text style={styles.headerTitle}>Prayer Journal</Text>
          <Text style={styles.prayerCount}>{prayers.length} prayers</Text>
          {profile?.spouse_name && (
            <TouchableOpacity
              style={[styles.nudgeButton, { opacity: canNudge ? 1 : 0.5 }]}
              onPress={() => setShowNudgeModal(true)}
              disabled={!canNudge}
            >
              <Text style={styles.nudgeButtonText}>
                {canNudge 
                  ? `Send ${profile.spouse_name} a nudge 💛` 
                  : `Partner active: ${partnerLastActive || 'recently'}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Memory Lane Card */}
      {memoryLanePrayer && (
        <TouchableOpacity
          style={[styles.memoryCard, { backgroundColor: cardBg }]}
          onPress={() => setShowMemoryModal(true)}
        >
          <Text style={styles.memoryEmoji}>💭</Text>
          <View style={styles.memoryContent}>
            <Text style={[styles.memoryTitle, { color: Colours.gold }]}>
              Remember this prayer?
            </Text>
            <Text style={[styles.memoryPreview, { color: subColor }]} numberOfLines={2}>
              "{memoryLanePrayer.text.substring(0, 80)}..."
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Verse Card */}
      <View style={[styles.verseCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.verseText, { color: subColor }]}>
          "Again, truly I tell you that if two of you on earth agree about anything they ask for,
          it will be done for them by my Father in heaven."
        </Text>
        <Text style={[styles.verseRef, { color: Colours.gold }]}>Matthew 18:19</Text>
      </View>

      {/* Add Prayer Card */}
      {showAddForm ? (
        <View style={[styles.addPrayerCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.addPrayerTitle, { color: textColor }]}>
            Add a prayer request
          </Text>
          <TextInput
            style={[styles.prayerInput, { backgroundColor: inputBg, color: textColor }]}
            placeholder="Lord, we lift up..."
            placeholderTextColor={subColor}
            multiline
            numberOfLines={4}
            value={newPrayerText}
            onChangeText={setNewPrayerText}
          />
          <View style={styles.addPrayerButtons}>
            <TouchableOpacity
              style={[styles.cancelPrayerButton]}
              onPress={() => {
                setShowAddForm(false);
                setNewPrayerText('');
              }}
            >
              <Text style={[styles.cancelPrayerText, { color: subColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitPrayerButton,
                { backgroundColor: submitting ? Colours.brownMid : Colours.brownWarm },
              ]}
              onPress={handleAddPrayer}
              disabled={submitting}
            >
              <Text style={styles.submitPrayerText}>
                {submitting ? 'Saving...' : 'Add Prayer Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.newPrayerButton, { borderColor: Colours.gold }]}
          onPress={() => {
            if (prayers.length >= FREE_PRAYER_LIMIT) {
              setShowPaywall(true);
            } else {
              setShowAddForm(true);
            }
          }}
        >
          <Text style={[styles.newPrayerText, { color: Colours.gold }]}>
            + Add Prayer Request
          </Text>
        </TouchableOpacity>
      )}

      {/* Prayer List */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Your Prayers
      </Text>

      {prayers.map((prayer) => (
        <TouchableOpacity
          key={prayer.id}
          style={[styles.prayerCard, { backgroundColor: cardBg }]}
          onPress={() => handleToggleAnswered(prayer)}
          activeOpacity={0.7}
        >
          <View style={styles.prayerLeftBorder} />
          <View style={styles.prayerContent}>
            <View style={styles.prayerHeader}>
              <Text style={[styles.prayerDate, { color: Colours.gold }]}>
                {new Date(prayer.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).toUpperCase()}
              </Text>
              {prayer.answered && (
                <View style={styles.answeredBadge}>
                  <Text style={styles.answeredText}>✓ Answered</Text>
                </View>
              )}
            </View>
            <Text style={[styles.prayerText, { color: textColor }]}>
              {prayer.text}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallEmoji}>👑</Text>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Premium Feature
            </Text>
            <Text style={[styles.modalText, { color: subColor }]}>
              You've reached the free limit of {FREE_PRAYER_LIMIT} prayers. 
              Upgrade to Premium to unlock unlimited prayers and access to 
              the full Memory Lane feature.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: Colours.gold }]}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={[styles.confirmButtonText, { color: Colours.brownDeep }]}>
                Upgrade to Premium
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nudge Modal */}
      <Modal
        visible={showNudgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNudgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Send a nudge? 💛
            </Text>
            <Text style={[styles.modalText, { color: subColor }]}>
              Let {profile?.spouse_name} know you're thinking about them. 
              They can tap the heart to respond.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNudgeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: Colours.brownWarm }]}
                onPress={() => {
                  setShowNudgeModal(false);
                  handleNudgePartner();
                }}
              >
                <Text style={styles.confirmButtonText}>Send Nudge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Memory Lane Modal */}
      <Modal
        visible={showMemoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallEmoji}>💭</Text>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              From Your Prayer Journal
            </Text>
            <Text style={[styles.modalText, { color: subColor }]}>
              On this date last year, you prayed:
            </Text>
            <View style={[styles.memoryFullCard, { backgroundColor: inputBg }]}>
              <Text style={[styles.memoryFullText, { color: textColor }]}>
                "{memoryLanePrayer?.text}"
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: Colours.brownWarm }]}
              onPress={() => setShowMemoryModal(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 24,
    gap: 16,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: -12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  sharedLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: Colours.goldLight,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.cream,
    marginBottom: 4,
  },
  prayerCount: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: Colours.goldLight,
    opacity: 0.8,
    marginBottom: 12,
  },
  nudgeButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  nudgeButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: Colours.goldLight,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  addButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 8,
  },
  addButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  verseCard: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 24,
    marginTop: 8,
  },
  verseText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 26,
  },
  verseRef: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  newPrayerButton: {
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  newPrayerText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  addPrayerCard: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addPrayerTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  prayerInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  addPrayerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelPrayerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelPrayerText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  submitPrayerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
  },
  submitPrayerText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  memoryCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3e2',
    borderWidth: 1,
    borderColor: Colours.gold,
  },
  memoryEmoji: {
    fontSize: 28,
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  memoryPreview: {
    fontSize: 13,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
  },
  prayerCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  prayerLeftBorder: {
    width: 4,
    backgroundColor: Colours.gold,
  },
  prayerContent: {
    flex: 1,
    padding: 16,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerDate: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1,
  },
  answeredBadge: {
    backgroundColor: Colours.greenDeep,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  answeredText: {
    color: Colours.cream,
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
  },
  prayerText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colours.brownMid,
  },
  cancelButtonText: {
    color: Colours.brownMid,
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  confirmButton: {
    backgroundColor: Colours.brownWarm,
  },
  confirmButtonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  paywallEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  memoryFullCard: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  memoryFullText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 26,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
