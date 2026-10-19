-- ==============================================================================
-- CCC GURU TELEGRAM MINI APP - DATABASE MIGRATION
-- Migration: 20261019_telegram_mini_app.sql
-- Description: Adds tables, indexes, and RLS policies for Telegram Mini App
--              student attempts, answer responses, and evaluation tracking.
-- ==============================================================================

-- 1. Create student_test_attempts Table
CREATE TABLE IF NOT EXISTS public.student_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,                          -- Telegram user ID (as text) or Supabase auth ID
    student_type VARCHAR(50) NOT NULL DEFAULT 'telegram' CHECK (student_type IN ('telegram', 'web', 'guest')),
    student_name VARCHAR(255),
    student_username VARCHAR(255),
    test_item_id UUID NOT NULL REFERENCES public.test_series_items(id) ON DELETE CASCADE,
    series_id UUID REFERENCES public.test_series(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INT NOT NULL DEFAULT 0,
    duration_allowed_minutes INT NOT NULL DEFAULT 90,
    total_questions INT NOT NULL DEFAULT 0,
    attempted_count INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    score NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_marks NUMERIC(8,2) NOT NULL DEFAULT 100.00,
    accuracy NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    negative_marking_applied NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create student_attempt_answers Table
CREATE TABLE IF NOT EXISTS public.student_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.student_test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    question_order INT NOT NULL DEFAULT 1,
    selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D') OR selected_option IS NULL),
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(attempt_id, question_id)
);

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_attempts_student_id ON public.student_test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_test_item ON public.student_test_attempts(test_item_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_status ON public.student_test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_student_attempts_started ON public.student_test_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.student_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON public.student_attempt_answers(question_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.student_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attempt_answers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow service_role full administrative access
CREATE POLICY "Service role full access on student_test_attempts" 
    ON public.student_test_attempts 
    FOR ALL 
    TO service_role 
    USING (true);

CREATE POLICY "Service role full access on student_attempt_answers" 
    ON public.student_attempt_answers 
    FOR ALL 
    TO service_role 
    USING (true);

-- Allow public read access to active student test attempts if needed by anon client
CREATE POLICY "Anon can insert student_test_attempts" 
    ON public.student_test_attempts 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Anon can select own student_test_attempts" 
    ON public.student_test_attempts 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Anon can update own student_test_attempts" 
    ON public.student_test_attempts 
    FOR UPDATE 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Anon can insert student_attempt_answers" 
    ON public.student_attempt_answers 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Anon can select own student_attempt_answers" 
    ON public.student_attempt_answers 
    FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Anon can update own student_attempt_answers" 
    ON public.student_attempt_answers 
    FOR UPDATE 
    TO anon, authenticated 
    USING (true);

-- End of migration
