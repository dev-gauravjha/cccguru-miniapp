import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zxzzxtiwlndsghmelnph.supabase.co";
const SUPABASE_KEY = "sb_publishable_oRCHCLQLZ0xzEopUPaqAmQ_PIN8RVX3";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Removing all dummy leaderboard data...");

  // 1. Delete all dummy point events
  const { data: events, error: evErr } = await supabase
    .from("leaderboard_point_events")
    .select("id, canonical_user_id");

  if (evErr) console.error("Error fetching events:", evErr);

  const dummyEventIds = (events || [])
    .filter(
      (e) =>
        e.canonical_user_id?.startsWith("a000") ||
        e.canonical_user_id?.startsWith("b000") ||
        e.canonical_user_id?.startsWith("0000")
    )
    .map((e) => e.id);

  console.log(`Found ${dummyEventIds.length} dummy point events to delete.`);
  for (let i = 0; i < dummyEventIds.length; i += 50) {
    const chunk = dummyEventIds.slice(i, i + 50);
    const { error } = await supabase.from("leaderboard_point_events").delete().in("id", chunk);
    if (error) console.error("Error deleting events chunk:", error);
  }

  // 2. Delete all dummy student attempts
  const { data: attempts, error: attErr } = await supabase
    .from("student_test_attempts")
    .select("id, student_id, canonical_user_id");

  if (attErr) console.error("Error fetching attempts:", attErr);

  const dummyAttemptIds = (attempts || [])
    .filter(
      (a) =>
        a.student_id?.startsWith("demo_") ||
        a.canonical_user_id?.startsWith("a000") ||
        a.canonical_user_id?.startsWith("b000")
    )
    .map((a) => a.id);

  console.log(`Found ${dummyAttemptIds.length} dummy attempts to delete.`);
  for (let i = 0; i < dummyAttemptIds.length; i += 50) {
    const chunk = dummyAttemptIds.slice(i, i + 50);
    const { error } = await supabase.from("student_test_attempts").delete().in("id", chunk);
    if (error) console.error("Error deleting attempts chunk:", error);
  }

  // 3. Delete all dummy leaderboard profiles
  const { data: profiles, error: profErr } = await supabase
    .from("leaderboard_profiles")
    .select("id, display_name");

  if (profErr) console.error("Error fetching profiles:", profErr);

  const dummyProfileIds = (profiles || [])
    .filter(
      (p) =>
        p.id?.startsWith("a000") ||
        p.id?.startsWith("b000") ||
        p.id?.startsWith("0000") ||
        p.display_name === "Test Learner"
    )
    .map((p) => p.id);

  console.log(`Found ${dummyProfileIds.length} dummy profiles to delete.`);
  for (let i = 0; i < dummyProfileIds.length; i += 50) {
    const chunk = dummyProfileIds.slice(i, i + 50);
    const { error } = await supabase.from("leaderboard_profiles").delete().in("id", chunk);
    if (error) console.error("Error deleting profiles chunk:", error);
  }

  console.log("Cleanup complete. Checking remaining counts:");
  const { count: remainingEvents } = await supabase
    .from("leaderboard_point_events")
    .select("*", { count: "exact", head: true });
  const { count: remainingProfiles } = await supabase
    .from("leaderboard_profiles")
    .select("*", { count: "exact", head: true });
  const { count: remainingAttempts } = await supabase
    .from("student_test_attempts")
    .select("*", { count: "exact", head: true });

  console.log({
    remainingEvents,
    remainingProfiles,
    remainingAttempts,
  });
}

main().catch(console.error);
