import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  COMMUNITY_STORAGE_ERROR,
  CommunityDraft,
  CommunityPeriod,
  CommunityPost,
  CommunityState,
  createInitialCommunityState,
  createSharedPost,
  deleteSharedPost,
  getLeaderboard,
  getVisibleCommunityPosts,
  loadCommunityState,
  participationScore,
  reportCommunityPost,
  saveCommunityState,
  validateCommunityDraft,
} from "@/lib/communityService";
import { formatCarbonFootprint } from "@/lib/mealFootprint";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Award, EyeOff, Flag, Heart, LogOut, ShieldCheck, Sparkles, Trash2, UsersRound } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const EMPTY_DRAFT: CommunityDraft = {
  displayName: "Green Explorer 24",
  mealsLogged: 0,
  weeklyFootprint: 0,
  message: "I explored a sustainable food choice this week.",
};

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-xs font-extrabold uppercase tracking-[0.13em] text-[#557c5b]">{children}</label>;
}

function CommunityPostCard({ post, onDelete, onReport }: { post: CommunityPost; onDelete: () => void; onReport: () => void }) {
  const [inspired, setInspired] = useState(false);
  return (
    <article className="rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_8px_20px_rgba(36,79,54,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-display text-2xl tracking-[-0.04em] text-[#1b4934]">{post.displayName}</p><p className="mt-1 text-xs font-bold text-[#6a806f]">{post.mealsLogged} meals logged · {formatCarbonFootprint(post.weeklyFootprint)} this week</p></div>
        {post.isOwn ? <button type="button" aria-label={`Delete shared post by ${post.displayName}`} onClick={onDelete} className="flex size-10 items-center justify-center rounded-xl border border-[#eed7cd] text-[#a55844] hover:bg-[#fff0eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Trash2 className="size-4" aria-hidden="true" /></button> : <button type="button" aria-label={`Report post by ${post.displayName}`} onClick={onReport} className="flex size-10 items-center justify-center rounded-xl border border-[#e6d9b7] text-[#8a672c] hover:bg-[#fff7e4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Flag className="size-4" aria-hidden="true" /></button>}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4f6958]">{post.message}</p>
      <button type="button" onClick={() => setInspired((value) => !value)} className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049] ${inspired ? "bg-[#e4f0d8] text-[#286142]" : "bg-[#f2f4eb] text-[#52705a] hover:bg-[#e7f0df]"}`}><Heart className={`size-4 ${inspired ? "fill-current" : ""}`} aria-hidden="true" />{inspired ? "Inspired" : "Be Inspired"}</button>
    </article>
  );
}

export default function StudentCommunity() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [community, setCommunity] = useState<CommunityState>(() => createInitialCommunityState());
  const [draft, setDraft] = useState<CommunityDraft>(EMPTY_DRAFT);
  const [preview, setPreview] = useState<CommunityDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<CommunityPeriod>("week");
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const reportForTeacher = trpc.moderation.report.useMutation({
    onSuccess: () => setReportNotice("Your report was sent securely for teacher review. The post is hidden from your feed."),
    onError: () => setReportNotice("The post is hidden from your feed. Sign in to send a report securely for teacher review."),
  });
  const hiddenPostIds = trpc.moderation.hiddenPostIds.useQuery();

  useEffect(() => {
    const loaded = loadCommunityState(window.localStorage);
    setCommunity(loaded.state);
    setDraft((current) => ({ ...current, displayName: loaded.state.settings.anonymousName }));
    setLoadError(loaded.error);
  }, []);

  const updateCommunity = (next: CommunityState) => {
    setCommunity(next);
    try {
      saveCommunityState(window.localStorage, next);
    } catch {
      setLoadError(COMMUNITY_STORAGE_ERROR);
    }
  };

  const visiblePosts = useMemo(() => {
    const blockedIds = new Set(hiddenPostIds.data ?? []);
    return getVisibleCommunityPosts(community).filter((post) => !blockedIds.has(post.id));
  }, [community, hiddenPostIds.data]);
  const leaderboard = useMemo(() => getLeaderboard(community, period), [community, period]);
  const ownPosition = leaderboard.findIndex((student) => student.isOwn);

  const showPreview = () => {
    const error = validateCommunityDraft(draft);
    if (error) return setDraftError(error);
    if (community.settings.keepPrivate) return setDraftError("Turn off Keep all progress private to share this optional post.");
    setDraftError(null);
    setPreview({ ...draft, displayName: draft.displayName.trim(), message: draft.message.trim() });
  };

  const publish = () => {
    if (!preview) return;
    try {
      const next = createSharedPost(community, preview);
      updateCommunity(next);
      setDraft({ ...EMPTY_DRAFT, displayName: next.settings.anonymousName });
      setPreview(null);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "Your post could not be shared.");
      setPreview(null);
    }
  };

  const reportPost = (post: CommunityPost) => {
    updateCommunity(reportCommunityPost(community, post.id));
    if (!isAuthenticated) {
      setReportNotice("The post is hidden from your feed. Sign in to send a report securely for teacher review.");
      return;
    }
    reportForTeacher.mutate({
      postClientId: post.id,
      displayName: post.displayName,
      mealsLogged: post.mealsLogged,
      weeklyFootprintHundredths: Math.round(post.weeklyFootprint * 100),
      message: post.message,
    });
  };

  return (
    <main className="min-h-screen bg-[#f8f4e8] pb-28 text-[#173d2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate("/")} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ArrowLeft className="size-4" aria-hidden="true" />Dashboard</button>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e5f0d9] text-[#276540] shadow-[0_4px_0_#bdd2a9]"><UsersRound className="size-5" aria-hidden="true" /></span>
        </header>

        <nav aria-label="Student Community top menu" className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#dce8d1] bg-[#fffdf5] p-1.5 text-xs font-extrabold text-[#50705b]">
          <button type="button" onClick={() => navigate("/")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">Dashboard</button>
          <button type="button" onClick={() => navigate("/history")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">History</button>
          <span aria-current="page" className="flex min-h-10 shrink-0 items-center rounded-xl bg-[#216442] px-3 text-white">Student Community</span>
          <span className="flex min-h-10 shrink-0 items-center px-3 text-[#89978d]">Account</span>
          <span aria-label="Logout placeholder" className="flex min-h-10 shrink-0 items-center px-2 text-[#89978d]"><LogOut className="size-4" aria-hidden="true" /></span>
        </nav>

        <section className="pt-9">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Student Community</p>
          <h1 className="font-display mt-3 max-w-[13ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c]">Learn together, share safely.</h1>
          <p className="mt-5 max-w-xl text-[1rem] leading-7 text-[#587260]">Share only an optional anonymous summary. Your private meal history stays separate and is never posted automatically.</p>
        </section>

        {loadError && <section role="alert" className="mt-6 rounded-[1.5rem] border border-[#ebd7bd] bg-[#fff8e9] p-4 text-sm leading-6 text-[#805f2c]"><strong>Community is using a safe local fallback.</strong> {loadError}</section>}

        <section className="mt-7 rounded-[2rem] bg-[#1d563a] p-6 text-[#f9f4e7] shadow-[0_16px_35px_rgba(23,65,47,0.16)]" aria-labelledby="sharing-title">
          <div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#d6e8c8] text-[#1e593d]"><ShieldCheck className="size-6" aria-hidden="true" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#d6e8c8]">Share Your Progress</p><h2 id="sharing-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Your choice, your words.</h2><p className="mt-2 text-sm leading-6 text-[#edf4e7]">Posts can include an anonymous name, your chosen meal count, a weekly estimate, and one positive learning message.</p></div></div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Privacy controls</p><h2 className="font-display mt-1 text-3xl tracking-[-0.05em]">You stay in control.</h2></div><EyeOff className="size-7 text-[#67906a]" aria-hidden="true" /></div>
          <label className="mt-5 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-[#f2f6ec] px-4 text-sm font-extrabold text-[#3f624b]"><span>Keep all progress private</span><input aria-label="Keep all progress private" type="checkbox" checked={community.settings.keepPrivate} onChange={(event) => updateCommunity({ ...community, settings: { ...community.settings, keepPrivate: event.target.checked } })} className="size-5 accent-[#286142]" /></label>
          <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-[#f2f6ec] px-4 text-sm font-extrabold text-[#3f624b]"><span>Join the participation leaderboard</span><input aria-label="Join the participation leaderboard" type="checkbox" checked={community.settings.participatesInLeaderboard} onChange={(event) => updateCommunity({ ...community, settings: { ...community.settings, participatesInLeaderboard: event.target.checked } })} className="size-5 accent-[#286142]" /></label>
          <p className="mt-3 text-xs leading-5 text-[#6a806f]">Joining is voluntary. Your name, contact details, photos, location, and private meal history are not shared here.</p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Community guides">
          <button type="button" onClick={() => navigate("/community-safety")} className="min-h-24 rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5 text-left shadow-[0_8px_20px_rgba(36,79,54,0.06)] transition hover:bg-[#f4f8ee] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ShieldCheck className="size-5 text-[#43804f]" aria-hidden="true" /><span className="mt-3 block font-display text-2xl tracking-[-0.04em] text-[#1b4934]">Safety rules</span><span className="mt-1 block text-xs font-bold leading-5 text-[#66806d]">Read before sharing.</span></button>
          <button type="button" onClick={() => navigate("/teacher-moderation")} className="min-h-24 rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5 text-left shadow-[0_8px_20px_rgba(36,79,54,0.06)] transition hover:bg-[#f4f8ee] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Flag className="size-5 text-[#b16a3b]" aria-hidden="true" /><span className="mt-3 block font-display text-2xl tracking-[-0.04em] text-[#1b4934]">Teacher review</span><span className="mt-1 block text-xs font-bold leading-5 text-[#66806d]">Prototype moderation view.</span></button>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]" aria-labelledby="post-form-title">
          <h2 id="post-form-title" className="font-display text-3xl tracking-[-0.05em]">Create an optional post</h2>
          <div className="mt-5 grid gap-4">
            <div><FieldLabel htmlFor="anonymous-name">Anonymous display name</FieldLabel><input id="anonymous-name" value={draft.displayName} maxLength={40} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#cadaca] bg-white px-4 text-sm font-bold text-[#294d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></div>
            <div className="grid grid-cols-2 gap-3"><div><FieldLabel htmlFor="shared-meal-count">Meals logged</FieldLabel><input id="shared-meal-count" type="number" min="0" max="70" value={draft.mealsLogged} onChange={(event) => setDraft({ ...draft, mealsLogged: Number(event.target.value) })} className="min-h-12 w-full rounded-xl border border-[#cadaca] bg-white px-4 text-sm font-bold text-[#294d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></div><div><FieldLabel htmlFor="weekly-footprint">Weekly kg CO2e</FieldLabel><input id="weekly-footprint" type="number" min="0" max="500" step="0.1" value={draft.weeklyFootprint} onChange={(event) => setDraft({ ...draft, weeklyFootprint: Number(event.target.value) })} className="min-h-12 w-full rounded-xl border border-[#cadaca] bg-white px-4 text-sm font-bold text-[#294d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></div></div>
            <div><FieldLabel htmlFor="positive-message">One positive learning message</FieldLabel><textarea id="positive-message" value={draft.message} maxLength={180} rows={4} onChange={(event) => setDraft({ ...draft, message: event.target.value })} className="w-full rounded-xl border border-[#cadaca] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#294d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></div>
          </div>
          {draftError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-bold text-[#9b503f]">{draftError}</p>}
          <button type="button" onClick={showPreview} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#216442] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Sparkles className="size-4" aria-hidden="true" />Preview post</button>
        </section>

        {preview && <section role="dialog" aria-modal="true" aria-labelledby="preview-title" className="mt-6 rounded-[1.75rem] border-2 border-[#89ad78] bg-[#f8fcef] p-5 shadow-[0_14px_30px_rgba(36,79,54,0.12)]"><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#4a8058]">Preview before publishing</p><h2 id="preview-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Check what is shared.</h2><p className="mt-3 text-sm leading-6 text-[#5a725f]">Only the fields below will appear. Private meal history, photos, and location are not included.</p><div className="mt-4 rounded-2xl bg-white p-4"><p className="font-display text-2xl text-[#1b4934]">{preview.displayName}</p><p className="mt-1 text-xs font-bold text-[#6a806f]">{preview.mealsLogged} meals logged · {formatCarbonFootprint(preview.weeklyFootprint)} this week</p><p className="mt-3 text-sm leading-6 text-[#4f6958]">{preview.message}</p></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={publish} className="min-h-12 rounded-xl bg-[#216442] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Confirm and publish</button><button type="button" onClick={() => setPreview(null)} className="min-h-12 rounded-xl border border-[#cbdacb] bg-white px-5 text-sm font-extrabold text-[#42634d] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Edit post</button></div></section>}

        <section className="mt-8" aria-labelledby="feed-title"><div className="flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Community feed</p><h2 id="feed-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Small steps shared safely.</h2></div><span className="rounded-full bg-[#e4efdc] px-3 py-1 text-xs font-bold text-[#44724b]">{visiblePosts.length} posts</span></div>{reportNotice && <div role="status" className="mt-4 rounded-xl bg-[#fff8e9] p-4 text-sm font-bold leading-6 text-[#805f2c]">{reportNotice}{!isAuthenticated && <button type="button" onClick={() => startLogin()} className="mt-3 block min-h-10 rounded-lg bg-[#216442] px-4 text-sm font-extrabold text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Sign in for teacher review</button>}</div>}<div className="mt-4 space-y-4">{visiblePosts.map((post) => <CommunityPostCard key={post.id} post={post} onDelete={() => updateCommunity(deleteSharedPost(community, post.id))} onReport={() => reportPost(post)} />)}</div></section>

        <section className="mt-9 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]" aria-labelledby="leaderboard-title"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Learning Together</p><h2 id="leaderboard-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Class Leaderboard</h2></div><Award className="size-7 text-[#c58a3d]" aria-hidden="true" /></div><p className="mt-4 rounded-2xl bg-[#f2f6ec] px-4 py-3 text-sm leading-6 text-[#506a58]">This leaderboard celebrates participation and learning. It does not judge food choices or compare personal environmental responsibility.</p><div className="mt-5 flex rounded-xl bg-[#edf3e8] p-1"><button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")} className={`min-h-10 flex-1 rounded-lg text-sm font-extrabold ${period === "week" ? "bg-[#216442] text-white" : "text-[#52705a]"}`}>This Week</button><button type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")} className={`min-h-10 flex-1 rounded-lg text-sm font-extrabold ${period === "month" ? "bg-[#216442] text-white" : "text-[#52705a]"}`}>This Month</button></div>{community.settings.participatesInLeaderboard ? <p className="mt-4 rounded-xl bg-[#e8f2df] px-4 py-3 text-sm font-bold text-[#3f654b]">Your current position: {ownPosition + 1} of {leaderboard.length}. You can leave at any time using the privacy control above.</p> : <p className="mt-4 rounded-xl bg-[#fff8e9] px-4 py-3 text-sm font-bold text-[#805f2c]">You are not participating. You can join voluntarily using the privacy control above.</p>}<ol className="mt-5 space-y-3">{leaderboard.map((student, index) => <li key={student.id} className={`flex items-center justify-between gap-3 rounded-2xl p-4 ${student.isOwn ? "bg-[#e6f1dc]" : "bg-[#f7f7ef]"}`}><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#496c55]">{index + 1}</span><div><p className="font-extrabold text-[#2b503a]">{student.displayName}{student.isOwn ? " · You" : ""}</p><p className="mt-0.5 text-xs font-bold text-[#6c8271]">{student.mealsLogged} meals · {student.sustainableSwapsExplored} swaps · {student.helpfulPostsShared} helpful posts</p></div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#4c724f]">{participationScore(student)} points</span></li>)}</ol></section>
      </div>
      <BottomNavigation />
    </main>
  );
}
