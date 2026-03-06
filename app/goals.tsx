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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { supabase, getProfile, getSession, getCoupleForUser } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────────

type GoalCategory = 'spiritual' | 'relational' | 'family' | 'growth' | 'fun';

interface MonthlyGoal {
  id: string;
  goal_text: string;
  category: GoalCategory;
  month: number;
  year: number;
  proposed_by: string | null;
  confirmed: boolean;
  outcome: 'achieved' | 'partial' | 'missed' | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; emoji: string; color: string }> = {
  spiritual: { label: 'Spiritual', emoji: '✝️', color: Colours.greenDeep },
  relational: { label: 'Relational', emoji: '❤️', color: Colours.brownWarm },
  family: { label: 'Family', emoji: '👨‍👩‍👧', color: Colours.purple },
  growth: { label: 'Growth', emoji: '🌱', color: '#00695c' },
  fun: { label: 'Fun', emoji: '🎉', color: '#f57c00' },
};

const SUGGESTED_GOALS = [
  'Pray together every day',
  'No phones after 9pm',
  'One date night per week',
  'Read the Bible together',
  'Say one appreciation daily',
  'Write in our journal twice this week',
  'Take a walk together daily',
  'Share one thing we\'re grateful for each day',
  'Plan a weekend getaway',
  'Cook a meal together',
  'Watch a marriage devotional',
  'Practice active listening for 15 min',
];

const CATEGORIES: GoalCategory[] = ['spiritual', 'relational', 'family', 'growth', 'fun'];

// ─── Helper Functions ───────────────────────────────────────────────────────────

function getCategoryEmoji(category: GoalCategory): string {
  return CATEGORY_CONFIG[category].emoji;
}

function getCategoryLabel(category: GoalCategory): string {
  return CATEGORY_CONFIG[category].label;
}

function getCategoryColor(category: GoalCategory): string {
  return CATEGORY_CONFIG[category].color;
}

function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ─── State ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<MonthlyGoal | null>(null);
  const [newGoalText, setNewGoalText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('relational');
  const [showCelebration, setShowCelebration] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPremium, setIsPremium] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    spouse_name: string | null;
  } | null>(null);

  // Animation
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const confettiValues = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Colors
  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  // ─── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    // Pulse animation for active goal
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (showCelebration) {
      Animated.sequence([
        Animated.timing(celebrationAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowCelebration(false));

      confettiValues.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 80),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [showCelebration]);

  // ─── Data Loading ───────────────────────────────────────────────────────────

  async function loadGoals() {
    try {
      setLoading(true);
      const { session } = await getSession();
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Get profile
      const { profile: profileData } = await getProfile(session.user.id);
      if (!profileData) {
        router.replace('/setup');
        return;
      }
      setProfile(profileData);

      // Get couple
      const { couple, error: coupleError } = await getCoupleForUser(session.user.id);
      if (coupleError || !couple) {
        setLoading(false);
        return;
      }

      setCoupleId(couple.id);
      setIsPremium(couple.premium ?? false);

      // Load monthly goals
      const { data: goalData, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('couple_id', couple.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setGoals(goalData || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleProposeGoal() {
    if (!newGoalText.trim() || !coupleId) {
      Alert.alert('Missing Info', 'Please enter a goal.');
      return;
    }

    const { month, year } = getCurrentMonthYear();

    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .insert({
          couple_id: coupleId,
          goal_text: newGoalText.trim(),
          category: selectedCategory,
          month,
          year,
          proposed_by: userId,
          confirmed: false, // Needs partner confirmation
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewGoalText('');
      setSelectedCategory('relational');

      Alert.alert(
        'Goal Proposed! 💌',
        `Your goal has been proposed. ${profile?.spouse_name || 'Your partner'} needs to confirm it in the app.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error proposing goal:', error);
      Alert.alert('Error', 'Failed to propose goal. Please try again.');
    }
  }

  async function handleConfirmGoal(goal: MonthlyGoal) {
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .update({ confirmed: true })
        .eq('id', goal.id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(g => (g.id === goal.id ? data : g)));
      setShowConfirmModal(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error confirming goal:', error);
      Alert.alert('Error', 'Failed to confirm goal.');
    }
  }

  async function handleMarkOutcome(goal: MonthlyGoal, outcome: 'achieved' | 'partial' | 'missed') {
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .update({ outcome })
        .eq('id', goal.id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(g => (g.id === goal.id ? data : g)));

      if (outcome === 'achieved') {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error updating outcome:', error);
    }
  }

  function handleSelectSuggested(suggestion: string) {
    setNewGoalText(suggestion);
    // Auto-detect category based on content
    const lower = suggestion.toLowerCase();
    if (lower.includes('pray') || lower.includes('bible') || lower.includes('devotional') || lower.includes('faith')) {
      setSelectedCategory('spiritual');
    } else if (lower.includes('date') || lower.includes('love') || lower.includes('appreciat') || lower.includes('listen')) {
      setSelectedCategory('relational');
    } else if (lower.includes('family') || lower.includes('kids') || lower.includes('parent')) {
      setSelectedCategory('family');
    } else if (lower.includes('grow') || lower.includes('learn') || lower.includes('walk')) {
      setSelectedCategory('growth');
    } else {
      setSelectedCategory('fun');
    }
  }

  // ─── Computed ───────────────────────────────────────────────────────────────

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const currentMonthGoals = goals.filter(g => g.month === currentMonth && g.year === currentYear);
  const activeGoal = currentMonthGoals.find(g => g.confirmed && !g.outcome);
  const pendingConfirmation = currentMonthGoals.find(g => !g.confirmed && g.proposed_by !== userId);
  const pastGoals = goals.filter(g => g.month !== currentMonth || g.year !== currentYear);

  const isFirstOfMonth = new Date().getDate() === 1;

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.loadingText, { color: subColor }]}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colours.brownDeep, '#4a2c20']}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>🎯</Text>
          <Text style={styles.headerTitle}>Monthly Goals</Text>
          <Text style={styles.headerSubtitle}>
            Growing together with intention
          </Text>
        </LinearGradient>

        {/* Current Month Banner */}
        <View style={[styles.monthBanner, { backgroundColor: cardBg }]}>
          <Text style={[styles.monthTitle, { color: textColor }]}>
            {getMonthName(currentMonth)} {currentYear}
          </Text>
          {isFirstOfMonth && (
            <View style={[styles.promptBanner, { backgroundColor: Colours.goldLight }]}>
              <Text style={styles.promptBannerText}>
                🌟 Time to set your goal for this month!
              </Text>
            </View>
          )}
        </View>

        {/* Active Goal Card */}
        {activeGoal ? (
          <Animated.View style={[styles.activeGoalCard, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={[Colours.gold, '#b8832e']}
              style={styles.activeGoalGradient}
            >
              <View style={styles.activeGoalHeader}>
                <Text style={styles.activeGoalLabel}>This Month's Focus</Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(activeGoal.category) }]}>
                  <Text style={styles.categoryBadgeText}>
                    {getCategoryEmoji(activeGoal.category)} {getCategoryLabel(activeGoal.category)}
                  </Text>
                </View>
              </View>
              <Text style={styles.activeGoalText}>{activeGoal.goal_text}</Text>
              <View style={styles.activeGoalActions}>
                <TouchableOpacity
                  style={[styles.outcomeButton, { backgroundColor: Colours.greenDeep }]}
                  onPress={() => handleMarkOutcome(activeGoal, 'achieved')}
                >
                  <Text style={styles.outcomeButtonText}>✓ Achieved!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outcomeButton, { backgroundColor: Colours.brownMid }]}
                  onPress={() => handleMarkOutcome(activeGoal, 'partial')}
                >
                  <Text style={styles.outcomeButtonText}>~ Partially</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outcomeButton, { backgroundColor: '#c62828' }]}
                  onPress={() => handleMarkOutcome(activeGoal, 'missed')}
                >
                  <Text style={styles.outcomeButtonText}>✗ Missed</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          <View style={[styles.noGoalCard, { backgroundColor: cardBg }]}>
            <Text style={styles.noGoalEmoji}>🌱</Text>
            <Text style={[styles.noGoalTitle, { color: textColor }]}>No Active Goal</Text>
            <Text style={[styles.noGoalSubtitle, { color: subColor }]}>
              {currentMonthGoals.length === 0
                ? 'Propose a goal for this month'
                : pendingConfirmation
                ? `Waiting for ${profile?.spouse_name || 'your partner'} to confirm`
                : 'Add a goal to focus on together'}
            </Text>
          </View>
        )}

        {/* Pending Confirmation (Partner needs to confirm) */}
        {pendingConfirmation && (
          <TouchableOpacity
            style={[styles.confirmCard, { backgroundColor: Colours.goldLight }]}
            onPress={() => {
              setSelectedGoal(pendingConfirmation);
              setShowConfirmModal(true);
            }}
          >
            <View style={styles.confirmContent}>
              <Text style={styles.confirmEmoji}>💌</Text>
              <View style={styles.confirmText}>
                <Text style={[styles.confirmTitle, { color: Colours.brownDeep }]}>
                  Goal Waiting for You
                </Text>
                <Text style={[styles.confirmSubtitle, { color: Colours.brownMid }]}>
                  {pendingConfirmation.goal_text.substring(0, 50)}...
                </Text>
              </View>
              <Text style={styles.confirmArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Add Goal Button */}
        {(!activeGoal || !activeGoal.confirmed) && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colours.brownWarm }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Propose a Goal</Text>
          </TouchableOpacity>
        )}

        {/* Archive Button */}
        {pastGoals.length > 0 && (
          <TouchableOpacity
            style={[styles.archiveButton, { borderColor: Colours.brownWarm }]}
            onPress={() => setShowArchiveModal(true)}
          >
            <Text style={[styles.archiveButtonText, { color: Colours.brownWarm }]}>
              View Past Goals ({pastGoals.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.statsTitle, { color: textColor }]}>Your Journey</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colours.greenDeep }]}>
                {goals.filter(g => g.outcome === 'achieved').length}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Achieved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: Colours.gold }]}>
                {goals.filter(g => g.outcome === 'partial').length}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Partial</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#c62828' }]}>
                {goals.filter(g => g.outcome === 'missed').length}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Missed</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: celebrationAnim }]}>
          <LinearGradient
            colors={[Colours.greenDeep, '#4a8f4a', Colours.greenDeep]}
            style={styles.celebrationGradient}
          >
            <Text style={styles.celebrationEmoji}>🏆</Text>
            <Text style={styles.celebrationTitle}>Goal Achieved!</Text>
            <Text style={styles.celebrationSubtitle}>
              You grew stronger together this month
            </Text>
            {confettiValues.map((anim, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.confetti,
                  {
                    transform: [
                      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
                      { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                    ],
                    opacity: anim,
                  },
                ]}
              >
                {['✝️', '💕', '🌟', '🏆', '🎉'][index % 5]}
              </Animated.Text>
            ))}
          </LinearGradient>
        </Animated.View>
      )}

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Propose a Goal</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              What do you want to focus on together this month?
            </Text>

            {/* Suggested Goals */}
            <Text style={[styles.sectionLabel, { color: textColor }]}>Suggested Goals (tap to select)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedScroll}>
              {SUGGESTED_GOALS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: isDark ? Colours.darkBg : Colours.cream },
                  ]}
                  onPress={() => handleSelectSuggested(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: textColor }]}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, { backgroundColor: isDark ? Colours.darkBg : Colours.cream, color: textColor, borderColor: isDark ? Colours.brownMid : '#e0d4c4' }]}
              placeholder="Or write your own goal..."
              placeholderTextColor={subColor}
              value={newGoalText}
              onChangeText={setNewGoalText}
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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: subColor }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewGoalText('');
                  setSelectedCategory('relational');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: subColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Colours.brownWarm }]}
                onPress={handleProposeGoal}
              >
                <Text style={styles.submitButtonText}>Propose Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Goal Modal */}
      <Modal visible={showConfirmModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={styles.confirmModalEmoji}>💌</Text>
            <Text style={[styles.modalTitle, { color: textColor }]}>Confirm Goal</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              Your partner has proposed this goal for the month:
            </Text>
            {selectedGoal && (
              <View style={[styles.goalPreview, { backgroundColor: isDark ? Colours.darkBg : Colours.cream }]}>
                <View style={[styles.goalCategoryBadge, { backgroundColor: getCategoryColor(selectedGoal.category) }]}>
                  <Text style={styles.goalCategoryText}>
                    {getCategoryEmoji(selectedGoal.category)} {getCategoryLabel(selectedGoal.category)}
                  </Text>
                </View>
                <Text style={[styles.goalPreviewText, { color: textColor }]}>
                  {selectedGoal.goal_text}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: '#c62828' }]}
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedGoal(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: '#c62828' }]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Colours.greenDeep }]}
                onPress={() => selectedGoal && handleConfirmGoal(selectedGoal)}
              >
                <Text style={styles.submitButtonText}>✓ Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Archive Modal */}
      <Modal visible={showArchiveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Past Goals</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              Your journey together
            </Text>

            <FlatList
              data={pastGoals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.archiveList}
              renderItem={({ item }) => (
                <View style={[styles.archiveCard, { backgroundColor: isDark ? Colours.darkBg : Colours.cream }]}>
                  <View style={styles.archiveHeader}>
                    <Text style={[styles.archiveMonth, { color: textColor }]}>
                      {getMonthName(item.month)} {item.year}
                    </Text>
                    <View style={[
                      styles.outcomeBadge,
                      { backgroundColor: item.outcome === 'achieved' ? Colours.greenDeep : item.outcome === 'partial' ? Colours.gold : item.outcome === 'missed' ? '#c62828' : Colours.brownMid }
                    ]}>
                      <Text style={styles.outcomeBadgeText}>
                        {item.outcome === 'achieved' ? '✓ Achieved' : item.outcome === 'partial' ? '~ Partial' : item.outcome === 'missed' ? '✗ Missed' : '⏳'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.archiveGoalText, { color: textColor }]}>
                    {item.goal_text}
                  </Text>
                  <View style={styles.archiveMeta}>
                    <Text style={[styles.archiveCategory, { color: getCategoryColor(item.category) }]}>
                      {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyArchive}>
                  <Text style={styles.emptyEmoji}>📚</Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No past goals</Text>
                  <Text style={[styles.emptySubtitle, { color: subColor }]}>
                    Complete your first monthly goal
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: Colours.brownWarm }]}
              onPress={() => setShowArchiveModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  monthBanner: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  promptBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  promptBannerText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
  },
  activeGoalCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  activeGoalGradient: {
    padding: 20,
  },
  activeGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeGoalLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: Colours.brownDeep,
    letterSpacing: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  activeGoalText: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colours.brownDeep,
    lineHeight: 30,
    marginBottom: 16,
  },
  activeGoalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  outcomeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  outcomeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  noGoalCard: {
    margin: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noGoalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noGoalTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 4,
  },
  noGoalSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  confirmCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  confirmText: {
    flex: 1,
  },
  confirmTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  confirmSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  confirmArrow: {
    fontSize: 24,
    color: Colours.brownDeep,
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
  archiveButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  archiveButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  statsCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
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
    color: '#fff',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: Colours.goldLight,
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
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
    marginTop: 4,
  },
  suggestedScroll: {
    marginBottom: 16,
    maxHeight: 44,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
    minHeight: 80,
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
  confirmModalEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  goalPreview: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  goalCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalCategoryText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  goalPreviewText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 26,
  },
  // Archive
  archiveList: {
    paddingBottom: 16,
  },
  archiveCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  archiveMonth: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  outcomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  archiveGoalText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    lineHeight: 24,
    marginBottom: 8,
  },
  archiveMeta: {
    flexDirection: 'row',
  },
  archiveCategory: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  emptyArchive: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
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
});
