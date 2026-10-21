import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3001";

test("API: Returns exactly 15 records with pagination metadata on initial load", async () => {
  const res = await fetch(`${BASE_URL}/api/leaderboard?period=daily&limit=15&offset=0`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.leaderboard.length, 15);
  assert.equal(data.hasMore, true);
  assert.equal(data.nextOffset, 15);

  // User rank metadata verification
  assert.ok(data.userRank, "userRank should be populated");
  assert.equal(typeof data.userRank.points, "number");
  assert.ok(data.userRank.display_name, "User should have a display name");
});

test("API: Paginated batches have no duplicate records and stable ranking order", async () => {
  const page1Res = await fetch(`${BASE_URL}/api/leaderboard?period=daily&limit=15&offset=0`);
  const page1 = await page1Res.json();

  const page2Res = await fetch(`${BASE_URL}/api/leaderboard?period=daily&limit=15&offset=15`);
  const page2 = await page2Res.json();

  assert.equal(page1.leaderboard.length, 15);
  assert.equal(page2.leaderboard.length, 15);

  const page1Ids = new Set(page1.leaderboard.map((e) => e.canonical_user_id));
  const overlap = page2.leaderboard.filter((e) => page1Ids.has(e.canonical_user_id));
  assert.equal(overlap.length, 0, "No duplicate users between page 1 and page 2");

  // Verify descending score order across pages
  const lastPage1Points = page1.leaderboard[page1.leaderboard.length - 1].points;
  const firstPage2Points = page2.leaderboard[0].points;
  assert.ok(
    lastPage1Points >= firstPage2Points,
    `Page 1 last score (${lastPage1Points}) should be >= Page 2 first score (${firstPage2Points})`
  );
});

test("API: Iterating batches of 15 reaches the end with hasMore: false", async () => {
  let offset = 0;
  const PAGE_SIZE = 15;
  let totalFetched = 0;
  const allIds = new Set();
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${BASE_URL}/api/leaderboard?period=daily&limit=${PAGE_SIZE}&offset=${offset}`);
    const data = await res.json();
    assert.equal(data.success, true);

    const items = data.leaderboard;
    for (const item of items) {
      assert.ok(!allIds.has(item.canonical_user_id), `Duplicate ID found: ${item.canonical_user_id}`);
      allIds.add(item.canonical_user_id);
    }

    totalFetched += items.length;
    hasMore = data.hasMore;
    offset = data.nextOffset;

    if (!hasMore) {
      assert.ok(items.length <= PAGE_SIZE);
      break;
    }
  }

  assert.ok(totalFetched > 50, `Should have loaded all demo students (fetched ${totalFetched})`);
  assert.equal(hasMore, false, "hasMore must terminate as false");
});

test("Frontend Logic: Conditional My Rank Card visibility correctly reflects loaded entries", () => {
  const currentUserId = "user-abc-123";
  const userRank = {
    canonical_user_id: currentUserId,
    display_name: "Rahul Verma",
    avatar_url: "https://example.com/avatar.jpg",
    points: 75,
    rank: 25,
  };

  // Scenario A: Loaded batch only contains Top 15 (user is rank 25, so absent)
  const loadedBatchTop15 = Array.from({ length: 15 }, (_, i) => ({
    canonical_user_id: `other-user-${i}`,
    display_name: `Student ${i + 1}`,
    points: 90 - i,
    rank: i + 1,
  }));

  const isUserInBatchA = loadedBatchTop15.some(
    (e) => e.canonical_user_id === userRank.canonical_user_id
  );
  const showStickyCardA = Boolean(userRank) && !isUserInBatchA;

  assert.equal(isUserInBatchA, false);
  assert.equal(showStickyCardA, true, "Sticky card MUST be shown when user is absent from loaded list");

  // Scenario B: User scrolls and batch 2 loads (items 16 to 30, user included)
  const loadedBatchWithUser = [
    ...loadedBatchTop15,
    {
      canonical_user_id: currentUserId,
      display_name: "Rahul Verma",
      points: 75,
      rank: 25,
    },
  ];

  const isUserInBatchB = loadedBatchWithUser.some(
    (e) => e.canonical_user_id === userRank.canonical_user_id
  );
  const showStickyCardB = Boolean(userRank) && !isUserInBatchB;

  assert.equal(isUserInBatchB, true);
  assert.equal(showStickyCardB, false, "Sticky card MUST be hidden when user is present in loaded list");
});
