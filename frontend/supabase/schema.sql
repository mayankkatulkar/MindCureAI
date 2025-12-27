-- MindCureAI Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  mental_health_goals TEXT[],
  current_challenges TEXT[],
  preferred_therapy_type TEXT,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  privacy_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  -- Session tracking for free tier
  sessions_used INTEGER DEFAULT 0,
  session_limit INTEGER DEFAULT 5, -- Free = 5, Pro/Enterprise = unlimited (NULL or 999999)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
  ON public.subscriptions FOR ALL 
  USING (auth.role() = 'service_role');

-- =============================================
-- THERAPY SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.therapy_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('ai', 'therapist', 'peer')),
  duration_minutes INTEGER,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 10),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 10),
  tools_used TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions" 
  ON public.therapy_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
  ON public.therapy_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- WELLNESS METRICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.wellness_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mental_health_score INTEGER CHECK (mental_health_score BETWEEN 0 AND 100),
  productivity_score INTEGER CHECK (productivity_score BETWEEN 0 AND 100),
  streak_days INTEGER DEFAULT 0,
  goals_achieved INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_at)
);

-- Enable Row Level Security
ALTER TABLE public.wellness_metrics ENABLE ROW LEVEL SECURITY;

-- Metrics policies
CREATE POLICY "Users can view own metrics" 
  ON public.wellness_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" 
  ON public.wellness_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" 
  ON public.wellness_metrics FOR UPDATE 
  USING (auth.uid() = user_id);

-- =============================================
-- THERAPIST BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.therapist_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  therapist_id TEXT NOT NULL,
  therapist_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 50,
  session_type TEXT DEFAULT 'video' CHECK (session_type IN ('video', 'voice', 'in-person')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'canceled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.therapist_bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view own bookings" 
  ON public.therapist_bookings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" 
  ON public.therapist_bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
  ON public.therapist_bookings FOR UPDATE 
  USING (auth.uid() = user_id);

-- =============================================
-- FUNCTION: Handle new user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  INSERT INTO public.wellness_metrics (user_id, mental_health_score, productivity_score)
  VALUES (NEW.id, 50, 50);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER: Create profile on signup
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.therapist_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ADD USER TYPE TO PROFILES
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' 
  CHECK (user_type IN ('user', 'therapist', 'admin'));

-- =============================================
-- THERAPISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.therapists (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_state TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate DECIMAL(10,2) DEFAULT 75.00,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  availability JSONB DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  profile_image_url TEXT,
  video_intro_url TEXT,
  accepting_new_clients BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified therapists" 
  ON public.therapists FOR SELECT 
  USING (verified = true);

CREATE POLICY "Therapists can update own profile" 
  ON public.therapists FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Therapists can insert own profile" 
  ON public.therapists FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =============================================
-- PEER CONNECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.peer_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  matched_on TEXT[] DEFAULT '{}', -- shared challenges
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'blocked')),
  room_name TEXT, -- LiveKit room for voice/video
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own peer connections" 
  ON public.peer_connections FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create peer connections" 
  ON public.peer_connections FOR INSERT 
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update own peer connections" 
  ON public.peer_connections FOR UPDATE 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =============================================
-- PEER MATCHING QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.peer_matching_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  challenges TEXT[] DEFAULT '{}',
  preferred_age_range TEXT,
  looking_for TEXT DEFAULT 'peer' CHECK (looking_for IN ('peer', 'listener', 'mentor')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.peer_matching_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own queue entry" 
  ON public.peer_matching_queue FOR ALL 
  USING (auth.uid() = user_id);

-- =============================================
-- CONVERSATION SCORES TABLE (AI Analysis)
-- =============================================
CREATE TABLE IF NOT EXISTS public.conversation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
  depression_level INTEGER CHECK (depression_level BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  insights TEXT[],
  recommended_actions TEXT[],
  crisis_detected BOOLEAN DEFAULT false,
  conversation_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation scores" 
  ON public.conversation_scores FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert scores" 
  ON public.conversation_scores FOR INSERT 
  WITH CHECK (true); -- API will use service role

-- =============================================
-- FUN TASKS TABLE (Gen Z Mode)
-- =============================================
CREATE TABLE IF NOT EXISTS public.fun_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'block_ex', 'touch_grass', 'rage_playlist', 'gratitude_gram',
    'meme_therapy', 'breathing_game', 'hydration_check', 'stretch_break',
    'journal_prompt', 'affirmation', 'music_therapy', 'walk_outside'
  )),
  task_name TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  triggered_by TEXT, -- conversation context that triggered it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.fun_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fun tasks" 
  ON public.fun_tasks FOR ALL 
  USING (auth.uid() = user_id);

-- =============================================
-- ACHIEVEMENTS TABLE (Gamification)
-- =============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'first_session', 'week_streak', 'month_streak', 'peer_helper',
    'therapist_session', 'task_master', 'mood_improved', 'crisis_overcome',
    'community_member', 'wellness_warrior', 'mindfulness_master'
  )),
  achievement_name TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" 
  ON public.achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can grant achievements" 
  ON public.achievements FOR INSERT 
  WITH CHECK (true);

-- =============================================
-- THERAPIST SESSION REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.therapist_session_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.therapists(id) ON DELETE CASCADE,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'crisis')),
  issue_summary TEXT,
  preferred_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'canceled')),
  room_name TEXT, -- LiveKit room for session
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.therapist_session_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session requests" 
  ON public.therapist_session_requests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Therapists can view requests for them" 
  ON public.therapist_session_requests FOR SELECT 
  USING (auth.uid() = therapist_id);

CREATE POLICY "Users can create session requests" 
  ON public.therapist_session_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Therapists can update their requests" 
  ON public.therapist_session_requests FOR UPDATE 
  USING (auth.uid() = therapist_id);

-- =============================================
-- FUNCTION: Match peers with similar challenges
-- =============================================
CREATE OR REPLACE FUNCTION public.find_peer_match(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  matched_user_id UUID;
  user_challenges TEXT[];
BEGIN
  -- Get the user's challenges from queue
  SELECT challenges INTO user_challenges 
  FROM public.peer_matching_queue 
  WHERE user_id = p_user_id AND status = 'waiting';
  
  -- Find another user with overlapping challenges
  SELECT user_id INTO matched_user_id
  FROM public.peer_matching_queue
  WHERE user_id != p_user_id 
    AND status = 'waiting'
    AND challenges && user_challenges -- has overlapping challenges
  ORDER BY created_at ASC
  LIMIT 1;
  
  RETURN matched_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_therapists_updated_at
  BEFORE UPDATE ON public.therapists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at
  BEFORE UPDATE ON public.therapist_session_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AI PREFERENCES COLUMNS
-- =============================================
-- Add voice and AI mode preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_voice TEXT DEFAULT 'Kore'
  CHECK (preferred_voice IN ('Kore', 'Aoede', 'Charon', 'Fenrir', 'Puck'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS genz_mode BOOLEAN DEFAULT false;

-- =============================================
-- CHAT SESSIONS TABLE (AI Conversation History)
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Session',
  summary TEXT,
  voice_used TEXT DEFAULT 'Kore',
  genz_mode BOOLEAN DEFAULT false,
  duration_seconds INTEGER DEFAULT 0,
  mood_before TEXT,
  mood_after TEXT,
  transcript JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user session lookups
-- Index for faster user session lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- =============================================
-- SUPPORT GROUPS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.support_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  max_members INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  meeting_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view active groups
CREATE POLICY "Anyone can view active support groups"
  ON public.support_groups FOR SELECT
  USING (is_active = true);

-- Group membership
CREATE TABLE IF NOT EXISTS public.support_group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.support_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.support_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group memberships"
  ON public.support_group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups"
  ON public.support_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.support_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default support groups
INSERT INTO public.support_groups (name, description, topics, member_count, meeting_schedule) VALUES
  ('Anxiety Support Circle', 'A safe space to share and overcome anxiety together', ARRAY['Anxiety', 'Stress', 'Panic Attacks'], 24, 'Daily 7PM EST'),
  ('Depression Warriors', 'Supporting each other through difficult times', ARRAY['Depression', 'Mood', 'Recovery'], 18, 'Mon, Wed, Fri 6PM EST'),
  ('Mindfulness & Meditation', 'Learn and practice mindfulness techniques together', ARRAY['Mindfulness', 'Meditation', 'Self-care'], 32, 'Tue, Thu 8PM EST'),
  ('Work-Life Balance', 'Finding harmony between career and personal life', ARRAY['Work Stress', 'Burnout', 'Balance'], 15, 'Weekends 10AM EST'),
  ('Grief & Loss Support', 'A compassionate community for those dealing with loss', ARRAY['Grief', 'Loss', 'Healing'], 12, 'Wed, Sun 7PM EST')
ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);

