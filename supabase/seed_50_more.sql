DO $$
DECLARE
    v_test_item_id UUID := '70c61e7e-c4f8-4eef-af1d-824018d67a7b';
    v_users JSONB := '[{"id":"b0000000-0000-0000-0000-000000000001","name":"Manish Pandey","avatar":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80","score":94,"mins_ago":10},{"id":"b0000000-0000-0000-0000-000000000002","name":"Shweta Tiwari","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80","score":92,"mins_ago":18},{"id":"b0000000-0000-0000-0000-000000000003","name":"Harshit Rawat","avatar":"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80","score":92,"mins_ago":26},{"id":"b0000000-0000-0000-0000-000000000004","name":"Ritu Agarwal","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80","score":90,"mins_ago":34},{"id":"b0000000-0000-0000-0000-000000000005","name":"Alok Nath","avatar":"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80","score":90,"mins_ago":42},{"id":"b0000000-0000-0000-0000-000000000006","name":"Preeti Chauhan","avatar":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80","score":88,"mins_ago":50},{"id":"b0000000-0000-0000-0000-000000000007","name":"Sachin Tendulkar","avatar":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80","score":88,"mins_ago":58},{"id":"b0000000-0000-0000-0000-000000000008","name":"Megha Soni","avatar":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80","score":86,"mins_ago":66},{"id":"b0000000-0000-0000-0000-000000000009","name":"Saurabh Ganguly","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80","score":87,"mins_ago":74},{"id":"b0000000-0000-0000-0000-00000000000a","name":"Garima Saxena","avatar":"https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&auto=format&fit=crop&q=80","score":85,"mins_ago":82},{"id":"b0000000-0000-0000-0000-00000000000b","name":"Pankaj Tripathi","avatar":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80","score":85,"mins_ago":90},{"id":"b0000000-0000-0000-0000-00000000000c","name":"Shalini Yadav","avatar":"https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80","score":83,"mins_ago":98},{"id":"b0000000-0000-0000-0000-00000000000d","name":"Nitin Gadkari","avatar":"https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80","score":83,"mins_ago":106},{"id":"b0000000-0000-0000-0000-00000000000e","name":"Simran Kaur","avatar":"https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&auto=format&fit=crop&q=80","score":81,"mins_ago":114},{"id":"b0000000-0000-0000-0000-00000000000f","name":"Kunal Kapoor","avatar":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80","score":81,"mins_ago":122},{"id":"b0000000-0000-0000-0000-000000000010","name":"Monika Sharma","avatar":"https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80","score":79,"mins_ago":130},{"id":"b0000000-0000-0000-0000-000000000011","name":"Ajay Devgan","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80","score":80,"mins_ago":138},{"id":"b0000000-0000-0000-0000-000000000012","name":"Swati Deshmukh","avatar":"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80","score":78,"mins_ago":146},{"id":"b0000000-0000-0000-0000-000000000013","name":"Gaurav Malhotra","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80","score":78,"mins_ago":154},{"id":"b0000000-0000-0000-0000-000000000014","name":"Tanvi Bhatia","avatar":"https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80","score":76,"mins_ago":162},{"id":"b0000000-0000-0000-0000-000000000015","name":"Varun Dhawan","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80","score":76,"mins_ago":170},{"id":"b0000000-0000-0000-0000-000000000016","name":"Pallavi Joshi","avatar":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80","score":74,"mins_ago":178},{"id":"b0000000-0000-0000-0000-000000000017","name":"Aditya Roy","avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80","score":74,"mins_ago":186},{"id":"b0000000-0000-0000-0000-000000000018","name":"Radhika Madan","avatar":"https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80","score":72,"mins_ago":194},{"id":"b0000000-0000-0000-0000-000000000019","name":"Mayank Agarwal","avatar":"https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80","score":73,"mins_ago":202},{"id":"b0000000-0000-0000-0000-00000000001a","name":"Jyoti Kumari","avatar":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80","score":71,"mins_ago":210},{"id":"b0000000-0000-0000-0000-00000000001b","name":"Vishal Singh","avatar":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80","score":71,"mins_ago":218},{"id":"b0000000-0000-0000-0000-00000000001c","name":"Komal Rathore","avatar":"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80","score":69,"mins_ago":226},{"id":"b0000000-0000-0000-0000-00000000001d","name":"Shubham Gill","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80","score":69,"mins_ago":234},{"id":"b0000000-0000-0000-0000-00000000001e","name":"Mansi Dubey","avatar":"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80","score":67,"mins_ago":242},{"id":"b0000000-0000-0000-0000-00000000001f","name":"Rishabh Pant","avatar":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80","score":67,"mins_ago":250},{"id":"b0000000-0000-0000-0000-000000000020","name":"Bhavna Upadhyay","avatar":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80","score":65,"mins_ago":258},{"id":"b0000000-0000-0000-0000-000000000021","name":"Yashvardhan Shukla","avatar":"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80","score":65,"mins_ago":266},{"id":"b0000000-0000-0000-0000-000000000022","name":"Ishita Dutta","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80","score":64,"mins_ago":274},{"id":"b0000000-0000-0000-0000-000000000023","name":"Pradeep Chawla","avatar":"https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&auto=format&fit=crop&q=80","score":64,"mins_ago":282},{"id":"b0000000-0000-0000-0000-000000000024","name":"Aarti Mehra","avatar":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80","score":62,"mins_ago":290},{"id":"b0000000-0000-0000-0000-000000000025","name":"Tarun Gogoi","avatar":"https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80","score":62,"mins_ago":298},{"id":"b0000000-0000-0000-0000-000000000026","name":"Divyansh Dixit","avatar":"https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80","score":60,"mins_ago":306},{"id":"b0000000-0000-0000-0000-000000000027","name":"Kriti Sanon","avatar":"https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=150&auto=format&fit=crop&q=80","score":60,"mins_ago":314},{"id":"b0000000-0000-0000-0000-000000000028","name":"Naveen Jindal","avatar":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80","score":58,"mins_ago":322},{"id":"b0000000-0000-0000-0000-000000000029","name":"Deepa Karmakar","avatar":"https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80","score":58,"mins_ago":330},{"id":"b0000000-0000-0000-0000-00000000002a","name":"Abhinav Bindra","avatar":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80","score":57,"mins_ago":338},{"id":"b0000000-0000-0000-0000-00000000002b","name":"Payal Rohatgi","avatar":"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80","score":57,"mins_ago":346},{"id":"b0000000-0000-0000-0000-00000000002c","name":"Chetan Bhagat","avatar":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80","score":55,"mins_ago":354},{"id":"b0000000-0000-0000-0000-00000000002d","name":"Sunita Rao","avatar":"https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80","score":55,"mins_ago":362},{"id":"b0000000-0000-0000-0000-00000000002e","name":"Mohit Suri","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80","score":53,"mins_ago":370},{"id":"b0000000-0000-0000-0000-00000000002f","name":"Rekha Jhunjhunwala","avatar":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80","score":53,"mins_ago":378},{"id":"b0000000-0000-0000-0000-000000000030","name":"Ankit Fadia","avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80","score":51,"mins_ago":386},{"id":"b0000000-0000-0000-0000-000000000031","name":"Smriti Mandhana","avatar":"https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80","score":51,"mins_ago":394},{"id":"b0000000-0000-0000-0000-000000000032","name":"Rakesh Jhunjhunwala","avatar":"https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80","score":50,"mins_ago":402}]';
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
SELECT count(*) FROM public.leaderboard_point_events;