import { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colours } from '@/constants/colours';
import { supabase, getProfile, getSession, getCheckInAnswersForInsights, getCheckInCount, getLeaderboard, getCoupleWithChurch, updateLeaderboardOptIn } from '@/lib/supabase';
import { scheduleWeeklyCheckinReminder, cancelAllScheduledNotifications } from '@/lib/notifications';
import { processReferralOnFirstCheckin } from '@/lib/premium';

// ─── Types ─────────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  spouse_name: string | null;
  anniversary: string | null;
  couple_id: string | null;
  notification_enabled: boolean | null;
  notification_time: string | null;
  notification_day: number | null;
}

interface CoupleInfo {
  id: string;
  church_id: string | null;
  leaderboard_optin: boolean;
  premium: boolean;
  church_name?: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  grace_restores_remaining: number;
}

interface CheckInHistory {
  id: string;
  week_number: number;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5_goal: string | null;
  submitted_at: string;
}

interface CheckInAnswer {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5_goal?: string;
  weekly_goal?: string;
}

// ─── Helper Functions ───────────────────────────────────────────────────────────

function calculateWeekNumber(anniversary: string | null): number {
  if (!anniversary) return 1;
  const start = new Date(anniversary);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, diffWeeks + 1);
}

function calculateHealthScore(streak: number, hasAnswered: boolean): { score: number; label: string; trend: 'up' | 'down' | 'steady' } {
  // Simple algorithm based on streak length
  let baseScore = hasAnswered ? 70 : 50;
  if (streak >= 12) baseScore += 20;
  else if (streak >= 8) baseScore += 15;
  else if (streak >= 4) baseScore += 10;
  else if (streak >= 1) baseScore += 5;
  
  const score = Math.min(100, baseScore);
  
  let label = 'Every week is a fresh start';
  if (score >= 90) label = 'Thriving 🌿';
  else if (score >= 70) label = 'Growing 💛';
  else if (score >= 50) label = 'Steady ✝';
  
  const trend: 'up' | 'down' | 'steady' = hasAnswered ? 'up' : 'steady';
  
  return { score, label, trend };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function getRecommendedNextStep(answers: CheckInAnswer): { type: string; title: string; subtitle: string } {
  const combined = (answers.q1 + answers.q2 + answers.q3 + answers.q4).toLowerCase();
  
  if (combined.includes('pray') || combined.includes('prayer')) {
    return { type: 'prayer', title: 'Prayer Journal', subtitle: 'Continue praying together daily' };
  }
  if (combined.includes('god') || combined.includes('faith') || combined.includes('spiritual')) {
    return { type: 'devotional', title: 'Daily Devotional', subtitle: 'Grow together in faith' };
  }
  if (combined.includes('love') || combined.includes('romantic') || combined.includes('date')) {
    return { type: 'date', title: 'Date Night Ideas', subtitle: 'Plan your next romantic outing' };
  }
  if (combined.includes('conflict') || combined.includes('argue') || combined.includes('fight') || combined.includes('forgive')) {
    return { type: 'scripture', title: 'Forgiveness Scripture', subtitle: 'God can heal your hearts' };
  }
  if (combined.includes('communication') || combined.includes('talk') || combined.includes('share')) {
    return { type: 'devotional', title: 'Communication Plan', subtitle: 'Build stronger connections' };
  }
  
  return { type: 'devotional', title: "Today's Devotional", subtitle: 'Strengthen your marriage daily' };
}

function getMilestoneMessage(streak: number): string | null {
  const milestones = { 4: '1 Month of Consistency! 🎉', 8: '2 Months of Growth! 💪', 12: '3 Months Strong! 🌟', 26: 'Half a Year of Faith! ⭐', 52: '1 Year of Devotion! 👑' };
  return milestones[streak as keyof typeof milestones] || null;
}

// ─── Growth Insights Generator ──────────────────────────────────────────────────

interface InsightResult {
  text: string;
  scripture?: string;
}

function generateInsight(answers: { q1: string; q2: string; q3: string; q4: string }[]): InsightResult | null {
  if (answers.length < 8) return null;
  
  const combinedAnswers = answers.map(a => 
    `${a.q1 || ''} ${a.q2 || ''} ${a.q3 || ''} ${a.q4 || ''}`.toLowerCase()
  );
  
  // Count keyword occurrences
  const countKeyword = (keyword: string) => 
    combinedAnswers.filter(a => a.includes(keyword)).length;
  
  const timeCount = countKeyword('time') + countKeyword('together') + countKeyword('date');
  const prayerCount = countKeyword('pray') + countKeyword('prayer') + countKeyword('god') + countKeyword('faith');
  const workStressCount = countKeyword('work') + countKeyword('stress') + countKeyword('busy') + countKeyword('tired');
  const financeCount = countKeyword('money') + countKeyword('finances') + countKeyword('financial') + countKeyword('budget');
  const emptyQ2Count = answers.filter(a => !a.q2 || a.q2.trim() === '').length;
  
  // Generate insight based on patterns
  if (timeCount >= 3) {
    return {
      text: "Quality time comes up often in your check-ins. It seems to matter deeply to both of you.",
    };
  }
  
  if (prayerCount >= 4) {
    return {
      text: "You frequently pray for each other's specific needs. That's a beautiful act of faithfulness.",
    };
  }
  
  if (workStressCount >= 3) {
    return {
      text: "Work pressure has come up a lot recently. The Work & Stress scripture guide might help.",
      scripture: "Matthew 6:25-34 - Do not worry about your life",
    };
  }
  
  if (financeCount >= 2) {
    return {
      text: "Financial conversations seem important for you. The Finances scripture guide has 10 verses on this.",
      scripture: "Philippians 4:19 - My God will supply every need",
    };
  }
  
  if (emptyQ2Count >= 4) {
    return {
      text: "You both tend to hold things close. What would it look like to share one more thing?",
    };
  }
  
  // Default insight
  return {
    text: "You've been consistent in your check-ins. That's a testament to your commitment to each other.",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // ─── State ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0, last_checkin_date: null, grace_restores_remaining: 3 });
  const [answers, setAnswers] = useState<CheckInAnswer>({ q1: '', q2: '', q3: '', q4: '', q5_goal: '' });
  const [hasAnsweredThisWeek, setHasAnsweredThisWeek] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationDay, setNotificationDay] = useState(1); // Sunday = 0, Monday = 1, etc.
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckInHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  // Growth Insights & Leaderboard state
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ couple_id: string; name1: string; name2: string; current_streak: number }[]>([]);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Colors
  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  
  // Week number
  const weekNumber = calculateWeekNumber(profile?.anniversary || null);
  
  // Health score
  const healthScore = calculateHealthScore(streak.current_streak, hasAnsweredThisWeek);
  
  // ─── Effects ──────────────────────────────────────────────────────────────────
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (showSuccess) {
      // Floating animation for prayer hands
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [showSuccess]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (showMilestone) {
      Animated.timing(confettiAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }
  }, [showMilestone]);
  
  // ─── Data Loading ───────────────────────────────────────────────────────────
  
  async function loadData() {
    try {
      setLoading(true);
      
      const { session } = await getSession();
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }
      
      const { profile: profileData } = await getProfile(session.user.id);
      if (!profileData) {
        router.replace('/setup');
        return;
      }
      
      setProfile(profileData as Profile);
      setNotificationEnabled(profileData.notification_enabled ?? true);
      setNotificationDay(profileData.notification_day ?? 1);
      setNotificationTime(profileData.notification_time ?? '09:00');
      
      // Load streak data
      if (profileData.couple_id) {
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('couple_id', profileData.couple_id)
          .single();
        
        if (streakData) {
          setStreak(streakData);
          
          // Check if already answered this week
          const lastCheckin = streakData.last_checkin_date;
          if (lastCheckin) {
            const lastDate = new Date(lastCheckin);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            setHasAnsweredThisWeek(diffDays < 7);
          }
        }
        
        // Load history
        const { data: historyData } = await supabase
          .from('checkin_answers')
          .select('*')
          .eq('couple_id', profileData.couple_id)
          .order('submitted_at', { ascending: false })
          .limit(10);
        
        if (historyData) {
          setHistory(historyData);
        }
        
        // Load couple info for premium/church features
        if (profileData.couple_id) {
          const { couple } = await getCoupleWithChurch(profileData.couple_id);
          if (couple) {
            setCoupleInfo({
              id: couple.id,
              church_id: couple.church_id,
              leaderboard_optin: couple.leaderboard_optin || false,
              premium: couple.premium || false,
              church_name: couple.churches?.name,
            });
            
            // Load check-in count for insights
            const { count } = await getCheckInCount(profileData.couple_id);
            setCheckInCount(count || 0);
            
            // Generate insight if 8+ check-ins
            if (count && count >= 8) {
              const { answers } = await getCheckInAnswersForInsights(profileData.couple_id, 8);
              if (answers) {
                const generatedInsight = generateInsight(
                  answers.map(a => ({ q1: a.q1 || '', q2: a.q2 || '', q3: a.q3 || '', q4: a.q4 || '' }))
                );
                setInsight(generatedInsight);
              }
            }
            
            // Load leaderboard if church linked
            if (couple.church_id && couple.leaderboard_optin) {
              const { entries } = await getLeaderboard(couple.church_id);
              if (entries) {
                setLeaderboard(entries);
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
  }
  
  // ─── Handlers ────────────────────────────────────────────────────────────────
  
  async function handleSubmit() {
    if (!profile?.couple_id || !profile.id) {
      Alert.alert('Error', 'Profile not found. Please complete setup first.');
      return;
    }
    
    // Validate answers
    if (!answers.q1.trim() || !answers.q2.trim() || !answers.q3.trim() || !answers.q4.trim()) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    
    try {
      // Get current week number
      const currentWeek = calculateWeekNumber(profile.anniversary || null);
      
      // Save answers to database
      const { error } = await supabase
        .from('checkin_answers')
        .insert({
          couple_id: profile.couple_id,
          week_number: currentWeek,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
          q5_goal: answers.q5_goal || null,
        });
      
      if (error) throw error;
      
      // Update streak
      const newStreak = streak.current_streak + 1;
      const newLongest = Math.max(streak.longest_streak, newStreak);
      
      await supabase
        .from('streaks')
        .upsert({
          couple_id: profile.couple_id,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_checkin_date: new Date().toISOString(),
          grace_restores_remaining: streak.grace_restores_remaining,
        });
      
      // Check for milestone
      const milestone = getMilestoneMessage(newStreak);
      if (milestone) {
        setShowMilestone(milestone);
      }
      
      // Process referral if this is the first check-in
      const referralResult = await processReferralOnFirstCheckin(profile.couple_id);
      if (referralResult.rewardApplied) {
        Alert.alert('🎉 Free Month Earned!', 
          'You and the couple who referred you each got 1 month of Premium free!',
          [{ text: 'Awesome!' }]
        );
      }
      
      setStreak(prev => ({ ...prev, current_streak: newStreak, longest_streak: newLongest }));
      setHasAnsweredThisWeek(true);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    }
  }
  
  async function handleNotificationSave() {
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          notification_enabled: notificationEnabled,
          notification_day: notificationDay,
          notification_time: notificationTime,
        })
        .eq('id', profile?.id);
      
      // Schedule or cancel notifications
      if (notificationEnabled) {
        const [hour, minute] = notificationTime.split(':').map(Number);
        await scheduleWeeklyCheckinReminder({ enabled: true, day: notificationDay, hour, minute });
      } else {
        await cancelAllScheduledNotifications();
      }
      
      setShowNotificationModal(false);
      Alert.alert('Saved', 'Notification settings updated.');
    } catch (error) {
      console.error('Error saving notifications:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  }
  
  async function handleGraceRestore() {
    if (streak.grace_restores_remaining <= 0) {
      Alert.alert('No Restores Left', 'You have used all your grace restores this month.');
      return;
    }
    
    Alert.alert(
      'Use Grace Restore?',
      `This will restore your streak to ${streak.current_streak}. You have ${streak.grace_restores_remaining} restores remaining.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            await supabase
              .from('streaks')
              .update({ grace_restores_remaining: streak.grace_restores_remaining - 1 })
              .eq('couple_id', profile?.couple_id);
            setStreak(prev => ({ ...prev, grace_restores_remaining: prev.grace_restores_remaining - 1 }));
            Alert.alert('Restored!', 'Your streak has been preserved. God bless your marriage!');
          },
        },
      ]
    );
  }
  
  function handleAddPrayer() {
    router.push('/(tabs)/prayer');
  }
  
  async function handleToggleLeaderboard() {
    if (!coupleInfo?.id) return;
    
    try {
      const newOptIn = !coupleInfo.leaderboard_optin;
      await updateLeaderboardOptIn(coupleInfo.id, newOptIn);
      setCoupleInfo(prev => prev ? { ...prev, leaderboard_optin: newOptIn } : null);
      
      // Reload leaderboard if enabling
      if (newOptIn && coupleInfo.church_id) {
        const { entries } = await getLeaderboard(coupleInfo.church_id);
        if (entries) setLeaderboard(entries);
      } else if (!newOptIn) {
        setLeaderboard([]);
      }
      
      Alert.alert(
        newOptIn ? 'Leaderboard Enabled' : 'Leaderboard Disabled',
        newOptIn 
          ? 'Your streak will now show in your church community! 🙏' 
          : 'Your streak is now hidden from the community.'
      );
    } catch (error) {
      console.error('Error toggling leaderboard:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  }
  
  // ─── Render ──────────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Text style={[styles.loadingText, { color: subColor }]}>Loading...</Text>
      </View>
    );
  }
  
  // Success Screen
  if (showSuccess) {
    const recommendation = getRecommendedNextStep(answers);
    return (
      <Animated.View style={[styles.successContainer, { backgroundColor: Colours.greenDeep }]}>
        <Animated.View style={[styles.prayerHandsContainer, { transform: [{ translateY: floatAnim }] }]}>
          <Text style={styles.prayerHands}>🤝🙏</Text>
        </Animated.View>
        
        <Text style={styles.successTitle}>Check-in Complete</Text>
        <Text style={styles.successSubtitle}>
          You've taken time to invest in your marriage today.{'\n'}
          God sees your faithfulness.
        </Text>
        
        {showMilestone && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneText}>{showMilestone}</Text>
          </View>
        )}
        
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>✨ Recommended Next Step</Text>
          <Text style={styles.recommendationMain}>{recommendation.title}</Text>
          <Text style={styles.recommendationSub}>{recommendation.subtitle}</Text>
        </View>
        
        <TouchableOpacity style={styles.prayerButton} onPress={handleAddPrayer}>
          <Text style={styles.prayerButtonText}>Add a Prayer Together</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => { setShowSuccess(false); setShowMilestone(null); }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  // Main Screen
  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={[Colours.brownDeep, '#3d2317']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <TouchableOpacity onPress={() => setShowNotificationModal(true)}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.coupleNames}>
            {profile?.full_name || 'Partner'} & {profile?.spouse_name || 'Spouse'}
          </Text>
          
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>🔥 {streak.current_streak} Week Streak</Text>
          </View>
          
          {/* Health Score Card */}
          <View style={styles.healthCard}>
            <View style={styles.healthScoreRow}>
              <Text style={styles.healthLabel}>{healthScore.label}</Text>
              <Text style={styles.healthScore}>{healthScore.score}/100</Text>
            </View>
            <View style={styles.healthTrendRow}>
              <Text style={styles.healthTrend}>
                {healthScore.trend === 'up' ? '↑ Improving' : healthScore.trend === 'down' ? '↓ Needs attention' : '→ Steady'}
              </Text>
            </View>
          </View>
          
          {/* Grace Restore Option */}
          {!hasAnsweredThisWeek && streak.current_streak > 0 && streak.grace_restores_remaining > 0 && (
            <TouchableOpacity style={styles.graceButton} onPress={handleGraceRestore}>
              <Text style={styles.graceButtonText}>Life happens. Use your streak restore?</Text>
            </TouchableOpacity>
          )}
          
          {/* Already answered this week */}
          {hasAnsweredThisWeek && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✓ You've already checked in this week!</Text>
            </View>
          )}
        </LinearGradient>
        
        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: cardBg }]}>
          {/* Card Header */}
          <LinearGradient
            colors={[Colours.gold, '#b8832e']}
            style={styles.cardHeader}
          >
            <Text style={styles.cardTitle}>Weekly Check-In</Text>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>Week {weekNumber}</Text>
            </View>
          </LinearGradient>
          
          {/* Questions */}
          <View style={styles.questionsContainer}>
            <QuestionInput
              number={1}
              question="What's one way your spouse showed you love this week that you want to acknowledge?"
              value={answers.q1}
              onChangeText={(text) => setAnswers(prev => ({ ...prev, q1: text }))}
              textColor={textColor}
              subColor={subColor}
            />
            
            <QuestionInput
              number={2}
              question="Share something that's been weighing on your heart — big or small."
              value={answers.q2}
              onChangeText={(text) => setAnswers(prev => ({ ...prev, q2: text }))}
              textColor={textColor}
              subColor={subColor}
            />
            
            <QuestionInput
              number={3}
              question="What's one area of your marriage you'd like to grow in together this month?"
              value={answers.q3}
              onChangeText={(text) => setAnswers(prev => ({ ...prev, q3: text }))}
              textColor={textColor}
              subColor={subColor}
            />
            
            <QuestionInput
              number={4}
              question="How can your spouse best pray for you right now?"
              value={answers.q4}
              onChangeText={(text) => setAnswers(prev => ({ ...prev, q4: text }))}
              textColor={textColor}
              subColor={subColor}
            />
            
            {/* Q5 - Monthly Goal */}
            <View style={styles.questionContainer}>
              <View style={styles.questionLabelRow}>
                <Text style={[styles.questionNumber, { color: Colours.gold }]}>Q5</Text>
                <Text style={[styles.questionLabel, { color: textColor }]}>Monthly Goal Progress</Text>
              </View>
              <Text style={[styles.questionText, { color: subColor, fontStyle: 'italic' }]}>
                How did we do on our goal this week?
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? Colours.darkBg : '#f5f5f5', color: textColor, borderColor: subColor }]}
                placeholder="Share your progress..."
                placeholderTextColor={subColor}
                value={answers.q5_goal}
                onChangeText={(text) => setAnswers(prev => ({ ...prev, q5_goal: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit My Answers ✝</Text>
          </TouchableOpacity>
        </View>
        
        {/* History Section */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity 
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={[styles.historyToggleText, { color: textColor }]}>
                {showHistory ? '▼' : '▶'} Past Check-ins ({history.length})
              </Text>
            </TouchableOpacity>
            
            {showHistory && (
              <View style={styles.historyList}>
                {history.slice(0, 3).map((item, index) => (
                  <View key={item.id || index} style={[styles.historyItem, { backgroundColor: cardBg }]}>
                    <Text style={[styles.historyWeek, { color: textColor }]}>Week {item.week_number}</Text>
                    <Text style={[styles.historyDate, { color: subColor }]}>
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.historyPreview, { color: subColor }]} numberOfLines={2}>
                      {item.q1}
                    </Text>
                  </View>
                ))}
                {history.length > 3 && (
                  <Text style={[styles.historyPaywall, { color: subColor }]}>
                    🔒 View full history with Covenant Premium
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* Growth Insights Section - Premium, 8+ check-ins */}
        {checkInCount >= 8 && (
          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>📊 Growth Insights</Text>
            
            {coupleInfo?.premium ? (
              <View style={[styles.insightCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.insightLabel, { color: Colours.gold }]}>What we've noticed about your marriage</Text>
                <Text style={[styles.insightText, { color: textColor }]}>
                  {insight?.text || 'Keep checking in to unlock personalized insights about your marriage journey together.'}
                </Text>
                {insight?.scripture && (
                  <View style={styles.insightScripture}>
                    <Text style={[styles.insightScriptureText, { color: Colours.gold }]}>
                      📖 {insight.scripture}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.insightTeaser, { backgroundColor: cardBg }]}
                onPress={() => setShowPaywallModal(true)}
              >
                <Text style={[styles.insightTeaserText, { color: textColor }]}>
                  🔒 Unlock Growth Insights
                </Text>
                <Text style={[styles.insightTeaserSub, { color: subColor }]}>
                  After 8+ check-ins, get personalized insights about your marriage.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Community Leaderboard - Church + Opt-in only */}
        {coupleInfo?.church_id && (
          <View style={styles.leaderboardSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>🙏 Faithful marriages in your church</Text>
            
            {/* Opt-in toggle */}
            <TouchableOpacity 
              style={[styles.leaderboardToggle, { backgroundColor: cardBg }]}
              onPress={handleToggleLeaderboard}
            >
              <Text style={[styles.leaderboardToggleText, { color: textColor }]}>
                {coupleInfo.leaderboard_optin ? '✅ Showing in leaderboard' : '⬜ Not shown in leaderboard'}
              </Text>
              <Text style={[styles.leaderboardToggleSub, { color: subColor }]}>
                Tap to {coupleInfo.leaderboard_optin ? 'hide' : 'show'} your streak
              </Text>
            </TouchableOpacity>
            
            {/* Leaderboard list */}
            {coupleInfo.leaderboard_optin && leaderboard.length > 0 && (
              <View style={[styles.leaderboardList, { backgroundColor: cardBg }]}>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <View key={entry.couple_id} style={styles.leaderboardItem}>
                    <Text style={[styles.leaderboardRank, { color: index === 0 ? Colours.gold : subColor }]}>
                      {index + 1}.
                    </Text>
                    <Text style={[styles.leaderboardNames, { color: textColor }]}>
                      {entry.name1} & {entry.name2}
                    </Text>
                    <Text style={[styles.leaderboardStreak, { color: Colours.gold }]}>
                      🔥 {entry.current_streak}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {!coupleInfo.leaderboard_optin && (
              <Text style={[styles.leaderboardOptInHint, { color: subColor }]}>
                Enable the toggle above to join your church community! 🙏
              </Text>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Notification Settings</Text>
            
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: textColor }]}>Weekly Reminder</Text>
              <TouchableOpacity 
                style={[styles.toggle, notificationEnabled && styles.toggleOn]}
                onPress={() => setNotificationEnabled(!notificationEnabled)}
              >
                <Text style={styles.toggleText}>{notificationEnabled ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>
            
            {notificationEnabled && (
              <>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: textColor }]}>Day of Week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayButton, notificationDay === index && styles.dayButtonActive]}
                        onPress={() => setNotificationDay(index)}
                      >
                        <Text style={[styles.dayButtonText, notificationDay === index && styles.dayButtonTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: textColor }]}>Time</Text>
                  <TextInput
                    style={[styles.timeInput, { backgroundColor: isDark ? Colours.darkBg : '#f5f5f5', color: textColor }]}
                    value={notificationTime}
                    onChangeText={setNotificationTime}
                    placeholder="09:00"
                    placeholderTextColor={subColor}
                  />
                </View>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleNotificationSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Premium Paywall Modal */}
      <Modal
        visible={showPaywallModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaywallModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>🔒 Covenant Premium</Text>
            
            <Text style={[styles.paywallDesc, { color: subColor }]}>
              Unlock powerful features to strengthen your marriage:
            </Text>
            
            <View style={styles.paywallFeatures}>
              <Text style={[styles.paywallFeature, { color: textColor }]}>✨ Unlimited bucket list dreams</Text>
              <Text style={[styles.paywallFeature, { color: textColor }]}>📊 Growth Insights</Text>
              <Text style={[styles.paywallFeature, { color: textColor }]}>💾 Full check-in history</Text>
              <Text style={[styles.paywallFeature, { color: textColor }]}>📸 Photo memories for bucket list</Text>
              <Text style={[styles.paywallFeature, { color: textColor }]}>💌 Private letters to spouse</Text>
              <Text style={[styles.paywallFeature, { color: textColor }]}>🎁 Time capsules</Text>
            </View>
            
            <TouchableOpacity style={styles.paywallButton}>
              <Text style={styles.paywallButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.paywallClose}
              onPress={() => setShowPaywallModal(false)}
            >
              <Text style={styles.paywallCloseText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Question Input Component ──────────────────────────────────────────────────

function QuestionInput({ 
  number, 
  question, 
  value, 
  onChangeText, 
  textColor, 
  subColor 
}: {
  number: number;
  question: string;
  value: string;
  onChangeText: (text: string) => void;
  textColor: string;
  subColor: string;
}) {
  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionLabelRow}>
        <Text style={[styles.questionNumber, { color: Colours.gold }]}>Q{number}</Text>
        <Text style={[styles.questionLabel, { color: textColor }]}></Text>
      </View>
      <Text style={[styles.questionText, { color: subColor, fontStyle: 'italic' }]}>
        {question}
      </Text>
      <TextInput
        style={[styles.textInput, { backgroundColor: '#f5f5f5', color: textColor, borderColor: subColor }]}
        placeholder="Type your answer here..."
        placeholderTextColor={subColor}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 13,
    color: Colours.gold,
    letterSpacing: 2,
    fontFamily: 'Lato_700Bold',
  },
  bellIcon: {
    fontSize: 24,
  },
  coupleNames: {
    fontSize: 26,
    color: Colours.cream,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 8,
  },
  streakRow: {
    marginBottom: 16,
  },
  streakText: {
    fontSize: 16,
    color: Colours.gold,
    fontFamily: 'Lato_700Bold',
  },
  
  // Health Card
  healthCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  healthScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 18,
    color: Colours.cream,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  healthScore: {
    fontSize: 28,
    color: Colours.gold,
    fontFamily: 'Lato_700Bold',
  },
  healthTrendRow: {
    marginTop: 4,
  },
  healthTrend: {
    fontSize: 13,
    color: Colours.goldLight,
    fontFamily: 'Lato_400Regular',
  },
  
  // Grace Restore
  graceButton: {
    backgroundColor: 'rgba(200,148,58,0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  graceButtonText: {
    color: Colours.gold,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  
  // Completed Banner
  completedBanner: {
    backgroundColor: 'rgba(44,95,46,0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  completedText: {
    color: '#7cfc7c',
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  
  // Main Card
  mainCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    color: Colours.cream,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  weekBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  weekBadgeText: {
    fontSize: 13,
    color: Colours.cream,
    fontFamily: 'Lato_700Bold',
  },
  
  // Questions
  questionsContainer: {
    padding: 16,
    gap: 20,
  },
  questionContainer: {
    gap: 8,
  },
  questionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  questionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  questionText: {
    fontSize: 15,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: Colours.brownWarm,
    margin: 16,
    marginTop: 8,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colours.cream,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  
  // History
  historySection: {
    marginHorizontal: 16,
  },
  historyToggle: {
    padding: 12,
  },
  historyToggleText: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  historyWeek: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  historyDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  historyPreview: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  historyPaywall: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  
  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  prayerHandsContainer: {
    marginBottom: 24,
  },
  prayerHands: {
    fontSize: 80,
  },
  successTitle: {
    fontSize: 32,
    color: Colours.cream,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'CormorantGaramond_400Regular',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  milestoneCard: {
    backgroundColor: 'rgba(200,148,58,0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colours.gold,
  },
  milestoneText: {
    fontSize: 20,
    color: Colours.gold,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  recommendationTitle: {
    fontSize: 14,
    color: Colours.goldLight,
    fontFamily: 'Lato_600SemiBold',
    marginBottom: 8,
  },
  recommendationMain: {
    fontSize: 22,
    color: Colours.cream,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 4,
  },
  recommendationSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Lato_400Regular',
  },
  prayerButton: {
    backgroundColor: Colours.cream,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  prayerButtonText: {
    color: Colours.greenDeep,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  doneButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  
  // Notification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
  },
  toggle: {
    backgroundColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleOn: {
    backgroundColor: Colours.greenDeep,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dayButtonActive: {
    backgroundColor: Colours.gold,
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  timeInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colours.brownWarm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: Colours.cream,
  },
  
  // Growth Insights
  insightsSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginBottom: 12,
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colours.gold,
  },
  insightLabel: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 17,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 24,
  },
  insightScripture: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,148,58,0.3)',
  },
  insightScriptureText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    fontStyle: 'italic',
  },
  insightTeaser: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  insightTeaserText: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
    marginBottom: 4,
  },
  insightTeaserSub: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  
  // Leaderboard
  leaderboardSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  leaderboardToggle: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  leaderboardToggleText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  leaderboardToggleSub: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  leaderboardList: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardRank: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    width: 30,
  },
  leaderboardNames: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  leaderboardStreak: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  leaderboardOptInHint: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Premium Paywall
  paywallDesc: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
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
  paywallButton: {
    backgroundColor: Colours.gold,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  paywallButtonText: {
    color: Colours.brownDeep,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  paywallClose: {
    padding: 12,
    alignItems: 'center',
  },
  paywallCloseText: {
    color: Colours.brownMid,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
