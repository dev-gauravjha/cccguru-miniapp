-- ==============================================================================
-- Migration: 20261021_leaderboard_passing_criteria_and_rls.sql
-- Description: 
--  1. Add RLS INSERT policy on leaderboard_point_events for authenticated and anon clients.
--  2. Enforce CCC official passing rule: Score must be >= 50% for leaderboard points to be awarded.
--  3. Ensure default preview/demo student profile exists in leaderboard_profiles.
-- ==============================================================================

-- 1. Ensure default preview profile exists
INSERT INTO public.leaderboard_profiles (id, display_name, avatar_url, is_public)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Student', null, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add INSERT policy for anon and authenticated on leaderboard_point_events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leaderboard_point_events' 
          AND policyname = 'Allow anon and authenticated insert into point events'
    ) THEN
        CREATE POLICY "Allow anon and authenticated insert into point events"
            ON public.leaderboard_point_events
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.leaderboard_profiles p 
                    WHERE p.id = canonical_user_id
                )
            );
    END IF;
END $$;

-- 3. Update private.finalize_attempt_and_award_points to enforce >= 50% passing rule
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
    v_percentage NUMERIC;
    v_is_passed BOOLEAN;
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

    -- Calculate CCC passing percentage (>= 50% is Pass, < 50% is Failed)
    v_percentage := CASE 
        WHEN p_total_questions > 0 THEN (p_correct_count::numeric / p_total_questions::numeric) * 100 
        ELSE 0.00 
    END;
    v_is_passed := v_percentage >= 50.0;

    -- Points are strictly awarded ONLY IF passed (>= 50%)
    IF v_is_passed THEN
        v_points_awarded := GREATEST(0, p_correct_count);
    ELSE
        v_points_awarded := 0;
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
            'is_passed', v_is_passed,
            'status', v_attempt.status
        );
    END IF;

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

    -- Only record in leaderboard point ledger if passed and points > 0
    IF v_points_awarded > 0 THEN
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
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', p_attempt_id,
        'points_awarded', v_points_awarded,
        'is_passed', v_is_passed,
        'is_duplicate', false,
        'status', 'evaluated'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION private.finalize_attempt_and_award_points(UUID, UUID, INT, INT, INT, INT, INT, NUMERIC, NUMERIC, INT) TO postgres, service_role;

-- 4. Update public.finalize_student_test_attempt with >= 50% passing rule
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
    v_unanswered_count INT := 0;
    v_attempted_count INT := 0;
    v_total_questions INT := 0;
    v_score NUMERIC := 0.00;
    v_accuracy NUMERIC := 0.00;
    v_points_awarded INT := 0;
    v_percentage NUMERIC := 0.00;
    v_is_passed BOOLEAN := false;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_attempt 
    FROM public.student_test_attempts 
    WHERE id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
    END IF;

    SELECT * INTO v_item 
    FROM public.test_series_items 
    WHERE id = v_attempt.test_item_id;

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

    SELECT 
        COUNT(*) FILTER (WHERE ans.selected_option = q.correct_option)::INT,
        COUNT(*) FILTER (WHERE ans.selected_option IS NOT NULL AND ans.selected_option <> q.correct_option)::INT
    INTO v_correct_count, v_incorrect_count
    FROM public.student_attempt_answers ans
    JOIN public.questions q ON q.id = ans.question_id
    WHERE ans.attempt_id = p_attempt_id;

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

    v_percentage := CASE 
        WHEN v_total_questions > 0 THEN (v_correct_count::numeric / v_total_questions::numeric) * 100 
        ELSE 0.00 
    END;
    v_is_passed := v_percentage >= 50.0;

    -- Only passed tests award points
    IF v_is_passed THEN
        v_points_awarded := GREATEST(0, v_correct_count);
    ELSE
        v_points_awarded := 0;
    END IF;

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

    IF v_points_awarded > 0 THEN
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
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', p_attempt_id,
        'points_awarded', v_points_awarded,
        'is_passed', v_is_passed,
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
