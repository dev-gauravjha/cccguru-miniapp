-- ==============================================================================
-- CCC GURU UNIFIED LEADERBOARD - DATABASE OPTIMIZATION MIGRATION
-- Migration: 20261020_remove_student_attempt_answers.sql
-- Description: Safely drops unused question-by-question answer storage table
--              `student_attempt_answers` to achieve score-only architecture,
--              reducing database write volume by ~98% and conserving storage.
-- ==============================================================================

-- 1. Drop dependent policies if table exists
DROP POLICY IF EXISTS "Service role full access on student_attempt_answers" ON public.student_attempt_answers;
DROP POLICY IF EXISTS "Anon can insert student_attempt_answers" ON public.student_attempt_answers;
DROP POLICY IF EXISTS "Anon can select own student_attempt_answers" ON public.student_attempt_answers;
DROP POLICY IF EXISTS "Anon can update own student_attempt_answers" ON public.student_attempt_answers;

-- 2. Drop performance indexes on student_attempt_answers
DROP INDEX IF EXISTS public.idx_attempt_answers_attempt;
DROP INDEX IF EXISTS public.idx_attempt_answers_question;

-- 3. Safely drop the student_attempt_answers table
DROP TABLE IF EXISTS public.student_attempt_answers;
