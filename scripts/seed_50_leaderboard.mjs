import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = "https://zxzzxtiwlndsghmelnph.supabase.co";
const SUPABASE_KEY = "sb_publishable_oRCHCLQLZ0xzEopUPaqAmQ_PIN8RVX3";
const TEST_ITEM_ID = "70c61e7e-c4f8-4eef-af1d-824018d67a7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function seed() {
  console.log("Seeding 50 demo student scores...");

  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const studentNum = 16 + i;
    const hex = studentNum.toString(16).padStart(12, "0");
    const userId = `a0000000-0000-0000-0000-${hex}`;
    const attemptId = crypto.randomUUID();
    const name = names[i];
    const avatar = avatars[i % avatars.length];

    // Scores nicely distributed between 50 and 95 (Passing CCC grade >= 50%)
    const score = 50 + Math.floor(((49 - i) / 50) * 44) + (i % 2 === 0 ? 1 : 0);
    const finalScore = Math.min(95, Math.max(50, score));

    // Stagger timestamps across today so they appear in Daily, Monthly, and All-Time views
    const minsAgo = 10 + i * 8;
    const createdAt = new Date(now - minsAgo * 60 * 1000).toISOString();
    const startedAt = new Date(now - (minsAgo + 40) * 60 * 1000).toISOString();

    // 1. Insert Profile
    const { error: profErr } = await supabase.from("leaderboard_profiles").upsert({
      id: userId,
      display_name: name,
      avatar_url: avatar,
      is_public: true,
      created_at: createdAt,
      updated_at: createdAt,
    });
    if (profErr) {
      console.error(`Profile error for ${name}:`, profErr);
      continue;
    }

    // 2. Insert Test Attempt
    const { error: attErr } = await supabase.from("student_test_attempts").insert({
      id: attemptId,
      student_id: `demo_${userId}`,
      canonical_user_id: userId,
      student_type: "telegram",
      student_name: name,
      test_item_id: TEST_ITEM_ID,
      status: "evaluated",
      started_at: startedAt,
      submitted_at: createdAt,
      time_taken_seconds: 2400,
      total_questions: 100,
      attempted_count: finalScore + Math.floor((100 - finalScore) / 2),
      correct_count: finalScore,
      incorrect_count: Math.floor((100 - finalScore) / 2),
      unanswered_count: 100 - (finalScore + Math.floor((100 - finalScore) / 2)),
      score: finalScore,
      total_marks: 100.0,
      accuracy: finalScore,
      created_at: createdAt,
      updated_at: createdAt,
    });
    if (attErr) {
      console.error(`Attempt error for ${name}:`, attErr);
      continue;
    }

    // 3. Insert Point Event
    const { error: ptErr } = await supabase.from("leaderboard_point_events").insert({
      canonical_user_id: userId,
      attempt_id: attemptId,
      test_item_id: TEST_ITEM_ID,
      points_awarded: finalScore,
      correct_count: finalScore,
      total_questions: 100,
      created_at: createdAt,
    });
    if (ptErr) {
      console.error(`Point event error for ${name}:`, ptErr);
      continue;
    }

    if ((i + 1) % 10 === 0 || i === 49) {
      console.log(`Inserted ${i + 1}/50 demo records...`);
    }
  }

  console.log("Successfully seeded 50 demo records!");
}

seed().catch(console.error);
