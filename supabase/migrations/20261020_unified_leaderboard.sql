-- ==============================================================================
-- CCC GURU UNIFIED LEADERBOARD - DATABASE MIGRATION
-- Migration: 20261020_unified_leaderboard.sql
-- Description: Adds private Telegram identity mappings, public leaderboard profiles,
--              append-only point events ledger, atomic score finalization function,
--              and Daily/Monthly/All-Time leaderboard RPCs using Asia/Kolkata timezone.
-- ==============================================================================

-- 1. Create private schema for Telegram identities
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- 2. Create public.leaderboard_profiles Table
CREATE TABLE IF NOT EXISTS public.leaderboard_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on leaderboard_profiles
ALTER TABLE public.leaderboard_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone"
            ON public.leaderboard_profiles
            FOR SELECT
            TO anon, authenticated
            USING (is_public = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile"
            ON public.leaderboard_profiles
            FOR SELECT
            TO authenticated
            USING (auth.uid() = auth_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile"
            ON public.leaderboard_profiles
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = auth_user_id)
            WITH CHECK (auth.uid() = auth_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_profiles' AND policyname = 'Service role full access on leaderboard_profiles') THEN
        CREATE POLICY "Service role full access on leaderboard_profiles"
            ON public.leaderboard_profiles
            FOR ALL
            TO service_role 
            USING (true);
    END IF;
END $$;

-- 3. Create private.telegram_identities Table
CREATE TABLE IF NOT EXISTS private.telegram_identities (
    telegram_user_id BIGINT PRIMARY KEY,
    canonical_user_id UUID NOT NULL REFERENCES public.leaderboard_profiles(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    auth_date TIMESTAMP WITH TIME ZONE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_telegram_canonical UNIQUE (canonical_user_id)
);

CREATE INDEX IF NOT EXISTS idx_tg_identities_canonical ON private.telegram_identities(canonical_user_id);

-- 4. Add canonical_user_id reference to student_test_attempts
ALTER TABLE public.student_test_attempts 
ADD COLUMN IF NOT EXISTS canonical_user_id UUID REFERENCES public.leaderboard_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_attempts_canonical_user ON public.student_test_attempts(canonical_user_id);

-- 5. Create public.leaderboard_point_events Table (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS public.leaderboard_point_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_user_id UUID NOT NULL REFERENCES public.leaderboard_profiles(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL UNIQUE REFERENCES public.student_test_attempts(id) ON DELETE CASCADE,
    test_item_id UUID NOT NULL REFERENCES public.test_series_items(id) ON DELETE CASCADE,
    points_awarded INT NOT NULL CHECK (points_awarded >= 0),
    correct_count INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_events_user ON public.leaderboard_point_events(canonical_user_id);
CREATE INDEX IF NOT EXISTS idx_point_events_created_at ON public.leaderboard_point_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_events_user_created ON public.leaderboard_point_events(canonical_user_id, created_at DESC);

-- Enable RLS on point events
ALTER TABLE public.leaderboard_point_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_point_events' AND policyname = 'Point events viewable for public profiles') THEN
        CREATE POLICY "Point events viewable for public profiles"
            ON public.leaderboard_point_events
            FOR SELECT
            TO anon, authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.leaderboard_profiles p 
                    WHERE p.id = canonical_user_id AND p.is_public = true
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_point_events' AND policyname = 'Service role full access on leaderboard_point_events') THEN
        CREATE POLICY "Service role full access on leaderboard_point_events"
            ON public.leaderboard_point_events
            FOR ALL
            TO service_role
            USING (true);
    END IF;
END $$;

-- 6. Restricted Scoring and Attempt Finalization Function (in private schema)
CREATE OR REPLACE FUNCTION private.finalize_attempt_and_award_points(
    p_attempt_id UUID,
    p_canonical_user_id UUID,
    p_correct_count INT,
    p_total_questions INT,
    p_attempted_count INT,
    p_incorrect_count INT,
    p_unanswered_count INT,
    p_score NUMERIC,
    p_accuracy NUMERIC,
    p_time_taken_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt RECORD;
    v_points_awarded INT;
    v_existing_event RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_attempt 
    FROM public.student_test_attempts 
    WHERE id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
    END IF;

    IF v_attempt.canonical_user_id IS NOT NULL AND v_attempt.canonical_user_id <> p_canonical_user_id THEN
        RAISE EXCEPTION 'Unauthorized attempt finalization';
    END IF;

    SELECT * INTO v_existing_event
    FROM public.leaderboard_point_events
    WHERE attempt_id = p_attempt_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'attempt_id', p_attempt_id,
            'points_awarded', v_existing_event.points_awarded,
            'is_duplicate', true,
            'status', v_attempt.status
        );
    END IF;

    v_points_awarded := GREATEST(0, p_correct_count);

    UPDATE public.student_test_attempts
    SET 
        canonical_user_id = p_canonical_user_id,
        status = 'evaluated',
        submitted_at = v_now,
        time_taken_seconds = p_time_taken_seconds,
        total_questions = p_total_questions,
        attempted_count = p_attempted_count,
        correct_count = p_correct_count,
        incorrect_count = p_incorrect_count,
        unanswered_count = p_unanswered_count,
        score = p_score,
        accuracy = p_accuracy,
        updated_at = v_now
    WHERE id = p_attempt_id;

    INSERT INTO public.leaderboard_point_events (
        canonical_user_id,
        attempt_id,
        test_item_id,
        points_awarded,
        correct_count,
        total_questions,
        created_at
    ) VALUES (
        p_canonical_user_id,
        p_attempt_id,
        v_attempt.test_item_id,
        v_points_awarded,
        p_correct_count,
        p_total_questions,
        v_now
    )
    ON CONFLICT (attempt_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', p_attempt_id,
        'points_awarded', v_points_awarded,
        'is_duplicate', false,
        'status', 'evaluated'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION private.finalize_attempt_and_award_points(UUID, UUID, INT, INT, INT, INT, INT, NUMERIC, NUMERIC, INT) TO postgres, service_role;

-- 7. Public Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_period TEXT DEFAULT 'daily',
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    rank BIGINT,
    canonical_user_id UUID,
    display_name VARCHAR(100),
    avatar_url TEXT,
    points BIGINT,
    tests_completed BIGINT,
    last_active_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
    v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
    IF p_period = 'daily' THEN
        v_start_time := date_trunc('day', timezone('Asia/Kolkata', now())) AT TIME ZONE 'Asia/Kolkata';
    ELSIF p_period = 'monthly' THEN
        v_start_time := date_trunc('month', timezone('Asia/Kolkata', now())) AT TIME ZONE 'Asia/Kolkata';
    ELSE
        v_start_time := NULL;
    END IF;

    RETURN QUERY
    WITH user_period_points AS (
        SELECT 
            pe.canonical_user_id,
            SUM(pe.points_awarded)::BIGINT AS total_points,
            COUNT(pe.id)::BIGINT AS total_tests,
            MAX(pe.created_at) AS max_created_at
        FROM public.leaderboard_point_events pe
        WHERE (v_start_time IS NULL OR pe.created_at >= v_start_time)
        GROUP BY pe.canonical_user_id
    )
    SELECT 
        DENSE_RANK() OVER (ORDER BY upp.total_points DESC)::BIGINT AS rank,
        p.id AS canonical_user_id,
        p.display_name,
        p.avatar_url,
        upp.total_points AS points,
        upp.total_tests AS tests_completed,
        upp.max_created_at AS last_active_at
    FROM user_period_points upp
    JOIN public.leaderboard_profiles p ON p.id = upp.canonical_user_id
    WHERE p.is_public = true AND upp.total_points > 0
    ORDER BY upp.total_points DESC, upp.max_created_at ASC, p.display_name ASC
    LIMIT v_limit
    OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT, INT) TO anon, authenticated, service_role;

-- 8. User Personal Rank RPC
CREATE OR REPLACE FUNCTION public.get_user_leaderboard_rank(
    p_target_user_id UUID,
    p_period TEXT DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_profile RECORD;
    v_result RECORD;
BEGIN
    SELECT id, display_name, avatar_url, is_public INTO v_profile
    FROM public.leaderboard_profiles
    WHERE id = p_target_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found', false,
            'message', 'User profile not found'
        );
    END IF;

    IF p_period = 'daily' THEN
        v_start_time := date_trunc('day', timezone('Asia/Kolkata', now())) AT TIME ZONE 'Asia/Kolkata';
    ELSIF p_period = 'monthly' THEN
        v_start_time := date_trunc('month', timezone('Asia/Kolkata', now())) AT TIME ZONE 'Asia/Kolkata';
    ELSE
        v_start_time := NULL;
    END IF;

    WITH period_scores AS (
        SELECT 
            pe.canonical_user_id,
            SUM(pe.points_awarded)::BIGINT AS total_points,
            COUNT(pe.id)::BIGINT AS total_tests,
            MAX(pe.created_at) AS max_created_at,
            DENSE_RANK() OVER (ORDER BY SUM(pe.points_awarded) DESC) AS rank
        FROM public.leaderboard_point_events pe
        JOIN public.leaderboard_profiles p ON p.id = pe.canonical_user_id
        WHERE (v_start_time IS NULL OR pe.created_at >= v_start_time)
          AND p.is_public = true
        GROUP BY pe.canonical_user_id
    )
    SELECT 
        ps.rank,
        ps.total_points,
        ps.total_tests,
        ps.max_created_at
    INTO v_result
    FROM period_scores ps
    WHERE ps.canonical_user_id = p_target_user_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'found', true,
            'canonical_user_id', p_target_user_id,
            'display_name', v_profile.display_name,
            'avatar_url', v_profile.avatar_url,
            'points', v_result.total_points,
            'tests_completed', v_result.total_tests,
            'rank', v_result.rank,
            'period', p_period
        );
    ELSE
        RETURN jsonb_build_object(
            'found', true,
            'canonical_user_id', p_target_user_id,
            'display_name', v_profile.display_name,
            'avatar_url', v_profile.avatar_url,
            'points', 0,
            'tests_completed', 0,
            'rank', NULL,
            'period', p_period
        );
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_leaderboard_rank(UUID, TEXT) TO anon, authenticated, service_role;

-- 9. Identity Resolution Function
CREATE OR REPLACE FUNCTION private.get_or_create_telegram_user(
    p_telegram_user_id BIGINT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_username TEXT,
    p_photo_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing_identity RECORD;
    v_canonical_user_id UUID;
    v_display_name TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_display_name := NULLIF(TRIM(COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, '')), '');
    IF v_display_name IS NULL THEN
        v_display_name := COALESCE(p_username, 'Telegram Learner');
    END IF;

    SELECT * INTO v_existing_identity
    FROM private.telegram_identities
    WHERE telegram_user_id = p_telegram_user_id;

    IF FOUND THEN
        v_canonical_user_id := v_existing_identity.canonical_user_id;

        UPDATE private.telegram_identities
        SET 
            first_name = p_first_name,
            last_name = p_last_name,
            username = p_username,
            photo_url = COALESCE(p_photo_url, photo_url),
            updated_at = v_now
        WHERE telegram_user_id = p_telegram_user_id;

        UPDATE public.leaderboard_profiles
        SET 
            avatar_url = COALESCE(p_photo_url, avatar_url),
            updated_at = v_now
        WHERE id = v_canonical_user_id;

        RETURN jsonb_build_object(
            'canonical_user_id', v_canonical_user_id,
            'display_name', v_display_name,
            'is_new', false
        );
    END IF;

    INSERT INTO public.leaderboard_profiles (
        display_name,
        avatar_url,
        is_public,
        created_at,
        updated_at
    ) VALUES (
        v_display_name,
        p_photo_url,
        true,
        v_now,
        v_now
    ) RETURNING id INTO v_canonical_user_id;

    INSERT INTO private.telegram_identities (
        telegram_user_id,
        canonical_user_id,
        first_name,
        last_name,
        username,
        photo_url,
        linked_at,
        updated_at
    ) VALUES (
        p_telegram_user_id,
        v_canonical_user_id,
        p_first_name,
        p_last_name,
        p_username,
        p_photo_url,
        v_now,
        v_now
    );

    RETURN jsonb_build_object(
        'canonical_user_id', v_canonical_user_id,
        'display_name', v_display_name,
        'is_new', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION private.get_or_create_telegram_user(BIGINT, TEXT, TEXT, TEXT, TEXT) TO postgres, service_role;

-- 10. Account Linking Function
CREATE OR REPLACE FUNCTION private.link_telegram_to_auth_user(
    p_telegram_user_id BIGINT,
    p_auth_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tg_identity RECORD;
    v_existing_auth_profile RECORD;
    v_current_profile RECORD;
    v_target_canonical_id UUID;
    v_old_canonical_id UUID;
    v_conflicting_tg RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_auth_user_id) THEN
        RAISE EXCEPTION 'Target authentication account does not exist';
    END IF;

    SELECT * INTO v_tg_identity
    FROM private.telegram_identities
    WHERE telegram_user_id = p_telegram_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Telegram identity % not found', p_telegram_user_id;
    END IF;

    v_old_canonical_id := v_tg_identity.canonical_user_id;

    SELECT * INTO v_conflicting_tg
    FROM private.telegram_identities ti
    JOIN public.leaderboard_profiles p ON p.id = ti.canonical_user_id
    WHERE p.auth_user_id = p_auth_user_id
      AND ti.telegram_user_id <> p_telegram_user_id;

    IF FOUND THEN
        RAISE EXCEPTION 'This CCCGuru account is already linked to Telegram user ID %', v_conflicting_tg.telegram_user_id;
    END IF;

    SELECT * INTO v_current_profile
    FROM public.leaderboard_profiles
    WHERE id = v_old_canonical_id;

    IF v_current_profile.auth_user_id IS NOT NULL AND v_current_profile.auth_user_id <> p_auth_user_id THEN
        RAISE EXCEPTION 'This Telegram account is already linked to a different CCCGuru account';
    END IF;

    SELECT * INTO v_existing_auth_profile
    FROM public.leaderboard_profiles
    WHERE auth_user_id = p_auth_user_id;

    IF FOUND THEN
        v_target_canonical_id := v_existing_auth_profile.id;

        IF v_target_canonical_id <> v_old_canonical_id THEN
            UPDATE private.telegram_identities
            SET canonical_user_id = v_target_canonical_id, updated_at = v_now
            WHERE telegram_user_id = p_telegram_user_id;

            UPDATE public.leaderboard_point_events
            SET canonical_user_id = v_target_canonical_id
            WHERE canonical_user_id = v_old_canonical_id;

            UPDATE public.student_test_attempts
            SET canonical_user_id = v_target_canonical_id
            WHERE canonical_user_id = v_old_canonical_id;

            UPDATE public.leaderboard_profiles
            SET is_public = false, updated_at = v_now
            WHERE id = v_old_canonical_id AND auth_user_id IS NULL;
        END IF;
    ELSE
        UPDATE public.leaderboard_profiles
        SET auth_user_id = p_auth_user_id, updated_at = v_now
        WHERE id = v_old_canonical_id;

        v_target_canonical_id := v_old_canonical_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'telegram_user_id', p_telegram_user_id,
        'canonical_user_id', v_target_canonical_id,
        'auth_user_id', p_auth_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION private.link_telegram_to_auth_user(BIGINT, UUID) TO postgres, service_role;

-- 11. Public Finalization RPC (Computes score from trusted questions and awards points atomically)
CREATE OR REPLACE FUNCTION public.finalize_student_test_attempt(
    p_attempt_id UUID,
    p_canonical_user_id UUID,
    p_time_taken_seconds INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt RECORD;
    v_item RECORD;
    v_existing_event RECORD;
    v_correct_count INT := 0;
    v_incorrect_count INT := 0;
    v_attempted_count INT := 0;
    v_unanswered_count INT := 0;
    v_total_questions INT := 0;
    v_points_awarded INT := 0;
    v_score NUMERIC(8,2) := 0.00;
    v_accuracy NUMERIC(5,2) := 0.00;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_attempt 
    FROM public.student_test_attempts 
    WHERE id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
    END IF;

    IF v_attempt.canonical_user_id IS NOT NULL AND v_attempt.canonical_user_id <> p_canonical_user_id THEN
        RAISE EXCEPTION 'Unauthorized attempt finalization';
    END IF;

    SELECT * INTO v_existing_event
    FROM public.leaderboard_point_events
    WHERE attempt_id = p_attempt_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'attempt_id', p_attempt_id,
            'points_awarded', v_existing_event.points_awarded,
            'is_duplicate', true,
            'status', v_attempt.status,
            'score', v_attempt.score,
            'correct_count', v_attempt.correct_count,
            'accuracy', v_attempt.accuracy
        );
    END IF;

    SELECT * INTO v_item
    FROM public.test_series_items
    WHERE id = v_attempt.test_item_id;

    SELECT 
        COALESCE(COUNT(*) FILTER (WHERE a.selected_option = q.correct_option), 0),
        COALESCE(COUNT(*) FILTER (WHERE a.selected_option IS NOT NULL AND a.selected_option <> q.correct_option), 0)
    INTO v_correct_count, v_incorrect_count
    FROM public.student_attempt_answers a
    JOIN public.questions q ON q.id = a.question_id
    WHERE a.attempt_id = p_attempt_id;

    v_attempted_count := v_correct_count + v_incorrect_count;
    v_total_questions := GREATEST(v_attempt.total_questions, v_attempted_count, 1);
    v_unanswered_count := GREATEST(0, v_total_questions - v_attempted_count);

    v_score := GREATEST(0, v_correct_count - (
        CASE 
            WHEN v_item.negative_marking_enabled THEN v_incorrect_count * COALESCE(v_item.negative_marks, 0.25)
            ELSE 0 
        END
    ));

    v_accuracy := CASE 
        WHEN v_attempted_count > 0 THEN ROUND((v_correct_count::numeric / v_attempted_count::numeric) * 100, 2)
        ELSE 0.00
    END;

    v_points_awarded := GREATEST(0, v_correct_count);

    UPDATE public.student_test_attempts
    SET 
        canonical_user_id = p_canonical_user_id,
        status = 'evaluated',
        submitted_at = v_now,
        time_taken_seconds = p_time_taken_seconds,
        total_questions = v_total_questions,
        attempted_count = v_attempted_count,
        correct_count = v_correct_count,
        incorrect_count = v_incorrect_count,
        unanswered_count = v_unanswered_count,
        score = v_score,
        accuracy = v_accuracy,
        updated_at = v_now
    WHERE id = p_attempt_id;

    INSERT INTO public.leaderboard_point_events (
        canonical_user_id,
        attempt_id,
        test_item_id,
        points_awarded,
        correct_count,
        total_questions,
        created_at
    ) VALUES (
        p_canonical_user_id,
        p_attempt_id,
        v_attempt.test_item_id,
        v_points_awarded,
        v_correct_count,
        v_total_questions,
        v_now
    )
    ON CONFLICT (attempt_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', p_attempt_id,
        'points_awarded', v_points_awarded,
        'is_duplicate', false,
        'status', 'evaluated',
        'score', v_score,
        'correct_count', v_correct_count,
        'incorrect_count', v_incorrect_count,
        'unanswered_count', v_unanswered_count,
        'accuracy', v_accuracy
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_student_test_attempt(UUID, UUID, INT) TO anon, authenticated, service_role;

-- 12. Public Identity Resolution Wrapper (Delegates to private schema)
CREATE OR REPLACE FUNCTION public.resolve_telegram_identity(
    p_telegram_user_id BIGINT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_username TEXT,
    p_photo_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN private.get_or_create_telegram_user(
        p_telegram_user_id,
        p_first_name,
        p_last_name,
        p_username,
        p_photo_url
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_telegram_identity(BIGINT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 13. Public Account Linking Wrapper (Delegates to private schema)
CREATE OR REPLACE FUNCTION public.link_telegram_account(
    p_telegram_user_id BIGINT,
    p_auth_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN private.link_telegram_to_auth_user(
        p_telegram_user_id,
        p_auth_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_telegram_account(BIGINT, UUID) TO anon, authenticated, service_role;

