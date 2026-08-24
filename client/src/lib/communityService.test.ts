import { describe, expect, it } from "vitest";
import {
  COMMUNITY_STORAGE_ERROR,
  createInitialCommunityState,
  createSharedPost,
  deleteSharedPost,
  getLeaderboard,
  getOpenModerationReports,
  getResolvedModerationPosts,
  getVisibleCommunityPosts,
  loadCommunityState,
  moderateCommunityPost,
  participationScore,
  reportCommunityPost,
} from "./communityService";

describe("community service", () => {
  const publicState = () => ({ ...createInitialCommunityState(), settings: { ...createInitialCommunityState().settings, keepPrivate: false, participatesInLeaderboard: true } });

  it("requires a student to turn off private mode before a post can be shared", () => {
    expect(() => createSharedPost(createInitialCommunityState(), { displayName: "Green Explorer 24", mealsLogged: 4, weeklyFootprint: 8.2, message: "I explored a plant based lunch option." })).toThrow("Keep all progress private");
  });

  it("creates an anonymous post without copying private meal history", () => {
    const next = createSharedPost(publicState(), { displayName: "Green Explorer 24", mealsLogged: 4, weeklyFootprint: 8.2, message: "I explored a plant based lunch option." }, 123);
    expect(next.posts[0]).toMatchObject({ id: "own-123", isOwn: true, displayName: "Green Explorer 24", mealsLogged: 4, weeklyFootprint: 8.2 });
    expect(next.posts[0]).not.toHaveProperty("privateHistory");
  });

  it("deletes only an own shared post and hides a reported post from the current feed", () => {
    const shared = createSharedPost(publicState(), { displayName: "Green Explorer 24", mealsLogged: 4, weeklyFootprint: 8.2, message: "I explored a plant based lunch option." }, 123);
    expect(deleteSharedPost(shared, "sample-1").posts).toHaveLength(shared.posts.length);
    expect(deleteSharedPost(shared, "own-123").posts).toHaveLength(shared.posts.length - 1);
    expect(getVisibleCommunityPosts(reportCommunityPost(shared, "sample-1")).some((post) => post.id === "sample-1")).toBe(false);
  });

  it("lets a teacher restore, hide, or remove a reported prototype post", () => {
    const reported = reportCommunityPost(publicState(), "sample-1");
    expect(getOpenModerationReports(reported).map((post) => post.id)).toContain("sample-1");

    const restored = moderateCommunityPost(reported, "sample-1", "restore");
    expect(getVisibleCommunityPosts(restored).map((post) => post.id)).toContain("sample-1");
    expect(getResolvedModerationPosts(restored).find((post) => post.id === "sample-1")?.moderationStatus).toBe("restored");

    const hidden = moderateCommunityPost(reported, "sample-1", "hide");
    expect(getVisibleCommunityPosts(hidden).map((post) => post.id)).not.toContain("sample-1");
    expect(getResolvedModerationPosts(hidden).find((post) => post.id === "sample-1")?.moderationStatus).toBe("hidden");

    expect(moderateCommunityPost(reported, "sample-1", "remove").posts.map((post) => post.id)).not.toContain("sample-1");
  });

  it("ranks students by positive participation instead of carbon footprint", () => {
    expect(participationScore({ id: "x", displayName: "x", mealsLogged: 3, sustainableSwapsExplored: 2, helpfulPostsShared: 1 })).toBe(17);
    const leaderboard = getLeaderboard(publicState(), "week");
    expect(leaderboard[0]).not.toHaveProperty("weeklyFootprint");
    expect(leaderboard.some((student) => student.isOwn)).toBe(true);
    expect(getLeaderboard({ ...publicState(), settings: { ...publicState().settings, participatesInLeaderboard: false } }, "week").some((student) => student.isOwn)).toBe(false);
  });

  it("recovers safely when community browser data cannot load", () => {
    const result = loadCommunityState({ getItem: () => { throw new Error("blocked"); } });
    expect(result.error).toBe(COMMUNITY_STORAGE_ERROR);
    expect(result.state.posts).toHaveLength(3);
  });
});
