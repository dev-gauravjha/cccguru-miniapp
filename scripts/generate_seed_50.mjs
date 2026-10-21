import fs from "fs";

const names = [
  "Manish Pandey", "Shweta Tiwari", "Harshit Rawat", "Ritu Agarwal", "Alok Nath",
  "Preeti Chauhan", "Sachin Tendulkar", "Megha Soni", "Saurabh Ganguly", "Garima Saxena",
  "Pankaj Tripathi", "Shalini Yadav", "Nitin Gadkari", "Simran Kaur", "Kunal Kapoor",
  "Monika Sharma", "Ajay Devgan", "Swati Deshmukh", "Gaurav Malhotra", "Tanvi Bhatia",
  "Varun Dhawan", "Pallavi Joshi", "Aditya Roy", "Radhika Madan", "Mayank Agarwal",
  "Jyoti Kumari", "Vishal Singh", "Komal Rathore", "Shubham Gill", "Mansi Dubey",
  "Rishabh Pant", "Bhavna Upadhyay", "Yashvardhan Shukla", "Ishita Dutta", "Pradeep Chawla",
  "Aarti Mehra", "Tarun Gogoi", "Divyansh Dixit", "Kriti Sanon", "Naveen Jindal",
  "Deepa Karmakar", "Abhinav Bindra", "Payal Rohatgi", "Chetan Bhagat", "Sunita Rao",
  "Mohit Suri", "Rekha Jhunjhunwala", "Ankit Fadia", "Smriti Mandhana", "Rakesh Jhunjhunwala"
];

const avatars = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80"
];

const students = [];
for (let i = 0; i < 50; i++) {
  const studentNum = 1 + i;
  const hex = studentNum.toString(16).padStart(12, "0");
  const id = `b0000000-0000-0000-0000-${hex}`;
  const name = names[i];
  const avatar = avatars[i % avatars.length];
  // Scores nicely distributed between 50 and 95 (Passing CCC grade >= 50%)
  const score = 50 + Math.floor(((49 - i) / 50) * 44) + (i % 2 === 0 ? 1 : 0);
  const finalScore = Math.min(95, Math.max(50, score));
  const minsAgo = 10 + i * 8;
  students.push({ id, name, avatar, score: finalScore, mins_ago: minsAgo });
}

const sql = `DO $$
DECLARE
    v_test_item_id UUID := '70c61e7e-c4f8-4eef-af1d-824018d67a7b';
    v_users JSONB := '${JSON.stringify(students).replace(/'/g, "''")}';
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
SELECT count(*) FROM public.leaderboard_point_events;`;

fs.writeFileSync("supabase/seed_50_more.sql", sql);
console.log("Written supabase/seed_50_more.sql successfully!");
