export type CommunityPeriod = "week" | "month";

export type CommunityPost = {
  id: string;
  displayName: string;
  mealsLogged: number;
  weeklyFootprint: number;
  message: string;
  createdAt: number;
  isOwn: boolean;
  reported?: boolean;
};

export type CommunitySettings = {
  anonymousName: string;
  keepPrivate: boolean;
  participatesInLeaderboard: boolean;
  sustainableSwapsExplored: number;
};

export type CommunityState = {
  settings: CommunitySettings;
  posts: CommunityPost[];
};

export type ParticipationStudent = {
  id: string;
  displayName: string;
  mealsLogged: number;
  sustainableSwapsExplored: number;
  helpfulPostsShared: number;
  isOwn?: boolean;
};

export type CommunityDraft = {
  displayName: string;
  mealsLogged: number;
  weeklyFootprint: number;
  message: string;
};

export const COMMUNITY_STORAGE_KEY = "platefootprint.community.v1";
export const COMMUNITY_STORAGE_ERROR = "Community data could not load. Your private meal tracking is still available.";

const samplePosts: CommunityPost[] = [
  { id: "sample-1", displayName: "Green Explorer 24", mealsLogged: 5, weeklyFootprint: 12.4, message: "I explored a vegetable option this week and learned more about portion sizes.", createdAt: 1762905600000, isOwn: false },
  { id: "sample-2", displayName: "Curious Changemaker 08", mealsLogged: 4, weeklyFootprint: 10.8, message: "I compared two noodle meals before choosing my lunch.", createdAt: 1762819200000, isOwn: false },
  { id: "sample-3", displayName: "Food Learner 17", mealsLogged: 3, weeklyFootprint: 8.1, message: "I tried the ingredient estimator to understand my usual meal.", createdAt: 1762732800000, isOwn: false },
];

const sampleParticipants: ParticipationStudent[] = [
  { id: "student-1", displayName: "Green Explorer 24", mealsLogged: 5, sustainableSwapsExplored: 2, helpfulPostsShared: 1 },
  { id: "student-2", displayName: "Curious Changemaker 08", mealsLogged: 4, sustainableSwapsExplored: 3, helpfulPostsShared: 1 },
  { id: "student-3", displayName: "Food Learner 17", mealsLogged: 3, sustainableSwapsExplored: 1, helpfulPostsShared: 2 },
  { id: "student-4", displayName: "Planet Starter 31", mealsLogged: 2, sustainableSwapsExplored: 1, helpfulPostsShared: 0 },
];

export function createInitialCommunityState(): CommunityState {
  return {
    settings: {
      anonymousName: "Green Explorer 24",
      keepPrivate: true,
      participatesInLeaderboard: false,
      sustainableSwapsExplored: 0,
    },
    posts: samplePosts.map((post) => ({ ...post })),
  };
}

function isSafeText(value: string, maxLength: number): boolean {
  const privateContactPattern = /@|\b(?:\+?\d[\d\s()]{7,}\d)\b|https?:\/\//i;
  return value.trim().length > 0 && value.trim().length <= maxLength && !privateContactPattern.test(value);
}

export function validateCommunityDraft(draft: CommunityDraft): string | null {
  if (!isSafeText(draft.displayName, 40)) return "Use a short anonymous display name without contact details.";
  if (!isSafeText(draft.message, 180)) return "Use one short positive message without contact details or links.";
  if (!Number.isInteger(draft.mealsLogged) || draft.mealsLogged < 0 || draft.mealsLogged > 70) return "Enter a meal number from 0 to 70.";
  if (!Number.isFinite(draft.weeklyFootprint) || draft.weeklyFootprint < 0 || draft.weeklyFootprint > 500) return "Enter a weekly estimate from 0 to 500 kg CO2e.";
  return null;
}

export function createSharedPost(state: CommunityState, draft: CommunityDraft, now = Date.now()): CommunityState {
  const validationError = validateCommunityDraft(draft);
  if (validationError) throw new Error(validationError);
  if (state.settings.keepPrivate) throw new Error("Turn off Keep all progress private before publishing a shared post.");

  const post: CommunityPost = {
    id: `own-${now}`,
    displayName: draft.displayName.trim(),
    mealsLogged: draft.mealsLogged,
    weeklyFootprint: Math.round(draft.weeklyFootprint * 100) / 100,
    message: draft.message.trim(),
    createdAt: now,
    isOwn: true,
  };
  return {
    settings: { ...state.settings, anonymousName: post.displayName },
    posts: [post, ...state.posts],
  };
}

export function deleteSharedPost(state: CommunityState, postId: string): CommunityState {
  return { ...state, posts: state.posts.filter((post) => !(post.id === postId && post.isOwn)) };
}

export function reportCommunityPost(state: CommunityState, postId: string): CommunityState {
  return { ...state, posts: state.posts.map((post) => post.id === postId ? { ...post, reported: true } : post) };
}

export function getVisibleCommunityPosts(state: CommunityState): CommunityPost[] {
  return state.posts.filter((post) => !post.reported);
}

export function participationScore(student: ParticipationStudent): number {
  return student.mealsLogged * 2 + student.sustainableSwapsExplored * 3 + student.helpfulPostsShared * 5;
}

export function getLeaderboard(state: CommunityState, period: CommunityPeriod): ParticipationStudent[] {
  const ownPosts = state.posts.filter((post) => post.isOwn && !post.reported);
  const ownMealsLogged = ownPosts.reduce((highest, post) => Math.max(highest, post.mealsLogged), 0);
  const ownParticipant: ParticipationStudent = {
    id: "own",
    displayName: state.settings.anonymousName,
    mealsLogged: period === "week" ? ownMealsLogged : ownMealsLogged * 4,
    sustainableSwapsExplored: period === "week" ? state.settings.sustainableSwapsExplored : state.settings.sustainableSwapsExplored * 4,
    helpfulPostsShared: ownPosts.length,
    isOwn: true,
  };
  const participants = state.settings.participatesInLeaderboard ? [...sampleParticipants, ownParticipant] : sampleParticipants;
  return [...participants].sort((first, second) => participationScore(second) - participationScore(first) || first.displayName.localeCompare(second.displayName));
}

export function loadCommunityState(storage: Pick<Storage, "getItem">): { state: CommunityState; error: string | null } {
  try {
    const stored = storage.getItem(COMMUNITY_STORAGE_KEY);
    if (!stored) return { state: createInitialCommunityState(), error: null };
    const parsed = JSON.parse(stored) as CommunityState;
    if (!parsed.settings || !Array.isArray(parsed.posts)) throw new Error("Invalid community data");
    return { state: parsed, error: null };
  } catch {
    return { state: createInitialCommunityState(), error: COMMUNITY_STORAGE_ERROR };
  }
}

export function saveCommunityState(storage: Pick<Storage, "setItem">, state: CommunityState): void {
  storage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(state));
}
