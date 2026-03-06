import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Share, Modal, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Colours } from '@/constants/colours';
import { TOPIC_VERSES, TOPICS, getDailyVerse, getVerseForDaysAgo } from '@/constants/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'daily' | 'topics';

interface Verse {
  id: string;
  reference: string;
  text: string;
  topic: string;
  theme?: string;
}

export default function ScriptureScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ─── State ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [daysAgo, setDaysAgo] = useState(0);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ─── Colors ─────────────────────────────────────────────────────────────────────
  const bgColor = isDark ? Colours.darkBg : Colours.cream;
  const textColor = isDark ? Colours.cream : Colours.brownDeep;
  const subColor = isDark ? Colours.goldLight : Colours.brownMid;
  const cardBg = isDark ? Colours.darkCard : '#fff';
  const inputBg = isDark ? '#1a0f08' : '#f5f0e8';

  // ─── Load Daily Verse ─────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date();
    const { verse } = getDailyVerse(today);
    setCurrentVerse(verse);
  }, []);

  // ─── Handle Navigation ─────────────────────────────────────────────────────────
  const handlePrevDay = useCallback(() => {
    if (daysAgo < 7) {
      const newDaysAgo = daysAgo + 1;
      setDaysAgo(newDaysAgo);
      const today = new Date();
      const verse = getVerseForDaysAgo(today, newDaysAgo);
      if (verse) setCurrentVerse(verse);
    }
  }, [daysAgo]);

  const handleNextDay = useCallback(() => {
    if (daysAgo > 0) {
      const newDaysAgo = daysAgo - 1;
      setDaysAgo(newDaysAgo);
      const today = new Date();
      const verse = getVerseForDaysAgo(today, newDaysAgo);
      if (verse) setCurrentVerse(verse);
    }
  }, [daysAgo]);

  // ─── Handle Topic Selection ───────────────────────────────────────────────────
  const handleTopicSelect = (topicId: string) => {
    const topic = TOPICS.find(t => t.id === topicId);
    if (topic && !topic.free) {
      setShowPaywall(true);
      return;
    }
    setSelectedTopic(topicId);
  };

  // ─── Get Today's Date ───────────────────────────────────────────────────────────
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  // ─── Handle Share ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!currentVerse) return;
    
    try {
      await Share.share({
        message: `"${currentVerse.text}"\n\n— ${currentVerse.reference}\n\nShared from Covenant — Marriage Companion App`,
      });
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  // ─── Get Topic Verses ─────────────────────────────────────────────────────────
  const getTopicVerseList = () => {
    if (!selectedTopic) return [];
    const verses = TOPIC_VERSES[selectedTopic as keyof typeof TOPIC_VERSES];
    return verses || [];
  };

  // ─── Render Daily Verse Section ────────────────────────────────────────────────
  const renderDailyVerse = () => (
    <View style={styles.dailySection}>
      {/* Header */}
      <Text style={[styles.verseOfDayLabel, { color: Colours.gold }]}>VERSE OF THE DAY</Text>
      <Text style={[styles.dateText, { color: subColor }]}>{dateStr}</Text>

      {/* Seasonal Banner */}
      {currentVerse?.theme && ['Advent', 'Christmas', 'New Year', "Valentine's Day", 'Easter Week'].includes(currentVerse.theme) && (
        <View style={[styles.seasonalBanner, { backgroundColor: Colours.brownWarm }]}>
          <Text style={styles.seasonalText}>✨ {currentVerse.theme} ✨</Text>
        </View>
      )}

      {/* Verse Card */}
      <View style={[styles.verseCard, { backgroundColor: isDark ? Colours.brownDeep : Colours.brownMid }]}>
        <Text style={[styles.verseText, { color: isDark ? Colours.goldLight : Colours.cream }]}>
          "{currentVerse?.text || 'Loading...'}
        </Text>
        <Text style={[styles.verseRef, { color: Colours.gold }]}>
          — {currentVerse?.reference || ''}
        </Text>
        {currentVerse?.theme && (
          <View style={[styles.themeBadge, { backgroundColor: Colours.gold }]}>
            <Text style={[styles.themeBadgeText, { color: Colours.brownDeep }]}>
              On {currentVerse.theme}
            </Text>
          </View>
        )}
      </View>

      {/* Share Button */}
      <TouchableOpacity 
        style={[styles.shareButton, { backgroundColor: Colours.gold }]}
        onPress={() => setShowShareModal(true)}
      >
        <Text style={[styles.shareButtonText, { color: Colours.brownDeep }]}>
          📤 Share this verse
        </Text>
      </TouchableOpacity>

      {/* Navigation Arrows */}
      <View style={styles.navRow}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: inputBg, opacity: daysAgo < 7 ? 1 : 0.4 }]}
          onPress={handlePrevDay}
          disabled={daysAgo >= 7}
        >
          <Text style={[styles.navButtonText, { color: Colours.brownWarm }]}>← Previous</Text>
        </TouchableOpacity>
        
        <Text style={[styles.counter, { color: subColor }]}>
          {daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
        </Text>
        
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: inputBg, opacity: daysAgo > 0 ? 1 : 0.4 }]}
          onPress={handleNextDay}
          disabled={daysAgo <= 0}
        >
          <Text style={[styles.navButtonText, { color: Colours.brownWarm }]}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Verse History Preview */}
      <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>Recent Verses</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
        {[0, 1, 2, 3, 4, 5, 6].map((days) => {
          const verse = getVerseForDaysAgo(today, days);
          const isSelected = days === daysAgo;
          return (
            <TouchableOpacity
              key={days}
              style={[
                styles.recentCard,
                { backgroundColor: cardBg },
                isSelected && { borderColor: Colours.gold, borderWidth: 2 }
              ]}
              onPress={() => {
                setDaysAgo(days);
                if (verse) setCurrentVerse(verse);
              }}
            >
              <Text style={[styles.recentRef, { color: Colours.gold }]}>{verse?.reference}</Text>
              <Text style={[styles.recentTheme, { color: subColor }]} numberOfLines={1}>
                {days === 0 ? 'Today' : `${days}d ago`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─── Render Topic Library Section ───────────────────────────────────────────────
  const renderTopicLibrary = () => (
    <View style={styles.topicSection}>
      {/* Intro */}
      <Text style={[styles.introText, { color: subColor }]}>
        Choose a topic and let scripture guide your conversation — with grace, not guilt.
      </Text>

      {/* Topic Grid */}
      <View style={styles.topicGrid}>
        {TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic.id;
          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                { backgroundColor: cardBg },
                isSelected && { borderColor: Colours.gold, borderWidth: 2, backgroundColor: isDark ? Colours.brownMid : Colours.goldLight }
              ]}
              onPress={() => handleTopicSelect(topic.id)}
            >
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text style={[styles.topicTitle, { color: textColor }]}>{topic.title}</Text>
              {!topic.free && (
                <View style={[styles.lockBadge, { backgroundColor: Colours.brownWarm }]}>
                  <Text style={styles.lockText}>🔒 Premium</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Topic Verses Panel */}
      {selectedTopic && (
        <View style={styles.versePanel}>
          <View style={styles.versePanelHeader}>
            <Text style={[styles.versePanelTitle, { color: textColor }]}>
              {TOPICS.find(t => t.id === selectedTopic)?.title} Verses
            </Text>
            <TouchableOpacity onPress={() => setSelectedTopic(null)}>
              <Text style={[styles.closePanel, { color: subColor }]}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.verseList} showsVerticalScrollIndicator={false}>
            {getTopicVerseList().map((verse, index) => (
              <TouchableOpacity
                key={verse.id}
                style={[styles.verseListItem, { backgroundColor: inputBg }]}
              >
                <Text style={[styles.verseListRef, { color: Colours.gold }]}>
                  {verse.reference}
                </Text>
                <Text style={[styles.verseListText, { color: textColor }]}>
                  {verse.text}
                </Text>
                <View style={[styles.promptBox, { backgroundColor: isDark ? Colours.darkCard : '#fff' }]}>
                  <Text style={[styles.promptLabel, { color: subColor }]}>Discussion:</Text>
                  <Text style={[styles.promptText, { color: textColor }]}>
                    How does this verse apply to your {TOPICS.find(t => t.id === selectedTopic)?.title.toLowerCase()}?
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.heading, { color: textColor }]}>Scripture</Text>
        <Text style={[styles.subheading, { color: subColor }]}>
          God's Word for your marriage
        </Text>

        {/* Toggle Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: inputBg }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'daily' && { backgroundColor: Colours.brownWarm }
            ]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'daily' ? Colours.cream : subColor }
            ]}>
              Daily Verse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'topics' && { backgroundColor: Colours.brownWarm }
            ]}
            onPress={() => setActiveTab('topics')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'topics' ? Colours.cream : subColor }
            ]}>
              Topic Library
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'daily' ? renderDailyVerse() : renderTopicLibrary()}
      </ScrollView>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.paywallModal, { backgroundColor: cardBg }]}>
            <Text style={styles.paywallIcon}>🔒</Text>
            <Text style={[styles.paywallTitle, { color: textColor }]}>Premium Content</Text>
            <Text style={[styles.paywallText, { color: subColor }]}>
              This topic is available for Covenant Premium members. Unlock access to all topics, including Intimacy, In-Laws, and Work.
            </Text>
            <TouchableOpacity 
              style={[styles.paywallButton, { backgroundColor: Colours.gold }]}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={[styles.paywallButtonText, { color: Colours.brownDeep }]}>
                Unlock Premium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaywall(false)}>
              <Text style={[styles.paywallClose, { color: subColor }]}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shareModal, { backgroundColor: cardBg }]}>
            <Text style={[styles.shareModalTitle, { color: textColor }]}>Share Verse</Text>
            
            {/* Share Preview Card */}
            <View style={[styles.sharePreview, { backgroundColor: isDark ? Colours.brownDeep : Colours.brownMid }]}>
              <Text style={[styles.shareVerseText, { color: Colours.cream }]}>
                "{currentVerse?.text}"
              </Text>
              <Text style={[styles.shareVerseRef, { color: Colours.gold }]}>
                — {currentVerse?.reference}
              </Text>
              <View style={styles.shareLogoRow}>
                <Text style={styles.shareLogo}>💍</Text>
                <Text style={[styles.shareBrand, { color: Colours.goldLight }]}>Covenant</Text>
              </View>
            </View>

            {/* Share Buttons */}
            <TouchableOpacity 
              style={[styles.shareActionButton, { backgroundColor: Colours.gold }]}
              onPress={handleShare}
            >
              <Text style={[styles.shareActionText, { color: Colours.brownDeep }]}>
                📤 Share to Apps
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Text style={[styles.paywallClose, { color: subColor, marginTop: 16 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    marginBottom: 20,
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },

  // Daily Verse Styles
  dailySection: {
    gap: 16,
  },
  verseOfDayLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1.5,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: -8,
  },
  seasonalBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seasonalText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  verseCard: {
    borderRadius: 16,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  verseText: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 34,
    textAlign: 'center',
  },
  verseRef: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  themeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  themeBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  shareButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  navButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  navButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  counter: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  recentScroll: {
    marginTop: 8,
  },
  recentCard: {
    width: 120,
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  recentRef: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  recentTheme: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },

  // Topic Library Styles
  topicSection: {
    gap: 20,
  },
  introText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular_Italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  topicCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  lockBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  versePanel: {
    marginTop: 16,
  },
  versePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versePanelTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  closePanel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  verseList: {
    maxHeight: 400,
  },
  verseListItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  verseListRef: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  verseListText: {
    fontSize: 14,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  promptBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colours.gold,
  },
  promptLabel: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  promptText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    fontStyle: 'italic',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paywallModal: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  paywallIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 12,
  },
  paywallText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  paywallButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  paywallButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  paywallClose: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 16,
  },
  shareModal: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  shareModalTitle: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_700Bold',
    marginBottom: 20,
  },
  sharePreview: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareVerseText: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  shareVerseRef: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    marginBottom: 16,
  },
  shareLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareLogo: {
    fontSize: 16,
  },
  shareBrand: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  shareActionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  shareActionText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
});
