// ============================================================
// CCC Guru — Canonical Supabase Database Types
// ============================================================

export interface TestCategory {
  id: string;
  title: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TestSeries {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  description_md: string | null;
  featured_image?: string | null;
  is_featured: boolean;
  featured_tag: string | null;
  featured_short_desc: string | null;
  total_sets_available: number;
  total_enrolled: number;
  is_paid: boolean;
  price: number;
  currency: string;
  created_at: string;
  last_updated_at: string;
  test_categories?: TestCategory | null;
}

export interface LatestAttemptSummary {
  id: string;
  status: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  isPassed: boolean;
  submittedAt: string | null;
}

export interface TestSeriesItem {
  id: string;
  series_id: string;
  title: string;
  test_type: string;
  question_count: number;
  duration: number; // in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  total_marks: number;
  negative_marking_enabled: boolean;
  negative_marks: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  test_series?: TestSeries | null;
  latestAttempt?: LatestAttemptSummary | null;
}

export interface Chapter {
  id: string;
  title: string;
  hindi_title: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  chapter_id: string | null;
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation_en: string | null;
  explanation_hi: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  question_type: "MCQ" | "True/False";
  option_type?: string;
  source: string | null;
  is_active: boolean;
  created_at: string;
  test_ids: string[];
}

export interface TestQuestion {
  id: string;
  test_series_item_id: string;
  question_id: string;
  question_order: number;
  created_at: string;
}

export interface SeriesEnrollment {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  series_id: string;
  access_type: "free" | "paid" | "promotional";
  status: "active" | "expired" | "revoked";
  enrolled_at: string;
  expires_at: string | null;
}

// ============================================================
// Sanitized Question for Active Test (Without Answer Keys)
// ============================================================

export interface SanitizedQuestion {
  id: string;
  chapter_id: string | null;
  question_en: string;
  question_hi: string;
  option_a_en: string;
  option_a_hi: string;
  option_b_en: string;
  option_b_hi: string;
  option_c_en: string;
  option_c_hi: string;
  option_d_en: string;
  option_d_hi: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question_type: "MCQ" | "True/False";
  option_type?: string;
}

// ============================================================
// Student Attempt & Result Entities
// ============================================================

export interface StudentTestAttempt {
  id: string;
  student_id: string;
  student_type: "telegram" | "web" | "guest" | "preview";
  student_name: string | null;
  student_username: string | null;
  test_item_id: string;
  series_id?: string | null;
  status: "in_progress" | "submitted" | "evaluated" | "abandoned";
  started_at: string;
  submitted_at?: string | null;
  time_taken_seconds: number;
  duration_allowed_minutes: number;
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  score: number;
  total_marks: number;
  accuracy: number;
  negative_marking_applied: number;
  created_at: string;
  updated_at: string;
  test_item?: TestSeriesItem | null;
  canonical_user_id?: string | null;
}

export interface StudentAttemptAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  question_order?: number;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_flagged: boolean;
  time_spent_seconds: number;
  is_correct?: boolean | null;
}

export interface EvaluatedQuestionReview extends SanitizedQuestion {
  correct_option: "A" | "B" | "C" | "D";
  explanation_en: string | null;
  explanation_hi: string | null;
  user_selected_option: "A" | "B" | "C" | "D" | null;
  is_correct: boolean;
  is_flagged: boolean;
  time_spent_seconds: number;
}

// ============================================================
// Leaderboard Entities
// ============================================================

export interface LeaderboardProfile {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardPointEvent {
  id: string;
  canonical_user_id: string;
  attempt_id: string;
  test_item_id: string;
  points_awarded: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  canonical_user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  tests_completed: number;
  last_active_at?: string | null;
}

export interface UserLeaderboardRank {
  found: boolean;
  canonical_user_id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  tests_completed: number;
  rank: number | null;
  period: "daily" | "monthly" | "all_time";
  message?: string;
}


