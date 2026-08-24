import BottomNavigation from "@/components/BottomNavigation";
import {
  COMMUNITY_STORAGE_ERROR,
  CommunityPost,
  CommunityState,
  createInitialCommunityState,
  getOpenModerationReports,
  getResolvedModerationPosts,
  loadCommunityState,
  moderateCommunityPost,
  saveCommunityState,
} from "@/lib/communityService";
import { formatCarbonFootprint } from "@/lib/mealFootprint";
import { ArrowLeft, CheckCircle2, EyeOff, Flag, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function ReportCard({ post, onRestore, onHide, onRemove }: { post: CommunityPost; onRestore: () => void; onHide: () => void; onRemove: () => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  return (
    <article className="rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_8px_20px_rgba(36,79,54,0.07)]">
      <div className="flex items-start justify-between gap-3"><div><p className="font-display text-2xl tracking-[-0.04em] text-[#1b4934]">{post.displayName}</p><p className="mt-1 text-xs font-bold text-[#6a806f]">{post.mealsLogged} meals · {formatCarbonFootprint(post.weeklyFootprint)} shared</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-extrabold text-[#a75b35]"><Flag className="size-3" aria-hidden="true" />Reported</span></div>
      <p className="mt-4 rounded-xl bg-[#f5f7ef] p-4 text-sm leading-6 text-[#4f6958]">{post.message}</p>
      {confirmRemove ? <div role="alert" className="mt-4 rounded-xl border border-[#edc8b8] bg-[#fff2ec] p-4"><p className="text-sm font-bold text-[#814532]">Remove this prototype post from the shared feed?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onRemove} className="min-h-10 rounded-lg bg-[#a8503b] px-4 text-sm font-extrabold text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Confirm remove</button><button type="button" onClick={() => setConfirmRemove(false)} className="min-h-10 rounded-lg bg-white px-4 text-sm font-extrabold text-[#556d5b] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Cancel</button></div></div> : <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onRestore} className="min-h-10 rounded-lg bg-[#e4f0d8] px-4 text-sm font-extrabold text-[#286142] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Restore to feed</button><button type="button" onClick={onHide} className="min-h-10 rounded-lg bg-[#f3efe4] px-4 text-sm font-extrabold text-[#786334] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Hide from feed</button><button type="button" onClick={() => setConfirmRemove(true)} className="min-h-10 rounded-lg bg-[#fff0eb] px-4 text-sm font-extrabold text-[#a2553f] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Remove post</button></div>}
    </article>
  );
}

export default function TeacherModeration() {
  const [, navigate] = useLocation();
  const [community, setCommunity] = useState<CommunityState>(() => createInitialCommunityState());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadCommunityState(window.localStorage);
    setCommunity(loaded.state);
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

  const reports = useMemo(() => getOpenModerationReports(community), [community]);
  const resolvedPosts = useMemo(() => getResolvedModerationPosts(community), [community]);

  return (
    <main className="min-h-screen bg-[#f8f4e8] pb-28 text-[#173d2d]"><div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" /><div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3"><button type="button" onClick={() => navigate("/community")} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ArrowLeft className="size-4" aria-hidden="true" />Student Community</button><span className="flex size-11 items-center justify-center rounded-2xl bg-[#e5f0d9] text-[#276540] shadow-[0_4px_0_#bdd2a9]"><ShieldCheck className="size-5" aria-hidden="true" /></span></header>
      <nav aria-label="Teacher moderation menu" className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#dce8d1] bg-[#fffdf5] p-1.5 text-xs font-extrabold text-[#50705b]"><button type="button" onClick={() => navigate("/community")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">Community</button><button type="button" onClick={() => navigate("/community-safety")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">Safety rules</button><span aria-current="page" className="flex min-h-10 shrink-0 items-center rounded-xl bg-[#216442] px-3 text-white">Teacher review</span></nav>
      <section className="pt-9"><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Prototype teacher view</p><h1 className="font-display mt-3 max-w-[14ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c]">Review reports with care.</h1><p className="mt-5 max-w-xl text-[1rem] leading-7 text-[#587260]">This prototype uses browser local community data only. It does not show private meal history, contact details, or student accounts.</p></section>
      {loadError && <section role="alert" className="mt-6 rounded-[1.5rem] border border-[#ebd7bd] bg-[#fff8e9] p-4 text-sm leading-6 text-[#805f2c]"><strong>Moderation is using a safe local fallback.</strong> {loadError}</section>}
      <section className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-[1.5rem] bg-[#1d563a] p-5 text-[#f9f4e7]"><Flag className="size-5 text-[#d8e8ca]" aria-hidden="true" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-[#d8e8ca]">Needs review</p><p className="font-display mt-1 text-4xl">{reports.length}</p></div><div className="rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5"><CheckCircle2 className="size-5 text-[#4c8a5a]" aria-hidden="true" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-[#5b835e]">Recent decisions</p><p className="font-display mt-1 text-4xl text-[#234b36]">{resolvedPosts.length}</p></div></section>
      <section className="mt-7" aria-labelledby="reports-title"><div className="flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Reported posts</p><h2 id="reports-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Review queue</h2></div><span className="rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-bold text-[#a75b35]">{reports.length} open</span></div>{reports.length ? <div className="mt-4 space-y-4">{reports.map((post) => <ReportCard key={post.id} post={post} onRestore={() => updateCommunity(moderateCommunityPost(community, post.id, "restore"))} onHide={() => updateCommunity(moderateCommunityPost(community, post.id, "hide"))} onRemove={() => updateCommunity(moderateCommunityPost(community, post.id, "remove"))} />)}</div> : <div className="mt-4 rounded-[1.5rem] border border-dashed border-[#cbdcc8] bg-[#fffdf5] p-6 text-center"><UsersRound className="mx-auto size-7 text-[#6d9771]" aria-hidden="true" /><p className="mt-3 font-extrabold text-[#365942]">No open reports right now.</p><p className="mt-2 text-sm leading-6 text-[#66806d]">For this prototype, report a sample post in Student Community to test the review flow.</p></div>}</section>
      <section className="mt-8 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5"><div className="flex items-start gap-3"><EyeOff className="mt-1 size-5 text-[#658e68]" aria-hidden="true" /><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Decision history</p><h2 className="font-display mt-1 text-3xl tracking-[-0.05em]">Recent actions</h2></div></div>{resolvedPosts.length ? <div className="mt-4 space-y-3">{resolvedPosts.map((post) => <div key={post.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f7ef] px-4 py-3"><p className="font-extrabold text-[#375941]">{post.displayName}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#587460]">{post.moderationStatus === "hidden" ? "Hidden" : "Restored"}</span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-[#66806d]">Actions you take will appear here during this browser session.</p>}</section>
    </div><BottomNavigation /></main>
  );
}
