-- ==============================================================================
-- Demo Seed Data: 15 Realistic Students for Leaderboard Testing
-- File: supabase/seed_leaderboard_demo.sql
-- ==============================================================================

DO $$
DECLARE
    v_test_item_id UUID := '70c61e7e-c4f8-4eef-af1d-824018d67a7b';
    v_users JSONB := '[
        {"id": "a0000000-0000-0000-0000-000000000001", "name": "Aman Sharma", "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", "score": 96, "mins_ago": 15},
        {"id": "a0000000-0000-0000-0000-000000000002", "name": "Priya Patel", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", "score": 93, "mins_ago": 30},
        {"id": "a0000000-0000-0000-0000-000000000003", "name": "Rohit Verma", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "score": 89, "mins_ago": 45},
        {"id": "a0000000-0000-0000-0000-000000000004", "name": "Ananya Mishra", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "score": 86, "mins_ago": 60},
        {"id": "a0000000-0000-0000-0000-000000000005", "name": "Deepak Kumar", "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", "score": 83, "mins_ago": 75},
        {"id": "a0000000-0000-0000-0000-000000000006", "name": "Sneha Gupta", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "score": 80, "mins_ago": 90},
        {"id": "a0000000-0000-0000-0000-000000000007", "name": "Rahul Yadav", "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", "score": 77, "mins_ago": 110},
        {"id": "a0000000-0000-0000-0000-000000000008", "name": "Pooja Singh", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "score": 74, "mins_ago": 130},
        {"id": "a0000000-0000-0000-0000-000000000009", "name": "Vikram Rathore", "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", "score": 71, "mins_ago": 150},
        {"id": "a0000000-0000-0000-0000-000000000010", "name": "Neha Choudhary", "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", "score": 68, "mins_ago": 170},
        {"id": "a0000000-0000-0000-0000-000000000011", "name": "Amit Trivedi", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", "score": 65, "mins_ago": 190},
        {"id": "a0000000-0000-0000-0000-000000000012", "name": "Kavita Joshi", "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", "score": 62, "mins_ago": 210},
        {"id": "a0000000-0000-0000-0000-000000000013", "name": "Sandeep Tiwari", "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80", "score": 59, "mins_ago": 230},
        {"id": "a0000000-0000-0000-0000-000000000014", "name": "Divya Saxena", "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", "score": 56, "mins_ago": 250},
        {"id": "a0000000-0000-0000-0000-000000000015", "name": "Rajesh Maurya", "avatar": "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&auto=format&fit=crop&q=80", "score": 53, "mins_ago": 270}
    ]';
    v_u JSONB;
    v_user_id UUID;
    v_attempt_id UUID;
    v_created_at TIMESTAMPTZ;
    v_score INT;
BEGIN
    FOR v_u IN SELECT * FROM jsonb_array_elements(v_users) LOOP
        v_user_id := (v_u->>'id')::UUID;
        v_score := (v_u->>'score')::INT;
        v_created_at := timezone('utc'::text, now()) - ((v_u->>'mins_ago')::INT * INTERVAL '1 minute');
        v_attempt_id := gen_random_uuid();

        -- 1. Insert or update profile
        INSERT INTO public.leaderboard_profiles (id, display_name, avatar_url, is_public, created_at, updated_at)
        VALUES (v_user_id, v_u->>'name', v_u->>'avatar', true, v_created_at, v_created_at)
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            is_public = true,
            updated_at = v_created_at;

        -- 2. Insert student attempt
        INSERT INTO public.student_test_attempts (
            id,
            student_id,
            canonical_user_id,
            student_type,
            student_name,
            test_item_id,
            status,
            started_at,
            submitted_at,
            time_taken_seconds,
            total_questions,
            attempted_count,
            correct_count,
            incorrect_count,
            unanswered_count,
            score,
            total_marks,
            accuracy,
            created_at,
            updated_at
        ) VALUES (
            v_attempt_id,
            'demo_' || (v_u->>'id'),
            v_user_id,
            'telegram',
            v_u->>'name',
            v_test_item_id,
            'evaluated',
            v_created_at - INTERVAL '45 minutes',
            v_created_at,
            2700,
            100,
            v_score + (100 - v_score) / 2,
            v_score,
            (100 - v_score) / 2,
            100 - (v_score + (100 - v_score) / 2),
            v_score,
            100.00,
            v_score::NUMERIC,
            v_created_at,
            v_created_at
        );

        -- 3. Insert point event
        INSERT INTO public.leaderboard_point_events (
            canonical_user_id,
            attempt_id,
            test_item_id,
            points_awarded,
            correct_count,
            total_questions,
            created_at
        ) VALUES (
            v_user_id,
            v_attempt_id,
            v_test_item_id,
            v_score,
            v_score,
            100,
            v_created_at
        );
    END LOOP;
END $$;
