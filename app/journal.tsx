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
import { getSession, getProfile, getCoupleForUser, sendLetter, getLettersForCouple, getSpouseLetters, reactToLetter, getUnlockableCapsules } from '@/lib/supabase';
import type { JournalLetter, TimeCapsule } from '@/lib/supabase';

type ViewMode = 'inbox' | 'compose' | 'timeline';

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingDone, setSendingDone] = useState(false);
  
  // User & couple data
  const [userId, setUserId] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [spouseName, setSpouseName] = useState<string>('your spouse');
  const [currentUserName, setCurrentUserName] = useState<string>('me');
  
  // Letters
  const [inboxLetters, setInboxLetters] = useState<JournalLetter[]>([]);
  const [allLetters, setAllLetters] = useState<JournalLetter[]>([]);
  
  // Compose state
  const [letterText, setLetterText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Selected letter for reading
  const [selectedLetter, setSelectedLetter] = useState<JournalLetter | null>(null);
  
  // Time capsule reveal state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [unlockableCapsules, setUnlockableCapsules] = useState<TimeCapsule[]>([]);
  const [showCapsuleReveal, setShowCapsuleReveal] = useState(false);
  const [revealedCapsule, setRevealedCapsule] = useState<TimeCapsule | null>(null);
  
  // Premium state (would come from couple table in real app)
  const [isPremium] = useState(true); // Simulating premium for now

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
      
      setUserId(session.user.id);
      
      const { profile } = await getProfile(session.user.id);
      if (profile) {
        setSpouseName(profile.spouse_name || 'your spouse');
        setCurrentUserName(profile.name || 'me');
      }
      
      const { couple } = await getCoupleForUser(session.user.id);
      if (couple) {
        setCoupleId(couple.id);
        
        // Load letters
        const { letters } = await getSpouseLetters(couple.id, session.user.id);
        if (letters) setInboxLetters(letters);
        
        const { letters: all } = await getLettersForCouple(couple.id);
        if (all) setAllLetters(all);
        
        // Check for unlockable capsules
        const { capsules } = await getUnlockableCapsules(couple.id);
        if (capsules && capsules.length > 0) {
          setUnlockableCapsules(capsules);
          setRevealedCapsule(capsules[0]);
          setShowCapsuleReveal(true);
        }
      }
    } catch (e) {
      console.error('Error loading journal:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendLetter() {
    if (!letterText.trim() || !coupleId || !userId) return;
    
    setSending(true);
    try {
      const { error } = await sendLetter(coupleId, userId, letterText.trim(), isPrivate);
      if (error) {
        Alert.alert('Error', 'Failed to send letter. Please try again.');
      } else {
        setSendingDone(true);
        setTimeout(() => {
          setSendingDone(false);
          setLetterText('');
          setIsPrivate(false);
          setViewMode('inbox');
          loadData(); // Refresh letters
        }, 2000);
      }
    } catch {
      Alert.alert('Error', 'Failed to send letter. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleReactToLetter(letter: JournalLetter) {
    if (letter.read_at) return; // Already read
    
    try {
      await reactToLetter(letter.id);
      loadData(); // Refresh to show updated read status
    } catch (e) {
      console.error('Error reacting to letter:', e);
    }
  }

  // Colors for gradient
  const gradientColors = isDark 
    ? [Colours.brownDeep, Colours.darkBg] 
    : [Colours.brownMid, Colours.cream];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator color={Colours.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLabel}>LOVE LETTERS</Text>
        <Text style={styles.headerTitle}>Letters to Each Other</Text>
        
        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'inbox' && styles.toggleBtnActive]}
            onPress={() => setViewMode('inbox')}
          >
            <Text style={[styles.toggleText, viewMode === 'inbox' && styles.toggleTextActive]}>
              📥 Inbox
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'compose' && styles.toggleBtnActive]}
            onPress={() => setViewMode('compose')}
          >
            <Text style={[styles.toggleText, viewMode === 'compose' && styles.toggleTextActive]}>
              ✍️ Write
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'timeline' && styles.toggleBtnActive]}
            onPress={() => setViewMode('timeline')}
          >
            <Text style={[styles.toggleText, viewMode === 'timeline' && styles.toggleTextActive]}>
              📅 Timeline
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {viewMode === 'inbox' && (
          <InboxView 
            letters={inboxLetters}
            spouseName={spouseName}
            onSelectLetter={setSelectedLetter}
            onReact={handleReactToLetter}
            isDark={isDark}
            bgColor={bgColor}
            textColor={textColor}
            subColor={subColor}
            cardBg={cardBg}
          />
        )}
        
        {viewMode === 'compose' && (
          <ComposeView
            letterText={letterText}
            setLetterText={setLetterText}
            isPrivate={isPrivate}
            setIsPrivate={setIsPrivate}
            spouseName={spouseName}
            sending={sending}
            sendingDone={sendingDone}
            onSend={handleSendLetter}
            isDark={isDark}
            bgColor={bgColor}
            textColor={textColor}
            subColor={subColor}
          />
        )}
        
        {viewMode === 'timeline' && (
          <TimelineView 
            letters={allLetters}
            currentUserId={userId}
            currentUserName={currentUserName}
            spouseName={spouseName}
            isPremium={isPremium}
            onSelectLetter={setSelectedLetter}
            isDark={isDark}
            bgColor={bgColor}
            textColor={textColor}
            subColor={subColor}
            cardBg={cardBg}
          />
        )}
      </ScrollView>

      {/* Letter Reading Modal */}
      <Modal
        visible={!!selectedLetter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLetter(null)}
      >
        {selectedLetter && (
          <LetterReadingView
            letter={selectedLetter}
            currentUserId={userId}
            currentUserName={currentUserName}
            spouseName={spouseName}
            onClose={() => setSelectedLetter(null)}
            onReact={() => {
              handleReactToLetter(selectedLetter);
              setSelectedLetter({ ...selectedLetter, read_at: new Date().toISOString() });
            }}
            isDark={isDark}
            bgColor={bgColor}
            textColor={textColor}
            subColor={subColor}
          />
        )}
      </Modal>

      {/* Time Capsule Reveal Modal */}
      <Modal
        visible={showCapsuleReveal}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCapsuleReveal(false)}
      >
        {revealedCapsule && (
          <CapsuleRevealView
            capsule={revealedCapsule}
            onClose={() => setShowCapsuleReveal(false)}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Inbox View Component ───────────────────────────────────────────────────────

function InboxView({ 
  letters, 
  spouseName, 
  onSelectLetter, 
  onReact,
  isDark,
  bgColor,
  textColor,
  subColor,
  cardBg,
}: {
  letters: JournalLetter[];
  spouseName: string;
  onSelectLetter: (letter: JournalLetter) => void;
  onReact: (letter: JournalLetter) => void;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  subColor: string;
  cardBg: string;
}) {
  if (letters.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>💌</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>No letters yet</Text>
        <Text style={[styles.emptyText, { color: subColor }]}>
          Letters from {spouseName} will appear here.{'\n'}Ask them to write you a letter!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.lettersList}>
      {letters.map((letter) => (
        <TouchableOpacity
          key={letter.id}
          style={[styles.letterCard, { backgroundColor: cardBg }]}
          onPress={() => onSelectLetter(letter)}
        >
          <View style={styles.letterHeader}>
            <View style={styles.letterMeta}>
              <Text style={[styles.letterDate, { color: subColor }]}>
                {new Date(letter.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              {!letter.read_at && <View style={styles.unreadDot} />}
            </View>
            {!letter.read_at && (
              <TouchableOpacity 
                style={styles.heartBtn}
                onPress={() => onReact(letter)}
              >
                <Text style={styles.heartEmoji}>🤍</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.letterPreview, { color: textColor }]} numberOfLines={2}>
            {letter.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Compose View Component ─────────────────────────────────────────────────────

function ComposeView({
  letterText,
  setLetterText,
  isPrivate,
  setIsPrivate,
  spouseName,
  sending,
  sendingDone,
  onSend,
  isDark,
  bgColor,
  textColor,
  subColor,
}: {
  letterText: string;
  setLetterText: (text: string) => void;
  isPrivate: boolean;
  setIsPrivate: (value: boolean) => void;
  spouseName: string;
  sending: boolean;
  sendingDone: boolean;
  onSend: () => void;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  subColor: string;
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (sendingDone) {
    return (
      <View style={[styles.sendingDone, { backgroundColor: bgColor }]}>
        <Text style={styles.checkMark}>✓</Text>
        <Text style={[styles.sendingDoneText, { color: textColor }]}>
          Your letter has been left for {spouseName} ✝
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.composeContainer}>
      {/* Letter Date */}
      <Text style={[styles.composeDate, { color: subColor }]}>{today}</Text>

      {/* Salutation */}
      <Text style={[styles.salutation, { color: textColor }]}>
        Dear {spouseName},
      </Text>

      {/* Text Area */}
      <TextInput
        style={[styles.textArea, { color: textColor, backgroundColor: isDark ? Colours.darkCard : '#faf6f1' }]}
        multiline
        placeholder="Write your heart..."
        placeholderTextColor={subColor}
        value={letterText}
        onChangeText={setLetterText}
        textAlignVertical="top"
      />

      {/* Private Toggle */}
      <TouchableOpacity 
        style={[styles.privateToggle, isPrivate && styles.privateToggleActive]}
        onPress={() => setIsPrivate(!isPrivate)}
      >
        <Text style={styles.privateIcon}>{isPrivate ? '🔒' : '🔓'}</Text>
        <Text style={[styles.privateLabel, { color: textColor }]}>
          {isPrivate ? 'Just for me' : 'Share with spouse'}
        </Text>
      </TouchableOpacity>

      {/* Send Button */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: letterText.trim() ? Colours.brownWarm : Colours.brownMid },
        ]}
        onPress={onSend}
        disabled={!letterText.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator color={Colours.cream} />
        ) : (
          <Text style={styles.sendButtonText}>
            Leave this for {spouseName} →
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Timeline View Component ───────────────────────────────────────────────────

function TimelineView({
  letters,
  currentUserId,
  currentUserName,
  spouseName,
  isPremium,
  onSelectLetter,
  isDark,
  bgColor,
  textColor,
  subColor,
  cardBg,
}: {
  letters: JournalLetter[];
  currentUserId: string | null;
  currentUserName: string;
  spouseName: string;
  isPremium: boolean;
  onSelectLetter: (letter: JournalLetter) => void;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  subColor: string;
  cardBg: string;
}) {
  if (!isPremium) {
    // Free tier: show 2 letters + paywall
    const teaserLetters = letters.slice(0, 2);
    return (
      <View>
        {teaserLetters.map((letter) => (
          <TouchableOpacity
            key={letter.id}
            style={[styles.timelineCard, { backgroundColor: cardBg }]}
            onPress={() => onSelectLetter(letter)}
          >
            <View style={styles.timelineHeader}>
              <Text style={[styles.timelineAuthor, { color: textColor }]}>
                {letter.author_user_id === currentUserId ? currentUserName : spouseName}
              </Text>
              <Text style={[styles.timelineDate, { color: subColor }]}>
                {new Date(letter.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.timelinePreview, { color: textColor }]} numberOfLines={2}>
              {letter.text}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Paywall */}
        <View style={[styles.paywall, { backgroundColor: cardBg }]}>
          <Text style={styles.paywallIcon}>💎</Text>
          <Text style={[styles.paywallTitle, { color: textColor }]}>Premium Feature</Text>
          <Text style={[styles.paywallText, { color: subColor }]}>
            Unlock your full letter archive and more with Covenant Premium.
          </Text>
          <TouchableOpacity style={styles.paywallButton}>
            <Text style={styles.paywallButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (letters.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📜</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Your letter history</Text>
        <Text style={[styles.emptyText, { color: subColor }]}>
          Start writing letters to build your timeline.{'\n'}Both sent and received letters appear here.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {letters.map((letter) => (
        <TouchableOpacity
          key={letter.id}
          style={[styles.timelineCard, { backgroundColor: cardBg }]}
          onPress={() => onSelectLetter(letter)}
        >
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineAuthor, { color: textColor }]}>
              {letter.author_user_id === currentUserId ? `✍️ ${currentUserName}` : `💌 ${spouseName}`}
            </Text>
            <Text style={[styles.timelineDate, { color: subColor }]}>
              {new Date(letter.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Text style={[styles.timelinePreview, { color: textColor }]} numberOfLines={2}>
            {letter.text}
          </Text>
          {letter.is_private && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>🔒 Private</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Letter Reading View (Modal) ───────────────────────────────────────────────

function LetterReadingView({
  letter,
  currentUserId,
  currentUserName,
  spouseName,
  onClose,
  onReact,
  isDark,
  bgColor,
  textColor,
  subColor,
}: {
  letter: JournalLetter;
  currentUserId: string | null;
  currentUserName: string;
  spouseName: string;
  onClose: () => void;
  onReact: () => void;
  isDark: boolean;
  bgColor: string;
  textColor: string;
  subColor: string;
}) {
  const isFromMe = letter.author_user_id === currentUserId;
  const authorName = isFromMe ? currentUserName : spouseName;
  const isRead = !!letter.read_at;

  return (
    <View style={[styles.letterReadingContainer, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.letterReadingHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeButton, { color: Colours.gold }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.letterReadingDate, { color: subColor }]}>
          {new Date(letter.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={styles.letterReadingContent}>
        <Text style={[styles.letterReadingSalutation, { color: textColor }]}>
          Dear {isFromMe ? spouseName : currentUserName},
        </Text>
        
        <Text style={[styles.letterReadingText, { color: textColor }]}>
          {letter.text}
        </Text>
        
        <Text style={[styles.letterReadingClosing, { color: textColor }]}>
          {'\n'}With love,{'\n'}{authorName}
        </Text>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.letterReadingFooter}>
        {!isFromMe && !isRead && (
          <TouchableOpacity style={styles.heartReactionBtn} onPress={onReact}>
            <Text style={styles.heartReactionEmoji}>🤍</Text>
            <Text style={[styles.heartReactionText, { color: subColor }]}>
              Tap to show you read it
            </Text>
          </TouchableOpacity>
        )}
        {isRead && (
          <View style={styles.readIndicator}>
            <Text style={styles.readIndicatorEmoji}>❤️</Text>
            <Text style={[styles.readIndicatorText, { color: subColor }]}>
              Read
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Time Capsule Reveal View (Modal) ───────────────────────────────────────────

function CapsuleRevealView({
  capsule,
  onClose,
}: {
  capsule: TimeCapsule;
  onClose: () => void;
}) {
  const [animation] = useState(new Animated.Value(0));
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade in animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Show content after delay
    setTimeout(() => setShowContent(true), 1500);
  }, []);

  return (
    <View style={styles.capsuleRevealContainer}>
      {/* Gold background */}
      <LinearGradient
        colors={['#c8943a', '#e8c49a', '#c8943a']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View 
        style={[
          styles.capsuleRevealContent,
          { opacity: animation }
        ]}
      >
        {showContent ? (
          <>
            <Text style={styles.capsuleRevealLabel}>Your message from one year ago</Text>
            <Text style={styles.capsuleRevealTitle}>Time Capsule Revealed ✨</Text>
            
            <View style={styles.capsuleMessageBox}>
              <Text style={styles.capsuleMessageDate}>
                Written on {new Date(capsule.written_at).toLocaleDateString()}
              </Text>
              <Text style={styles.capsuleMessageText}>
                {capsule.text}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.capsuleCloseButton} onPress={onClose}>
              <Text style={styles.capsuleCloseButtonText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.capsuleRevealEmoji}>🎁</Text>
            <Text style={styles.capsuleRevealTitle}>Your Time Capsule</Text>
            <Text style={styles.capsuleRevealSubtitle}>Preparing your message from the past...</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: Colours.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.cream,
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colours.gold,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleTextActive: {
    color: Colours.brownDeep,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Letters List
  lettersList: {
    gap: 12,
  },
  letterCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  letterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  letterDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colours.gold,
  },
  heartBtn: {
    padding: 4,
  },
  heartEmoji: {
    fontSize: 18,
  },
  letterPreview: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },

  // Compose View
  composeContainer: {
    gap: 16,
  },
  composeDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  salutation: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 250,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  privateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  privateToggleActive: {
    backgroundColor: 'rgba(200, 148, 58, 0.1)',
  },
  privateIcon: {
    fontSize: 18,
  },
  privateLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  sendingDone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  checkMark: {
    fontSize: 64,
    color: Colours.greenDeep,
  },
  sendingDoneText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_600SemiBold',
    textAlign: 'center',
  },

  // Timeline View
  timelineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineAuthor: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  timelinePreview: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  privateBadge: {
    marginTop: 8,
  },
  privateBadgeText: {
    fontSize: 11,
    color: Colours.brownMid,
  },
  paywall: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
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

  // Letter Reading Modal
  letterReadingContainer: {
    flex: 1,
    paddingTop: 60,
  },
  letterReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  closeButton: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
  },
  letterReadingDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  letterReadingContent: {
    flex: 1,
    padding: 24,
  },
  letterReadingSalutation: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  letterReadingText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 30,
  },
  letterReadingClosing: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_400Regular',
    fontStyle: 'italic',
    marginTop: 32,
  },
  letterReadingFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  heartReactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  heartReactionEmoji: {
    fontSize: 24,
  },
  heartReactionText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readIndicatorEmoji: {
    fontSize: 18,
  },
  readIndicatorText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },

  // Capsule Reveal Modal
  capsuleRevealContainer: {
    flex: 1,
  },
  capsuleRevealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  capsuleRevealEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  capsuleRevealLabel: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: Colours.brownDeep,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  capsuleRevealTitle: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    color: Colours.brownDeep,
    marginBottom: 12,
    textAlign: 'center',
  },
  capsuleRevealSubtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
  },
  capsuleMessageBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    marginVertical: 24,
  },
  capsuleMessageDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: Colours.brownMid,
    marginBottom: 12,
  },
  capsuleMessageText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond_400Regular',
    lineHeight: 28,
    color: Colours.brownDeep,
  },
  capsuleCloseButton: {
    backgroundColor: Colours.brownDeep,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  capsuleCloseButtonText: {
    color: Colours.cream,
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
});
