import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────────

export interface PremiumStatus {
  isPremium: boolean;
  premiumExpiry: Date | null;
  churchLicenceExpiry: Date | null;
  hasChurchLicence: boolean;
  isInTrial: boolean;
  daysRemaining: number | null;
}

export interface FeatureLimit {
  feature: string;
  freeLimit: number;
  currentCount: number;
  canAccess: boolean;
  upgradeRequired: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────────

export const FREE_LIMITS = {
  prayers: 10,
  scriptureTopics: 3,
  devotionalDays: 3,
  checkinHistory: 3,
  timelineEntries: 3,
  bucketListItems: 5,
  journalLetters: 2,
  memoryLaneTeaser: 1,
  insightsTeaser: 1,
} as const;

export const PREMIUM_PRICE = '$9.99/month';
export const CHURCH_LICENCE_PRICE = '$199/year';
export const TRIAL_DAYS = 7;
export const REFERRAL_REWARD_DAYS = 30;

// Premium features list for display
export const PREMIUM_FEATURES = [
  'Unlimited prayers',
  'All scripture topics',
  '365-day devotionals',
  'Unlimited check-in history',
  'Full timeline access',
  'Unlimited bucket list items',
  'Photo uploads for bucket list',
  'Unlimited journal letters',
  'Full memory lane gallery',
  'Complete insights & analytics',
  'Custom marriage plans',
  'Audio devotionals',
  'Shareable image cards',
  'Time capsule feature',
] as const;

// ─── Premium Status Helpers ───────────────────────────────────────────────────

const CHURCH_LICENCE_EXPIRY_KEY = 'church_licence_expiry';

/**
 * Get premium status for the current user's couple
 */
export async function getPremiumStatus(): Promise<PremiumStatus> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        isPremium: false,
        premiumExpiry: null,
        churchLicenceExpiry: null,
        hasChurchLicence: false,
        isInTrial: false,
        daysRemaining: null,
      };
    }

    // Get couple data
    const { data: couple } = await supabase
      .from('couples')
      .select('premium, premium_expiry, church_id, referral_code, referred_by')
      .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
      .single();

    if (!couple) {
      return {
        isPremium: false,
        premiumExpiry: null,
        churchLicenceExpiry: null,
        hasChurchLicence: false,
        isInTrial: false,
        daysRemaining: null,
      };
    }

    // Check personal premium
    const premiumExpiry = couple.premium_expiry ? new Date(couple.premium_expiry) : null;
    const now = new Date();
    const isPremium = couple.premium && premiumExpiry && premiumExpiry > now;

    // Check if in trial (premium_expiry is in the future but premium flag is false)
    const isInTrial = !couple.premium && premiumExpiry && premiumExpiry > now ? true : false;

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (premiumExpiry && premiumExpiry > now) {
      daysRemaining = Math.ceil((premiumExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Check church licence
    let churchLicenceExpiry: Date | null = null;
    let hasChurchLicence = false;

    if (couple.church_id) {
      // Try to get from local storage first
      const storedExpiry = await AsyncStorage.getItem(`${CHURCH_LICENCE_EXPIRY_KEY}_${couple.church_id}`);
      if (storedExpiry) {
        churchLicenceExpiry = new Date(storedExpiry);
        hasChurchLicence = churchLicenceExpiry > now;
      } else {
        // Fetch from database
        const { data: church } = await supabase
          .from('churches')
          .select('licence_expiry')
          .eq('id', couple.church_id)
          .single();

        if (church?.licence_expiry) {
          churchLicenceExpiry = new Date(church.licence_expiry);
          hasChurchLicence = churchLicenceExpiry > now;
          // Cache it
          await AsyncStorage.setItem(
            `${CHURCH_LICENCE_EXPIRY_KEY}_${couple.church_id}`,
            church.licence_expiry
          );
        }
      }
    }

    return {
      isPremium: isPremium || hasChurchLicence,
      premiumExpiry,
      churchLicenceExpiry,
      hasChurchLicence,
      isInTrial,
      daysRemaining,
    };
  } catch (error) {
    console.error('Error getting premium status:', error);
    return {
      isPremium: false,
      premiumExpiry: null,
      churchLicenceExpiry: null,
      hasChurchLicence: false,
      isInTrial: false,
      daysRemaining: null,
    };
  }
}

/**
 * Quick check if user has premium access
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const status = await getPremiumStatus();
  return status.isPremium;
}

// ─── Feature Limit Checkers ───────────────────────────────────────────────────

/**
 * Check if user can add more prayers (free: 10)
 */
export async function canAddPrayer(): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  if (status.isPremium) {
    return {
      feature: 'prayers',
      freeLimit: FREE_LIMITS.prayers,
      currentCount: FREE_LIMITS.prayers,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  // Get current prayer count
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return {
      feature: 'prayers',
      freeLimit: FREE_LIMITS.prayers,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
    .single();

  if (!couple) {
    return {
      feature: 'prayers',
      freeLimit: FREE_LIMITS.prayers,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { count } = await supabase
    .from('prayers')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', couple.id);

  const currentCount = count || 0;
  return {
    feature: 'prayers',
    freeLimit: FREE_LIMITS.prayers,
    currentCount,
    canAccess: currentCount < FREE_LIMITS.prayers,
    upgradeRequired: currentCount >= FREE_LIMITS.prayers,
  };
}

/**
 * Check if user can access a scripture topic (free: 3 topics)
 */
export function canAccessScriptureTopic(topicId: string, availableTopics: string[]): boolean {
  const freeTopics = ['finances', 'parenting', 'time'];
  if (freeTopics.includes(topicId.toLowerCase())) return true;
  // For premium topics, check async
  return true; // Let async check handle it
}

/**
 * Check async for scripture topic access
 */
export async function checkScriptureTopicAccess(topicId: string): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  const freeTopics = ['finances', 'parenting', 'time'];
  
  if (status.isPremium || freeTopics.includes(topicId.toLowerCase())) {
    return {
      feature: 'scriptureTopics',
      freeLimit: FREE_LIMITS.scriptureTopics,
      currentCount: FREE_LIMITS.scriptureTopics,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  // Count accessed topics (simplified - in real app would track this)
  return {
    feature: 'scriptureTopics',
    freeLimit: FREE_LIMITS.scriptureTopics,
    currentCount: 0, // Would track in DB
    canAccess: false,
    upgradeRequired: true,
  };
}

/**
 * Check if user can access a devotional day (free: days 1-3)
 */
export function canAccessDevotionalDay(dayNumber: number): boolean {
  return dayNumber <= FREE_LIMITS.devotionalDays;
}

/**
 * Check async for devotional access
 */
export async function checkDevotionalAccess(dayNumber: number): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  
  if (status.isPremium) {
    return {
      feature: 'devotionalDays',
      freeLimit: FREE_LIMITS.devotionalDays,
      currentCount: dayNumber,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  return {
    feature: 'devotionalDays',
    freeLimit: FREE_LIMITS.devotionalDays,
    currentCount: dayNumber,
    canAccess: dayNumber <= FREE_LIMITS.devotionalDays,
    upgradeRequired: dayNumber > FREE_LIMITS.devotionalDays,
  };
}

/**
 * Check if user can view more check-in history (free: 3)
 */
export async function checkCheckinHistoryAccess(): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  if (status.isPremium) {
    return {
      feature: 'checkinHistory',
      freeLimit: FREE_LIMITS.checkinHistory,
      currentCount: FREE_LIMITS.checkinHistory,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return {
      feature: 'checkinHistory',
      freeLimit: FREE_LIMITS.checkinHistory,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
    .single();

  if (!couple) {
    return {
      feature: 'checkinHistory',
      freeLimit: FREE_LIMITS.checkinHistory,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { count } = await supabase
    .from('checkin_answers')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', couple.id);

  const currentCount = count || 0;
  return {
    feature: 'checkinHistory',
    freeLimit: FREE_LIMITS.checkinHistory,
    currentCount,
    canAccess: currentCount < FREE_LIMITS.checkinHistory || status.isPremium,
    upgradeRequired: currentCount >= FREE_LIMITS.checkinHistory && !status.isPremium,
  };
}

/**
 * Check if user can add more bucket list items (free: 5)
 */
export async function checkBucketListAccess(): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  if (status.isPremium) {
    return {
      feature: 'bucketListItems',
      freeLimit: FREE_LIMITS.bucketListItems,
      currentCount: FREE_LIMITS.bucketListItems,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return {
      feature: 'bucketListItems',
      freeLimit: FREE_LIMITS.bucketListItems,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
    .single();

  if (!couple) {
    return {
      feature: 'bucketListItems',
      freeLimit: FREE_LIMITS.bucketListItems,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { count } = await supabase
    .from('bucket_list')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', couple.id);

  const currentCount = count || 0;
  return {
    feature: 'bucketListItems',
    freeLimit: FREE_LIMITS.bucketListItems,
    currentCount,
    canAccess: currentCount < FREE_LIMITS.bucketListItems,
    upgradeRequired: currentCount >= FREE_LIMITS.bucketListItems,
  };
}

/**
 * Check if user can add bucket list photos (premium only)
 */
export async function canAddBucketListPhoto(): Promise<boolean> {
  return hasPremiumAccess();
}

/**
 * Check if user can add more journal letters (free: 2)
 */
export async function checkJournalAccess(): Promise<FeatureLimit> {
  const status = await getPremiumStatus();
  if (status.isPremium) {
    return {
      feature: 'journalLetters',
      freeLimit: FREE_LIMITS.journalLetters,
      currentCount: FREE_LIMITS.journalLetters,
      canAccess: true,
      upgradeRequired: false,
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return {
      feature: 'journalLetters',
      freeLimit: FREE_LIMITS.journalLetters,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
    .single();

  if (!couple) {
    return {
      feature: 'journalLetters',
      freeLimit: FREE_LIMITS.journalLetters,
      currentCount: 0,
      canAccess: false,
      upgradeRequired: true,
    };
  }

  const { count } = await supabase
    .from('journal_letters')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', couple.id);

  const currentCount = count || 0;
  return {
    feature: 'journalLetters',
    freeLimit: FREE_LIMITS.journalLetters,
    currentCount,
    canAccess: currentCount < FREE_LIMITS.journalLetters,
    upgradeRequired: currentCount >= FREE_LIMITS.journalLetters,
  };
}

/**
 * Check if user can access time capsule (premium only)
 */
export async function canAccessTimeCapsule(): Promise<boolean> {
  return hasPremiumAccess();
}

/**
 * Check if user can access custom plans (premium only)
 */
export async function canAccessCustomPlans(): Promise<boolean> {
  return hasPremiumAccess();
}

/**
 * Check if user can access audio devotionals (premium only)
 */
export async function canAccessAudioDevotionals(): Promise<boolean> {
  return hasPremiumAccess();
}

/**
 * Check if user can share image cards (premium only)
 */
export async function canShareImageCards(): Promise<boolean> {
  return hasPremiumAccess();
}

/**
 * Check if user can view full insights (premium only)
 */
export async function canViewFullInsights(): Promise<boolean> {
  return hasPremiumAccess();
}

// ─── Referral System ───────────────────────────────────────────────────────────

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get referral info for current user
 */
export async function getReferralInfo(): Promise<{
  referralCode: string | null;
  referredBy: string | null;
  referralCount: number;
  monthsEarned: number;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        referralCode: null,
        referredBy: null,
        referralCount: 0,
        monthsEarned: 0,
      };
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('referral_code, referred_by')
      .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
      .single();

    if (!couple) {
      return {
        referralCode: null,
        referredBy: null,
        referralCount: 0,
        monthsEarned: 0,
      };
    }

    // Count how many couples have this user referred
    const { count: referralCount } = await supabase
      .from('couples')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', couple.referral_code);

    return {
      referralCode: couple.referral_code,
      referredBy: couple.referred_by,
      referralCount: referralCount || 0,
      monthsEarned: (referralCount || 0) * 1, // 1 month per referral
    };
  } catch (error) {
    console.error('Error getting referral info:', error);
    return {
      referralCode: null,
      referredBy: null,
      referralCount: 0,
      monthsEarned: 0,
    };
  }
}

/**
 * Process referral on first check-in
 * Called when a couple submits their first check-in
 */
export async function processReferralOnFirstCheckin(coupleId: string): Promise<{
  success: boolean;
  rewardApplied: boolean;
  monthsEarned: number;
}> {
  try {
    // Get the couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('referral_code, referred_by, premium_expiry')
      .eq('id', coupleId)
      .single();

    if (coupleError || !couple) {
      return { success: false, rewardApplied: false, monthsEarned: 0 };
    }

    // Check if this is the first check-in for this couple
    const { count } = await supabase
      .from('checkin_answers')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', coupleId);

    if (count && count > 1) {
      // Not the first check-in
      return { success: true, rewardApplied: false, monthsEarned: 0 };
    }

    let monthsEarned = 0;
    let rewardApplied = false;

    // If referred by another couple, reward both
    if (couple.referred_by) {
      // Find the referring couple
      const { data: referringCouple } = await supabase
        .from('couples')
        .select('id, premium_expiry')
        .eq('referral_code', couple.referred_by)
        .single();

      if (referringCouple) {
        // Calculate new expiry for referred couple (this couple)
        const currentExpiry = couple.premium_expiry 
          ? new Date(couple.premium_expiry) 
          : new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + REFERRAL_REWARD_DAYS);

        // Add 30 days premium to this couple
        await supabase
          .from('couples')
          .update({ 
            premium: true,
            premium_expiry: newExpiry.toISOString(),
          })
          .eq('id', coupleId);

        // Add 30 days premium to referring couple
        const referrerExpiry = referringCouple.premium_expiry
          ? new Date(referringCouple.premium_expiry)
          : new Date();
        const newReferrerExpiry = new Date(referrerExpiry);
        newReferrerExpiry.setDate(newReferrerExpiry.getDate() + REFERRAL_REWARD_DAYS);

        await supabase
          .from('couples')
          .update({
            premium: true,
            premium_expiry: newReferrerExpiry.toISOString(),
          })
          .eq('id', referringCouple.id);

        monthsEarned = 1;
        rewardApplied = true;

        // TODO: Send push notification to both couples
        // This would use expo-notifications to send:
        // "You earned a free month! [Name] completed their first check-in."
      }
    }

    return { success: true, rewardApplied, monthsEarned };
  } catch (error) {
    console.error('Error processing referral:', error);
    return { success: false, rewardApplied: false, monthsEarned: 0 };
  }
}

/**
 * Apply a referral code during signup/setup
 */
export async function applyReferralCode(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, referred_by, referral_code')
      .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
      .single();

    if (coupleError || !couple) {
      return { success: false, error: 'Couple not found' };
    }

    // Don't allow if already referred
    if (couple.referred_by) {
      return { success: false, error: 'Referral code already applied' };
    }

    // Don't allow self-referral
    if (couple.referral_code && couple.referral_code === code.toUpperCase()) {
      return { success: false, error: 'Cannot use your own referral code' };
    }

    // Validate the referral code exists
    const { data: referringCouple } = await supabase
      .from('couples')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (!referringCouple) {
      return { success: false, error: 'Invalid referral code' };
    }

    // Apply the referral
    const { error: updateError } = await supabase
      .from('couples')
      .update({ referred_by: code.toUpperCase() })
      .eq('id', couple.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return { success: false, error: 'Failed to apply referral code' };
  }
}

// ─── Subscription Management ─────────────────────────────────────────────────

/**
 * Start a free trial (7 days)
 */
export async function startFreeTrial(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('id, premium_expiry')
      .or(`user_id_1.eq.${session.user.id},user_id_2.eq.${session.user.id}`)
      .single();

    if (!couple) {
      return { success: false, error: 'Couple not found' };
    }

    // Calculate trial end date
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    // If already has premium expiry, extend it
    let newExpiry: Date;
    if (couple.premium_expiry) {
      const currentExpiry = new Date(couple.premium_expiry);
      if (currentExpiry > new Date()) {
        // Extend existing premium
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + TRIAL_DAYS);
      } else {
        newExpiry = trialEnd;
      }
    } else {
      newExpiry = trialEnd;
    }

    const { error } = await supabase
      .from('couples')
      .update({
        premium: true,
        premium_expiry: newExpiry.toISOString(),
      })
      .eq('id', couple.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error starting free trial:', error);
    return { success: false, error: 'Failed to start trial' };
  }
}

/**
 * Cancel subscription (marks as non-renewing)
 */
export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  // In a real app, this would call the payment provider's API
  // For now, we just update the local state
  return { success: true };
}

/**
 * Restore purchases (for when user reinstalls app)
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  // In a real app, this would verify with the payment provider
  // For now, just check current premium status
  const status = await getPremiumStatus();
  return {
    success: true,
    isPremium: status.isPremium,
  };
}
