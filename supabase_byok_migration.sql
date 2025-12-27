-- MindCureAI BYOK Database Migration
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension (free in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add BYOK columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS encrypted_gemini_key TEXT,
ADD COLUMN IF NOT EXISTS api_key_added_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'byok_free';

-- Create session usage tracking table
CREATE TABLE IF NOT EXISTS session_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_date)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_usage_user_date 
ON session_usage(user_id, session_date);

-- Enable RLS on session_usage
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own usage" ON session_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON session_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON session_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to get monthly session count
CREATE OR REPLACE FUNCTION get_monthly_session_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(session_count), 0) INTO total_count
    FROM session_usage
    WHERE user_id = p_user_id
    AND session_date >= date_trunc('month', CURRENT_DATE)
    AND session_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    
    RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment session count (called when user starts a session)
CREATE OR REPLACE FUNCTION increment_session_count(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_count INTEGER;
    session_limit INTEGER := 5;
    user_tier TEXT;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM profiles WHERE id = p_user_id;
    
    -- Set limit based on tier
    IF user_tier IN ('byok_pro', 'premium_plus', 'enterprise') THEN
        session_limit := 999999; -- Unlimited
    END IF;
    
    -- Get current monthly count
    current_count := get_monthly_session_count(p_user_id);
    
    -- Check if limit exceeded
    IF current_count >= session_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'current_count', current_count,
            'limit', session_limit,
            'message', 'Session limit reached. Upgrade to Pro for unlimited sessions.'
        );
    END IF;
    
    -- Increment count
    INSERT INTO session_usage (user_id, session_date, session_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, session_date)
    DO UPDATE SET 
        session_count = session_usage.session_count + 1,
        updated_at = NOW();
    
    RETURN json_build_object(
        'allowed', true,
        'current_count', current_count + 1,
        'limit', session_limit,
        'remaining', session_limit - current_count - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can start session
CREATE OR REPLACE FUNCTION can_start_session(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_count INTEGER;
    session_limit INTEGER := 5;
    user_tier TEXT;
    has_api_key BOOLEAN;
BEGIN
    -- Get user info
    SELECT 
        subscription_tier,
        encrypted_gemini_key IS NOT NULL
    INTO user_tier, has_api_key
    FROM profiles WHERE id = p_user_id;
    
    -- Check if has API key
    IF NOT has_api_key AND user_tier NOT IN ('premium_plus') THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'no_api_key',
            'message', 'Please add your Gemini API key in Settings.'
        );
    END IF;
    
    -- Set limit based on tier
    IF user_tier IN ('byok_pro', 'premium_plus', 'enterprise') THEN
        session_limit := 999999;
    END IF;
    
    current_count := get_monthly_session_count(p_user_id);
    
    RETURN json_build_object(
        'allowed', current_count < session_limit,
        'current_count', current_count,
        'limit', session_limit,
        'remaining', GREATEST(0, session_limit - current_count),
        'tier', user_tier,
        'has_api_key', has_api_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_monthly_session_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_session_count TO authenticated;
GRANT EXECUTE ON FUNCTION can_start_session TO authenticated;
