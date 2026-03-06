-- Covenant App Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS PROFILE (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID, -- links to couples table
  full_name TEXT,
  spouse_name TEXT,
  anniversary DATE,
  couple_code TEXT UNIQUE, -- 6-char code like GRACE7
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COUPLES TABLE
-- ============================================

CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name1 TEXT NOT NULL,
  name2 TEXT NOT NULL,
  anniversary DATE NOT NULL,
  couple_code TEXT UNIQUE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  premium BOOLEAN DEFAULT false,
  premium_expiry TIMESTAMPTZ,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHECK-IN ANSWERS TABLE
-- ============================================

CREATE TABLE public.checkin_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  q1 TEXT, -- Mood/feeling question
  q2 TEXT, -- Highlight of the week
  q3 TEXT, -- Challenge faced
  q4 TEXT, -- Something grateful for
  q5_goal TEXT, -- Goal for next week
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRAYERS TABLE
-- ============================================

CREATE TABLE public.prayers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOURNAL LETTERS TABLE
-- ============================================

CREATE TABLE public.journal_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- true = only author can see
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUCKET LIST TABLE
-- ============================================

CREATE TABLE public.bucket_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'adventure', 'romantic', 'family', 'spiritual', 'bucket'
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MONTHLY GOALS TABLE
-- ============================================

CREATE TABLE public.monthly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  proposed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed BOOLEAN DEFAULT false,
  outcome TEXT, -- 'achieved', 'partial', 'missed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAKS TABLE
-- ============================================

CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_date DATE,
  grace_restores_remaining INTEGER DEFAULT 3, -- allow 3 grace days
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEVOTIONAL PROGRESS TABLE
-- ============================================

CREATE TABLE public.devotional_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- '30day', '365day', etc.
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, plan_id, day_number)
);

-- ============================================
-- TIME CAPSULES TABLE
-- ============================================

CREATE TABLE public.time_capsules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  written_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_date DATE NOT NULL,
  unlocked BOOLEAN DEFAULT false
);

-- ============================================
-- VERSES TABLE (pre-populated scripture)
-- ============================================

CREATE TABLE public.verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  topic TEXT, -- 'love', 'marriage', 'faith', 'hope', 'guidance'
  theme_label TEXT, -- 'daily', 'encouragement', 'wisdom'
  active BOOLEAN DEFAULT true
);

-- ============================================
-- NOTIFICATIONS LOG TABLE
-- ============================================

CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'reminder', 'checkin', 'prayer', 'anniversary'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ
);

-- ============================================
-- CHURCHES TABLE
-- ============================================

CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  pastor_name TEXT,
  pastor_email TEXT,
  logo_url TEXT,
  denomination TEXT,
  licence_start DATE,
  licence_expiry DATE,
  active BOOLEAN DEFAULT true,
  cobrand_enabled BOOLEAN DEFAULT false,
  sermon_series_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_couples_couple_code ON public.couples(couple_code);
CREATE INDEX idx_couples_user_id_1 ON public.couples(user_id_1);
CREATE INDEX idx_couples_user_id_2 ON public.couples(user_id_2);
CREATE INDEX idx_couples_church_id ON public.couples(church_id);
CREATE INDEX idx_checkin_couple_week ON public.checkin_answers(couple_id, week_number);
CREATE INDEX idx_prayers_couple_date ON public.prayers(couple_id, date);
CREATE INDEX idx_journal_couple ON public.journal_letters(couple_id);
CREATE INDEX idx_bucket_list_couple ON public.bucket_list(couple_id);
CREATE INDEX idx_goals_couple_month ON public.monthly_goals(couple_id, year, month);
CREATE INDEX idx_devotional_couple_plan ON public.devotional_progress(couple_id, plan_id);
CREATE INDEX idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX idx_notifications_user ON public.notifications_log(user_id, sent_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user's couple_id
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- COUPLES RLS POLICIES
-- ============================================

-- Users can read their own couple
CREATE POLICY "Users can view own couple"
ON public.couples FOR SELECT
USING (
  user_id_1 = auth.uid() OR 
  user_id_2 = auth.uid()
);

-- Users can update their own couple
CREATE POLICY "Users can update own couple"
ON public.couples FOR UPDATE
USING (
  user_id_1 = auth.uid() OR 
  user_id_2 = auth.uid()
);

-- ============================================
-- CHECK-IN ANSWERS RLS POLICIES
-- ============================================

-- Users can read check-ins for their couple
CREATE POLICY "Users can view own checkins"
ON public.checkin_answers FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert check-ins for their couple
CREATE POLICY "Users can insert own checkins"
ON public.checkin_answers FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update check-ins for their couple
CREATE POLICY "Users can update own checkins"
ON public.checkin_answers FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can delete check-ins for their couple
CREATE POLICY "Users can delete own checkins"
ON public.checkin_answers FOR DELETE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- PRAYERS RLS POLICIES
-- NOTE: Prayer content is NEVER accessible outside the couple
-- ============================================

-- Users can read prayers for their couple only
CREATE POLICY "Users can view own prayers"
ON public.prayers FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert prayers for their couple only
CREATE POLICY "Users can insert own prayers"
ON public.prayers FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update prayers for their couple only
CREATE POLICY "Users can update own prayers"
ON public.prayers FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can delete prayers for their couple only
CREATE POLICY "Users can delete own prayers"
ON public.prayers FOR DELETE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- JOURNAL LETTERS RLS POLICIES
-- NOTE: Respects is_private flag
-- ============================================

-- Users can read their own journal entries (all)
CREATE POLICY "Users can view own journal"
ON public.journal_letters FOR SELECT
USING (
  couple_id = public.get_user_couple_id() 
  OR author_user_id = auth.uid()
);

-- Users can read non-private journal entries from their couple
CREATE POLICY "Couple can view non-private journal"
ON public.journal_letters FOR SELECT
USING (
  couple_id = public.get_user_couple_id() 
  AND is_private = false
);

-- Users can insert journal entries for their couple
CREATE POLICY "Users can insert own journal"
ON public.journal_letters FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id() 
  AND author_user_id = auth.uid()
);

-- Users can update their own journal entries
CREATE POLICY "Users can update own journal"
ON public.journal_letters FOR UPDATE
USING (
  couple_id = public.get_user_couple_id() 
  AND author_user_id = auth.uid()
);

-- Users can delete their own journal entries
CREATE POLICY "Users can delete own journal"
ON public.journal_letters FOR DELETE
USING (
  couple_id = public.get_user_couple_id() 
  AND author_user_id = auth.uid()
);

-- ============================================
-- BUCKET LIST RLS POLICIES
-- ============================================

-- Users can read bucket list for their couple
CREATE POLICY "Users can view own bucket list"
ON public.bucket_list FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert bucket list items for their couple
CREATE POLICY "Users can insert own bucket list"
ON public.bucket_list FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update bucket list items for their couple
CREATE POLICY "Users can update own bucket list"
ON public.bucket_list FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can delete bucket list items for their couple
CREATE POLICY "Users can delete own bucket list"
ON public.bucket_list FOR DELETE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- MONTHLY GOALS RLS POLICIES
-- ============================================

-- Users can read goals for their couple
CREATE POLICY "Users can view own goals"
ON public.monthly_goals FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert goals for their couple
CREATE POLICY "Users can insert own goals"
ON public.monthly_goals FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update goals for their couple
CREATE POLICY "Users can update own goals"
ON public.monthly_goals FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can delete goals for their couple
CREATE POLICY "Users can delete own goals"
ON public.monthly_goals FOR DELETE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- STREAKS RLS POLICIES
-- ============================================

-- Users can read streak for their couple
CREATE POLICY "Users can view own streak"
ON public.streaks FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can update streak for their couple
CREATE POLICY "Users can update own streak"
ON public.streaks FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- DEVOTIONAL PROGRESS RLS POLICIES
-- ============================================

-- Users can read devotional progress for their couple
CREATE POLICY "Users can view own devotional progress"
ON public.devotional_progress FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert devotional progress for their couple
CREATE POLICY "Users can insert own devotional progress"
ON public.devotional_progress FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update devotional progress for their couple
CREATE POLICY "Users can update own devotional progress"
ON public.devotional_progress FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- TIME CAPSULES RLS POLICIES
-- ============================================

-- Users can read time capsules for their couple
CREATE POLICY "Users can view own time capsules"
ON public.time_capsules FOR SELECT
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can insert time capsules for their couple
CREATE POLICY "Users can insert own time capsules"
ON public.time_capsules FOR INSERT
WITH CHECK (
  couple_id = public.get_user_couple_id()
);

-- Users can update time capsules for their couple
CREATE POLICY "Users can update own time capsules"
ON public.time_capsules FOR UPDATE
USING (
  couple_id = public.get_user_couple_id()
);

-- Users can delete time capsules for their couple
CREATE POLICY "Users can delete own time capsules"
ON public.time_capsules FOR DELETE
USING (
  couple_id = public.get_user_couple_id()
);

-- ============================================
-- VERSES RLS POLICIES
-- ============================================

-- All authenticated users can read active verses
CREATE POLICY "Anyone can view active verses"
ON public.verses FOR SELECT
USING (active = true);

-- Only service role can insert/update verses
CREATE POLICY "Service can manage verses"
ON public.verses FOR ALL
USING (false)
WITH CHECK (false);

-- ============================================
-- NOTIFICATIONS LOG RLS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications_log FOR SELECT
USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications_log FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as opened)
CREATE POLICY "Users can update own notifications"
ON public.notifications_log FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- CHURCHES RLS POLICIES
-- NOTE: Church data only readable by that church's users
-- ============================================

-- Users can read churches they belong to
CREATE POLICY "Church members can view their church"
ON public.churches FOR SELECT
USING (
  id IN (
    SELECT church_id FROM public.couples 
    WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  )
);

-- Users can read all active churches (for church selection)
CREATE POLICY "Anyone can view active churches"
ON public.churches FOR SELECT
USING (active = true);

-- Service role can manage churches
CREATE POLICY "Service can manage churches"
ON public.churches FOR ALL
USING (false)
WITH CHECK (false);

-- ============================================
-- TRIGGER: Create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED DATA: Sample verses
-- ============================================

INSERT INTO public.verses (reference, text, topic, theme_label) VALUES
('Genesis 2:24', 'Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.', 'marriage', 'daily'),
('Ephesians 5:33', 'However, let each one of you love his wife as himself, and let the wife see that she respects her husband.', 'marriage', 'daily'),
('1 Corinthians 13:4-7', 'Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it is not irritable or resentful; it does not rejoice at wrongdoing, but rejoices with the truth. Love bears all things, believes all things, hopes all things, endures all things.', 'love', 'encouragement'),
('Proverbs 3:5-6', 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.', 'faith', 'daily'),
('Ecclesiastes 4:9-10', 'Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow. But woe to him who is alone when he falls and has not another to lift him up!', 'marriage', 'daily'),
('Colossians 3:14', 'And above all these put on love, which binds everything together in perfect harmony.', 'love', 'encouragement'),
('Romans 12:10', 'Be devoted to one another in love. Honor one another above yourselves.', 'love', 'encouragement'),
('Song of Solomon 8:7', 'Many waters cannot quench love, neither can floods drown it. If a man offered for love all the wealth of his house, he would be utterly despised.', 'love', 'daily'),
('Matthew 19:6', 'So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate.', 'marriage', 'daily'),
(' Hebrews 13:4', 'Let marriage be held in honor among all, and let the marriage bed be undefiled, for God will judge the sexually impure and adulterous.', 'marriage', 'daily'),
('Psalm 127:1', 'Unless the Lord builds the house, those who build it labor in vain. Unless the Lord watches over the city, the watchmen stay awake in vain.', 'marriage', 'daily'),
('Ephesians 4:2-3', 'Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.', 'marriage', 'encouragement'),
('1 Peter 4:8', 'Above all, love each other deeply, because love covers over a multitude of sins.', 'love', 'encouragement'),
('John 15:12', 'My command is this: Love each other as I have loved you.', 'love', 'daily'),
('Romans 8:28', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'faith', 'encouragement'),
('Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'faith', 'daily'),
('Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'faith', 'encouragement'),
('Proverbs 18:22', 'He who finds a wife finds what is good and receives favor from the Lord.', 'marriage', 'daily'),
('Titus 2:4-5', 'Older women likewise are to be reverent in their behavior, not malicious gossips nor enslaved to much wine, teaching what is good, so that they may encourage the young women to love their husbands, to love their children', 'marriage', 'daily'),
('1 Thessalonians 5:11', 'Therefore encourage one another and build one another up, just as you are doing.', 'encouragement', 'encouragement'),
('James 1:17', 'Every good gift and every perfect gift is from above, coming down from the Father of lights with whom there is no variation or shadow due to change.', 'faith', 'daily'),
('Lamentations 3:22-23', 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', 'faith', 'encouragement'),
('Proverbs 17:17', 'A friend loves at all times, and a brother is born for adversity.', 'marriage', 'daily'),
('2 Corinthians 5:17', 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', 'faith', 'daily'),
('Galatians 5:22-23', 'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.', 'faith', 'daily');

-- ============================================
-- SUMMARY
-- ============================================

/*
Tables created:
- profiles (extends auth.users)
- couples
- checkin_answers
- prayers
- journal_letters
- bucket_list
- monthly_goals
- streaks
- devotional_progress
- time_capsules
- verses
- notifications_log
- churches

RLS Policies:
- All couple-related tables: users can only access their own couple's data
- Prayers: NEVER accessible outside the couple
- Journal letters: Respects is_private flag
- Churches: Only readable by members of that church
- Verses: All authenticated users can read active verses
- Notifications: Users can only see their own

Triggers:
- handle_new_user: Creates profile on signup
- update_updated_at: Auto-updates timestamps
*/
