import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  FlatList,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { supabase, getSession, getCoupleForUser } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────────

type BucketCategory = 'adventure' | 'romance' | 'faith' | 'family' | 'growth' | 'fun' | 'big';

interface BucketItem {
  id: string;
  text: string;
  category: BucketCategory;
  target_date: string | null;
  completed: boolean;
  completed_at: string | null;
  photo_url: string | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<BucketCategory, { label: string; emoji: string; color: string }> = {
  adventure: { label: 'Adventure', emoji: '🧗', color: '#2e7d32' },
  romance: { label: 'Romance', emoji: '💕', color: '#c62828' },
  faith: { label: 'Faith', emoji: '✝️', color: Colours.greenDeep },
  family: { label: 'Family', emoji: '👨‍👩‍👧', color: Colours.purple },
  growth: { label: 'Growth', emoji: '🌱', color: '#00695c' },
  fun: { label: 'Fun', emoji: '🎉', color: '#f57c00' },
  big: { label: 'Big Life Moments', emoji: '👑', color: Colours.gold },
};

const CATEGORIES: BucketCategory[] = ['adventure', 'romance', 'faith', 'family', 'growth', 'fun', 'big'];

// ─── Helper Functions ───────────────────────────────────────────────────────────

function getCategoryEmoji(category: BucketCategory): string {
  return CATEGORY_CONFIG[category].emoji;
}

function getCategoryLabel(category: BucketCategory): string {
  return CATEGORY_CONFIG[category].label;
}

function getCategoryColor(category: BucketCategory): string {
  return CATEGORY_CONFIG[category].color;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BucketListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ─── State ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BucketItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BucketCategory | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Animation
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const confettiValues = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;

  // Colors
  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  // ─── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadBucketList();
  }, []);

  useEffect(() => {
    if (showCelebration) {
      Animated.sequence([
        Animated.timing(celebrationAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowCelebration(false));

      // Confetti animation
      confettiValues.forEach((anim: Animated.Value, index: number) => {
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [showCelebration]);

  // ─── Data Loading ───────────────────────────────────────────────────────────

  async function loadBucketList() {
    try {
      setLoading(true);
      const { session } = await getSession();
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Get couple
      const { couple, error: coupleError } = await getCoupleForUser(session.user.id);
      if (coupleError || !couple) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      setCoupleId(couple.id);
      setIsPremium(couple.premium ?? false);

      // Load bucket list items
      const { data: bucketItems, error } = await supabase
        .from('bucket_list')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(bucketItems || []);
    } catch (error) {
      console.error('Error loading bucket list:', error);
    } finally {
      setLoading(false);
    }
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleAddItem() {
    if (!newItemText.trim() || !selectedCategory || !coupleId) {
      Alert.alert('Missing Info', 'Please enter a dream and select a category.');
      return;
    }

    // Free tier limit: 5 items
    if (!isPremium && items.filter(i => !i.completed).length >= 5) {
      setShowPaywall(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bucket_list')
        .insert({
          couple_id: coupleId,
          text: newItemText.trim(),
          category: selectedCategory,
          target_date: targetDate || null,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewItemText('');
      setSelectedCategory(null);
      setTargetDate('');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add dream. Please try again.');
    }
  }

  async function handleCompleteItem(item: BucketItem) {
    // Premium can add photos, free cannot
    if (!isPremium) {
      // Mark as complete without photo
      try {
        const { data, error } = await supabase
          .from('bucket_list')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id)
          .select()
          .single();

        if (error) throw error;

        setItems(prev => prev.map(i => (i.id === item.id ? data : i)));
        setShowCelebration(true);
      } catch (error) {
        console.error('Error completing item:', error);
        Alert.alert('Error', 'Failed to complete item.');
      }
    } else {
      // Premium - ask about photo
      Alert.alert(
        '🎉 Dream Achieved!',
        'Would you like to add a memory photo?',
        [
          { text: 'Skip', onPress: () => completeWithoutPhoto(item) },
          { text: 'Add Photo', onPress: () => handleAddPhoto(item) },
        ]
      );
    }
  }

  async function completeWithoutPhoto(item: BucketItem) {
    try {
      const { data, error } = await supabase
        .from('bucket_list')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(i => (i.id === item.id ? data : i)));
      setShowCelebration(true);
    } catch (error) {
      console.error('Error completing item:', error);
    }
  }

  async function handleAddPhoto(item: BucketItem) {
    // For now, just mark complete - in production would use expo-image-picker
    Alert.alert('Photo Upload', 'Photo upload coming soon! For now, your dream is marked complete.');
    completeWithoutPhoto(item);
  }

  // ─── Computed ───────────────────────────────────────────────────────────────

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed).sort(
    (a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
  );

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    const categoryItems = activeItems.filter(i => i.category === cat);
    if (categoryItems.length > 0) {
      acc[cat] = categoryItems;
    }
    return acc;
  }, {} as Record<BucketCategory, BucketItem[]>);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.loadingText, { color: subColor }]}>Loading dreams...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colours.brownDeep, '#4a2c20']}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>🧭</Text>
          <Text style={styles.headerTitle}>Our Bucket List</Text>
          <Text style={styles.headerSubtitle}>Dreams to chase together</Text>
        </LinearGradient>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: cardBg }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: textColor }]}>Journey Progress</Text>
            <TouchableOpacity onPress={() => setShowCompletedModal(true)}>
              <Text style={[styles.viewArchive, { color: Colours.gold }]}>
                View Memories ({completedItems.length})
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colours.gold }]}>{activeItems.length}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colours.greenDeep }]}>{completedItems.length}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Achieved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colours.brownWarm }]}>
                {Math.round((completedItems.length / Math.max(items.length, 1)) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Complete</Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? Colours.brownMid : '#e0d4c4' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: Colours.gold,
                  width: `${Math.min(100, (completedItems.length / Math.max(items.length, 1)) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Add Dream Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add a Dream</Text>
        </TouchableOpacity>

        {/* Free tier warning */}
        {!isPremium && activeItems.length >= 4 && (
          <TouchableOpacity
            style={[styles.limitWarning, { backgroundColor: isDark ? '#3d2817' : '#fef3e2' }]}
            onPress={() => setShowPaywall(true)}
          >
            <Text style={[styles.limitWarningText, { color: Colours.gold }]}>
              ⚠️ Free limit: {5 - activeItems.length} dreams remaining. Tap to upgrade to Premium
            </Text>
          </TouchableOpacity>
        )}

        {/* Active Items by Category */}
        {Object.keys(groupedItems).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Start Dreaming</Text>
            <Text style={[styles.emptySubtitle, { color: subColor }]}>
              Add your first dream together as a couple
            </Text>
          </View>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryEmoji}>{getCategoryEmoji(category as BucketCategory)}</Text>
                <Text style={[styles.categoryTitle, { color: getCategoryColor(category as BucketCategory) }]}>
                  {getCategoryLabel(category as BucketCategory)}
                </Text>
                <Text style={[styles.categoryCount, { color: subColor }]}>
                  {categoryItems.length}
                </Text>
              </View>
              {categoryItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: cardBg }]}
                  onPress={() => handleCompleteItem(item)}
                  onLongPress={() => Alert.alert('Dream', item.text)}
                >
                  <View style={[styles.checkCircle, { borderColor: getCategoryColor(item.category as BucketCategory) }]}>
                    <Text style={styles.checkIcon}>○</Text>
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemText, { color: textColor }]}>{item.text}</Text>
                    {item.target_date && (
                      <Text style={[styles.itemDate, { color: subColor }]}>
                        📅 Target: {new Date(item.target_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: celebrationAnim }]}>
          <LinearGradient
            colors={[Colours.gold, '#e8c49a', Colours.gold]}
            style={styles.celebrationGradient}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Dream Achieved!</Text>
            <Text style={styles.celebrationSubtitle}>
              Another adventure completes your story together
            </Text>
            {confettiValues.map((anim: Animated.Value, index: number) => (
              <Animated.Text
                key={index}
                style={[
                  styles.confetti,
                  {
                    transform: [
                      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) },
                      { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                    ],
                    opacity: anim,
                  },
                ]}
              >
                {['💕', '✝️', '🌟', '💫', '🎊'][index % 5]}
              </Animated.Text>
            ))}
          </LinearGradient>
        </Animated.View>
      )}

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add a Dream</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              What do you want to do together?
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: isDark ? Colours.darkBg : Colours.cream, color: textColor, borderColor: isDark ? Colours.brownMid : '#e0d4c4' }]}
              placeholder="e.g., Visit the Holy Land together"
              placeholderTextColor={subColor}
              value={newItemText}
              onChangeText={setNewItemText}
              multiline
            />

            <Text style={[styles.sectionLabel, { color: textColor }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === cat ? getCategoryColor(cat) : (isDark ? Colours.darkBg : Colours.cream),
                      borderColor: getCategoryColor(cat),
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={styles.categoryChipEmoji}>{getCategoryEmoji(cat)}</Text>
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      { color: selectedCategory === cat ? '#fff' : getCategoryColor(cat) },
                    ]}
                  >
                    {getCategoryLabel(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: textColor }]}>Target Date (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? Colours.darkBg : Colours.cream, color: textColor, borderColor: isDark ? Colours.brownMid : '#e0d4c4' }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={subColor}
              value={targetDate}
              onChangeText={setTargetDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: subColor }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemText('');
                  setSelectedCategory(null);
                  setTargetDate('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: subColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Colours.brownWarm }]}
                onPress={handleAddItem}
              >
                <Text style={styles.submitButtonText}>Add Dream</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completed Archive Modal */}
      <Modal visible={showCompletedModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Memory Archive</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              Dreams you've achieved together
            </Text>

            {completedItems.length === 0 ? (
              <View style={styles.emptyArchive}>
                <Text style={styles.emptyEmoji}>📸</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No memories yet</Text>
                <Text style={[styles.emptySubtitle, { color: subColor }]}>
                  Complete dreams to build your archive
                </Text>
              </View>
            ) : (
              <FlatList
                data={completedItems}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.archiveGrid}
                renderItem={({ item }) => (
                  <View style={[styles.archiveCard, { backgroundColor: isDark ? Colours.darkBg : Colours.cream }]}>
                    {item.photo_url ? (
                      <Image source={{ uri: item.photo_url }} style={styles.archivePhoto} />
                    ) : (
                      <View style={styles.archivePhotoPlaceholder}>
                        <Text style={styles.archiveEmoji}>{getCategoryEmoji(item.category)}</Text>
                      </View>
                    )}
                    <Text style={[styles.archiveText, { color: textColor }]} numberOfLines={2}>
                      {item.text}
                    </Text>
                    <Text style={[styles.archiveDate, { color: subColor }]}>
                      {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
                    </Text>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: Colours.brownWarm }]}
              onPress={() => setShowCompletedModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Paywall Modal */}
      <Modal visible={showPaywall} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallEmoji}>💎</Text>
            <Text style={[styles.paywallTitle, { color: textColor }]}>Upgrade to Premium</Text>
            <Text style={[styles.paywallSubtitle, { color: subColor }]}>
              Unlock unlimited dreams and photo memories
            </Text>
            <View style={styles.paywallFeatures}>
              {['∞ Unlimited dreams', '📸 Photo memories', '🎁 Priority features'].map((feature) => (
                <Text key={feature} style={[styles.paywallFeature, { color: textColor }]}>
                  ✓ {feature}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: Colours.gold }]}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.upgradeButtonText}>Coming Soon</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywall(false)}>
              <Text style={[styles.maybeLater, { color: subColor }]}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.cream,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: Colours.goldLight,
  },
  progressCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  viewArchive: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addButton: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  limitWarning: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  limitWarningText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginLeft: 'auto',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkIcon: {
    fontSize: 16,
    color: Colours.gold,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  emptyCard: {
    margin: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  // Celebration
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationGradient: {
    width: '85%',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.brownDeep,
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownDeep,
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
    top: '20%',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
    minHeight: 50,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    gap: 6,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipLabel: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  // Archive
  emptyArchive: {
    padding: 40,
    alignItems: 'center',
  },
  archiveGrid: {
    paddingBottom: 16,
  },
  archiveCard: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  archivePhoto: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  archivePhotoPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: Colours.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  archiveEmoji: {
    fontSize: 32,
  },
  archiveText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 4,
  },
  archiveDate: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: Colours.cream,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  // Paywall
  paywallEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  paywallSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  paywallFeatures: {
    gap: 12,
    marginBottom: 24,
  },
  paywallFeature: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  upgradeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: Colours.brownDeep,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  maybeLater: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
});
