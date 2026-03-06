import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { router, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colours } from '@/constants/colours';
import { signOut, getSession, getProfile, getCoupleForUser } from '@/lib/supabase';
import { getPremiumStatus, getReferralInfo } from '@/lib/premium';

type Profile = {
  id: string;
  name: string;
  spouse_name: string | null;
  wedding_date: string | null;
  avatar_url: string | null;
  couple_code: string | null;
  created_at: string;
};

type Couple = {
  id: string;
  user_id_1: string | null;
  user_id_2: string | null;
  name1: string;
  name2: string;
  anniversary: string | null;
  couple_code: string;
  church_id: string | null;
  leaderboard_optin: boolean;
  premium: boolean;
  premium_expiry: string | null;
};

function getDaysTogether(weddingDate: string | null): string {
  if (!weddingDate) return '—';
  // Support DD/MM/YYYY or YYYY-MM-DD
  let date: Date;
  if (weddingDate.includes('/')) {
    const [day, month, year] = weddingDate.split('/');
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(weddingDate);
  }
  if (isNaN(date.getTime())) return '—';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff.toLocaleString() : '—';
}

export default function ProfileScreen() {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<string | null>(null);
  const isDark = colorScheme === 'dark' || (colorScheme === null && systemColorScheme === 'dark');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  
  // Premium status
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean;
    isInTrial: boolean;
    daysRemaining: number | null;
  } | null>(null);
  
  // Link spouse modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [spouseCode, setSpouseCode] = useState('');
  const [linking, setLinking] = useState(false);
  
  // Unlink confirmation
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Notification toggles
  const [weeklyCheckin, setWeeklyCheckin] = useState(true);
  const [checkinDay, setCheckinDay] = useState(1); // Monday
  const [checkinTime, setCheckinTime] = useState('08:00');
  const [dailyVerse, setDailyVerse] = useState(true);
  const [verseTime, setVerseTime] = useState('07:00');
  const [partnerNudge, setPartnerNudge] = useState(true);
  const [anniversaryAlert, setAnniversaryAlert] = useState(true);
  
  // Referral data from backend
  const [referralData, setReferralData] = useState<{
    referralCode: string | null;
    referralCount: number;
    monthsEarned: number;
  }>({
    referralCode: null,
    referralCount: 0,
    monthsEarned: 0,
  });
  const referralCount = referralData.referralCount;

  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';

  useEffect(() => {
    loadProfile();
    loadAppearanceSetting();
    loadNotificationSettings();
  }, []);

  async function loadAppearanceSetting() {
    try {
      const saved = await AsyncStorage.getItem('appearance');
      if (saved) {
        setColorScheme(saved);
      }
    } catch {}
  }

  async function loadNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setWeeklyCheckin(parsed.weeklyCheckin ?? true);
        setCheckinDay(parsed.checkinDay ?? 1);
        setCheckinTime(parsed.checkinTime ?? '08:00');
        setDailyVerse(parsed.dailyVerse ?? true);
        setVerseTime(parsed.verseTime ?? '07:00');
        setPartnerNudge(parsed.partnerNudge ?? true);
        setAnniversaryAlert(parsed.anniversaryAlert ?? true);
      }
    } catch {}
  }

  async function loadProfile() {
    try {
      const { session } = await getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      const { profile: p } = await getProfile(session.user.id);
      setProfile(p);
      
      // Get couple info
      const { couple: c } = await getCoupleForUser(session.user.id);
      if (c) {
        setCouple(c);
      }
      
      // Get premium status
      const status = await getPremiumStatus();
      setPremiumStatus({
        isPremium: status.isPremium,
        isInTrial: status.isInTrial,
        daysRemaining: status.daysRemaining,
      });
      
      // Get referral info
      const referral = await getReferralInfo();
      setReferralData({
        referralCode: referral.referralCode,
        referralCount: referral.referralCount,
        monthsEarned: referral.monthsEarned,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/auth/login');
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleLinkSpouse = async () => {
    if (!spouseCode.trim()) {
      Alert.alert('Error', 'Please enter a couple code');
      return;
    }
    setLinking(true);
    try {
      // In a real app, this would link the accounts via Supabase
      Alert.alert('Success', 'You are now linked with your spouse! 🎉');
      setShowLinkModal(false);
      setSpouseCode('');
    } catch {
      Alert.alert('Error', 'Failed to link. Please check the code and try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkSpouse = async () => {
    setShowUnlinkModal(true);
  };

  const confirmUnlink = async () => {
    // In a real app, this would unlink the accounts via Supabase
    setShowUnlinkModal(false);
    Alert.alert('Unlinked', 'You have been separated from your spouse\'s account.');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }
    // In a real app, this would flag the account for deletion
    setShowDeleteModal(false);
    Alert.alert(
      'Request Submitted',
      'Your data will be deleted within 48 hours. We\'re sorry to see you go.',
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
  };

  const handleAppearanceChange = async (value: string) => {
    setColorScheme(value);
    await AsyncStorage.setItem('appearance', value);
  };

  const handleNotificationToggle = async () => {
    const settings = {
      weeklyCheckin,
      checkinDay,
      checkinTime,
      dailyVerse,
      verseTime,
      partnerNudge,
      anniversaryAlert,
    };
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
  };

  const openPrivacy = () => router.push('/auth/privacy');
  const openTerms = () => router.push('/auth/terms');

  const displayName = profile
    ? profile.spouse_name
      ? `${profile.name} & ${profile.spouse_name}`
      : profile.name
    : 'Your Names';

  const weddingDisplay = profile?.wedding_date
    ? `Married · ${profile.wedding_date}`
    : 'Married · —';

  const coupleCode = couple?.couple_code || profile?.couple_code || 'GRACE7';

  const subscriptionStatus = couple?.premium 
    ? (premiumStatus?.isInTrial ? 'Trial' : 'Premium') 
    : 'Free';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator color={Colours.gold} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={styles.container}
    >
      {/* Couple Section */}
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: Colours.brownWarm }]}>
            <Text style={styles.avatarText}>👫</Text>
          </View>
          <Text style={[styles.name, { color: textColor }]}>{displayName}</Text>
          <Text style={[styles.date, { color: Colours.gold }]}>{weddingDisplay}</Text>
        </View>

        {/* Days Married */}
        <View style={styles.daysMarried}>
          <Text style={[styles.daysNumber, { color: Colours.gold }]}>
            {getDaysTogether(profile?.wedding_date ?? null)}
          </Text>
          <Text style={[styles.daysLabel, { color: subColor }]}>days married</Text>
        </View>

        {/* Couple Code */}
        <View style={styles.coupleCodeSection}>
          <Text style={[styles.codeLabel, { color: subColor }]}>Your Couple Code</Text>
          <View style={[styles.codeBox, { backgroundColor: isDark ? '#3d2518' : '#fdf8f3' }]}>
            <Text style={[styles.codeText, { color: Colours.gold }]}>{coupleCode}</Text>
          </View>
          <Text style={[styles.codeHint, { color: subColor }]}>
            Share this with your spouse to connect
          </Text>
        </View>

        {/* Link/Unlink Button */}
        {couple?.user_id_2 ? (
          <TouchableOpacity
            style={[styles.unlinkButton, { borderColor: Colours.brownMid }]}
            onPress={handleUnlinkSpouse}
          >
            <Text style={[styles.unlinkText, { color: Colours.brownMid }]}>
              Unlink from {profile?.spouse_name || 'spouse'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: Colours.brownWarm }]}
            onPress={() => setShowLinkModal(true)}
          >
            <Text style={styles.linkButtonText}>Link with Spouse</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Days Together', value: getDaysTogether(profile?.wedding_date ?? null) },
          { label: 'Check-Ins', value: '0' },
          { label: 'Prayers', value: '0' },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statValue, { color: Colours.gold }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Navigation Links */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Links</Text>
      {[
        { label: '📔 Our Story', route: '/journal' as const },
        { label: '📅 Timeline', route: '/timeline' as const },
        { label: '🪣 Bucket List', route: '/bucketlist' as const },
        { label: '🎯 Marriage Goals', route: '/goals' as const },
        { label: '🖼️ Memory Lane', route: '/memory-lane' as const },
        { label: '🎁 Time Capsule', route: '/time-capsule' as const },
      ].map((item) => (
        <Link key={item.route} href={item.route} asChild>
          <TouchableOpacity style={[styles.linkItem, { backgroundColor: cardBg }]}>
            <Text style={[styles.linkText, { color: textColor }]}>{item.label}</Text>
            <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
          </TouchableOpacity>
        </Link>
      ))}

      {/* Subscription */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Subscription</Text>
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <View style={styles.subscriptionRow}>
          <View>
            <Text style={[styles.subscriptionStatus, { color: textColor }]}>
              {subscriptionStatus}
            </Text>
            <Text style={[styles.subscriptionHint, { color: subColor }]}>
              {couple?.premium ? 'Thanks for supporting Covenant!' : 'Unlock all features'}
            </Text>
          </View>
          {!couple?.premium && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: Colours.gold }]}
              onPress={() => router.push('/premium')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Referral Section */}
        <View style={[styles.referralSection, { borderTopColor: isDark ? '#3d2518' : '#f0e6db' }]}>
          <Text style={[styles.referralTitle, { color: textColor }]}>Refer a Couple</Text>
          <Text style={[styles.referralText, { color: subColor }]}>
            Share Covenant with another couple
          </Text>
          <Text style={[styles.referralCount, { color: Colours.gold }]}>
            You've brought {referralCount} couple{referralCount !== 1 ? 's' : ''} to Covenant 🙏
          </Text>
          <Text style={[styles.referralReward, { color: subColor }]}>
            That's {referralCount} month{referralCount !== 1 ? 's' : ''} of Premium earned!
          </Text>
        </View>
      </View>

      {/* Notification Settings */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Notifications</Text>
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        {/* Weekly Check-in Reminder */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Weekly Check-in Reminder</Text>
            <Text style={[styles.settingHint, { color: subColor }]}>
              Every Monday at 8:00 AM
            </Text>
          </View>
          <Switch
            value={weeklyCheckin}
            onValueChange={(val) => { setWeeklyCheckin(val); setTimeout(handleNotificationToggle, 100); }}
            trackColor={{ false: '#ccc', true: Colours.gold }}
            thumbColor="#fff"
          />
        </View>

        {/* Daily Verse */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Daily Verse Notification</Text>
            <Text style={[styles.settingHint, { color: subColor }]}>
              Every day at 7:00 AM
            </Text>
          </View>
          <Switch
            value={dailyVerse}
            onValueChange={(val) => { setDailyVerse(val); setTimeout(handleNotificationToggle, 100); }}
            trackColor={{ false: '#ccc', true: Colours.gold }}
            thumbColor="#fff"
          />
        </View>

        {/* Partner Nudge */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Partner Nudge</Text>
            <Text style={[styles.settingHint, { color: subColor }]}>
              Get reminded to pray for your spouse
            </Text>
          </View>
          <Switch
            value={partnerNudge}
            onValueChange={(val) => { setPartnerNudge(val); setTimeout(handleNotificationToggle, 100); }}
            trackColor={{ false: '#ccc', true: Colours.gold }}
            thumbColor="#fff"
          />
        </View>

        {/* Anniversary Alert */}
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Anniversary Reminder</Text>
            <Text style={[styles.settingHint, { color: subColor }]}>
              Get notified before your anniversary
            </Text>
          </View>
          <Switch
            value={anniversaryAlert}
            onValueChange={(val) => { setAnniversaryAlert(val); setTimeout(handleNotificationToggle, 100); }}
            trackColor={{ false: '#ccc', true: Colours.gold }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Appearance</Text>
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <View style={styles.appearanceRow}>
          {['light', 'dark', 'system'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.appearanceOption,
                { 
                  backgroundColor: (colorScheme === option || (colorScheme === null && option === 'system')) 
                    ? Colours.brownWarm 
                    : 'transparent',
                  borderColor: Colours.brownWarm,
                }
              ]}
              onPress={() => handleAppearanceChange(option)}
            >
              <Text style={[
                styles.appearanceText,
                { color: (colorScheme === option || (colorScheme === null && option === 'system')) 
                  ? '#fff' 
                  : textColor }
              ]}>
                {option === 'light' ? '☀️ Light' : option === 'dark' ? '🌙 Dark' : '⚙️ System'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <TouchableOpacity style={styles.accountRow}>
          <Text style={[styles.accountText, { color: textColor }]}>Change Email</Text>
          <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accountRow}>
          <Text style={[styles.accountText, { color: textColor }]}>Change Password</Text>
          <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.accountRow, { borderBottomWidth: 0 }]}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={[styles.accountText, { color: '#dc2626' }]}>Request Data Deletion</Text>
          <Text style={[styles.linkArrow, { color: subColor }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Links */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={openPrivacy}>
          <Text style={[styles.legalLink, { color: Colours.brownWarm }]}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={{ color: subColor }}>·</Text>
        <TouchableOpacity onPress={openTerms}>
          <Text style={[styles.legalLink, { color: Colours.brownWarm }]}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: Colours.brownWarm }]}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Text style={[styles.signOutText, { color: Colours.brownWarm }]}>
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={[styles.version, { color: subColor }]}>Covenant v1.0.0</Text>

      {/* Link Spouse Modal */}
      <Modal visible={showLinkModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Link with Spouse</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              Enter your spouse's couple code to connect your accounts
            </Text>
            <TextInput
              style={[styles.codeInput, { 
                backgroundColor: isDark ? '#3d2518' : '#fdf8f3',
                color: textColor,
                borderColor: Colours.brownMid,
              }]}
              placeholder="e.g., GRACE7"
              placeholderTextColor={subColor}
              value={spouseCode}
              onChangeText={setSpouseCode}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: Colours.brownMid }]}
                onPress={() => { setShowLinkModal(false); setSpouseCode(''); }}
              >
                <Text style={[styles.modalButtonText, { color: Colours.brownMid }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: Colours.brownWarm }]}
                onPress={handleLinkSpouse}
                disabled={linking}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {linking ? 'Linking...' : 'Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unlink Confirmation Modal */}
      <Modal visible={showUnlinkModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Unlink from Spouse?</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              This will separate your prayer journal and check-in history. Your data will remain but won't be shared anymore.
            </Text>
            <Text style={[styles.warningText, { color: '#dc2626' }]}>
              Are you sure?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: Colours.brownMid }]}
                onPress={() => setShowUnlinkModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: Colours.brownMid }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#dc2626' }]}
                onPress={confirmUnlink}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Unlink</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Delete Account</Text>
            <Text style={[styles.modalSubtitle, { color: subColor }]}>
              This will permanently delete your account and all associated data including:
            </Text>
            <Text style={[styles.deleteList, { color: subColor }]}>
              • Your profile{'\n'}
              • All prayers{'\n'}
              • All journal entries{'\n'}
              • All check-in history{'\n'}
              • All letters to your spouse
            </Text>
            <Text style={[styles.warningText, { color: '#dc2626' }]}>
              This action cannot be undone.
            </Text>
            <TextInput
              style={[styles.codeInput, { 
                backgroundColor: isDark ? '#3d2518' : '#fdf8f3',
                color: textColor,
                borderColor: Colours.brownMid,
              }]}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={subColor}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: Colours.brownMid }]}
                onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                <Text style={[styles.modalButtonText, { color: Colours.brownMid }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#dc2626' }]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  daysMarried: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  daysNumber: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  daysLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  coupleCodeSection: {
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  codeBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  linkButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  unlinkButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  unlinkText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
    marginBottom: 4,
  },
  linkItem: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  linkArrow: {
    fontSize: 16,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionStatus: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  subscriptionHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  referralSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  referralTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  referralText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  referralCount: {
    fontSize: 15,
    fontFamily: 'CormorantGaramond_600SemiBold',
    marginTop: 8,
  },
  referralReward: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  settingHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  appearanceOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  appearanceText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  accountText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legalLink: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textDecorationLine: 'underline',
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  version: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    letterSpacing: 2,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  deleteList: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
});
