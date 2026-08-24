import { useAuth } from "@/_core/hooks/useAuth";
import BottomNavigation from "@/components/BottomNavigation";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, EyeOff, Flag, Loader2, LockKeyhole, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "wouter";

const MODERATION_REASONS = [
  { value: "private_information", label: "Private information" },
  { value: "unkind_or_harmful", label: "Unkind or harmful content" },
  { value: "off_topic", label: "Not related to community learning" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "other", label: "Other teacher reason" },
] as const;

type ModerationReason = (typeof MODERATION_REASONS)[number]["value"];
type ModerationAction = "restored" | "hidden" | "removed";

function reasonLabel(reason: ModerationReason) {
  return MODERATION_REASONS.find((option) => option.value === reason)?.label ?? "Teacher reason";
}

function actionLabel(action: ModerationAction) {
  if (action === "restored") return "Restored";
  if (action === "hidden") return "Hidden";
  return "Removed";
}

function CaseCard({ item, isSaving, onResolve }: { item: { id: number; displayName: string; mealsLogged: number; weeklyFootprintHundredths: number; message: string }; isSaving: boolean; onResolve: (action: ModerationAction, reason: ModerationReason) => void }) {
  const [reason, setReason] = useState<ModerationReason>("private_information");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const weeklyFootprint = (item.weeklyFootprintHundredths / 100).toFixed(2);
  return (
    <article className="rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_8px_20px_rgba(36,79,54,0.07)]">
      <div className="flex items-start justify-between gap-3"><div><p className="font-display text-2xl tracking-[-0.04em] text-[#1b4934]">{item.displayName}</p><p className="mt-1 text-xs font-bold text-[#6a806f]">{item.mealsLogged} meals · {weeklyFootprint} kg CO2e shared</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-extrabold text-[#a75b35]"><Flag className="size-3" aria-hidden="true" />Reported</span></div>
      <p className="mt-4 rounded-xl bg-[#f5f7ef] p-4 text-sm leading-6 text-[#4f6958]">{item.message}</p>
      <label className="mt-4 block text-xs font-extrabold uppercase tracking-[0.13em] text-[#5b835e]">Moderation reason<select aria-label={`Moderation reason for ${item.displayName}`} value={reason} onChange={(event) => setReason(event.target.value as ModerationReason)} disabled={isSaving} className="mt-2 min-h-11 w-full rounded-xl border border-[#cadaca] bg-white px-3 text-sm font-bold normal-case tracking-normal text-[#294d38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">{MODERATION_REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      {confirmRemove ? <div role="alert" className="mt-4 rounded-xl border border-[#edc8b8] bg-[#fff2ec] p-4"><p className="text-sm font-bold text-[#814532]">Remove this reported post for {reasonLabel(reason)}?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={isSaving} onClick={() => onResolve("removed", reason)} className="min-h-10 rounded-lg bg-[#a8503b] px-4 text-sm font-extrabold text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Confirm remove</button><button type="button" disabled={isSaving} onClick={() => setConfirmRemove(false)} className="min-h-10 rounded-lg bg-white px-4 text-sm font-extrabold text-[#556d5b] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Cancel</button></div></div> : <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={isSaving} onClick={() => onResolve("restored", reason)} className="min-h-10 rounded-lg bg-[#e4f0d8] px-4 text-sm font-extrabold text-[#286142] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Restore to feed</button><button type="button" disabled={isSaving} onClick={() => onResolve("hidden", reason)} className="min-h-10 rounded-lg bg-[#f3efe4] px-4 text-sm font-extrabold text-[#786334] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Hide from feed</button><button type="button" disabled={isSaving} onClick={() => setConfirmRemove(true)} className="min-h-10 rounded-lg bg-[#fff0eb] px-4 text-sm font-extrabold text-[#a2553f] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Remove post</button></div>}
    </article>
  );
}

export default function TeacherModeration() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const canModerate = user?.role === "teacher" || user?.role === "admin";
  const utils = trpc.useUtils();
  const openCases = trpc.moderation.openCases.useQuery(undefined, { enabled: canModerate });
  const auditHistory = trpc.moderation.auditHistory.useQuery(undefined, { enabled: canModerate });
  const resolve = trpc.moderation.resolve.useMutation({
    onSuccess: () => {
      void utils.moderation.openCases.invalidate();
      void utils.moderation.auditHistory.invalidate();
    },
  });

  const protectedContent = !loading && (!isAuthenticated || !canModerate);

  return (
    <main className="min-h-screen bg-[#f8f4e8] pb-28 text-[#173d2d]"><div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" /><div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3"><button type="button" onClick={() => navigate("/community")} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ArrowLeft className="size-4" aria-hidden="true" />Student Community</button><span className="flex size-11 items-center justify-center rounded-2xl bg-[#e5f0d9] text-[#276540] shadow-[0_4px_0_#bdd2a9]"><ShieldCheck className="size-5" aria-hidden="true" /></span></header>
      <nav aria-label="Teacher moderation menu" className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#dce8d1] bg-[#fffdf5] p-1.5 text-xs font-extrabold text-[#50705b]"><button type="button" onClick={() => navigate("/community")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">Community</button><button type="button" onClick={() => navigate("/community-safety")} className="min-h-10 shrink-0 rounded-xl px-3 hover:bg-[#eaf2df] focus-visible:outline-2 focus-visible:outline-[#2c7049]">Safety rules</button><span aria-current="page" className="flex min-h-10 shrink-0 items-center rounded-xl bg-[#216442] px-3 text-white">Teacher review</span></nav>
      <section className="pt-9"><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Secure teacher workspace</p><h1 className="font-display mt-3 max-w-[14ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c]">Review reports with care.</h1><p className="mt-5 max-w-xl text-[1rem] leading-7 text-[#587260]">Only teachers and administrators can view this moderation queue and audit history. Private meal history is never included.</p></section>
      {loading && <div className="mt-8 flex min-h-40 items-center justify-center rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5]"><Loader2 className="size-7 animate-spin text-[#3e7a50]" aria-label="Checking teacher access" /></div>}
      {protectedContent && <section className="mt-8 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-6 text-center shadow-[0_10px_24px_rgba(36,79,54,0.08)]"><LockKeyhole className="mx-auto size-8 text-[#55835c]" aria-hidden="true" /><h2 className="font-display mt-4 text-3xl tracking-[-0.05em]">Teacher access only</h2><p className="mt-3 text-sm leading-6 text-[#5d7663]">{isAuthenticated ? "Your signed in account is not assigned the Teacher role. Ask an administrator to grant secure teacher access." : "Sign in with an approved Teacher or Administrator account to review reports."}</p>{!isAuthenticated && <button type="button" onClick={() => startLogin()} className="mt-5 min-h-12 rounded-xl bg-[#216442] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Sign in for teacher access</button>}</section>}
      {canModerate && <><section className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-[1.5rem] bg-[#1d563a] p-5 text-[#f9f4e7]"><Flag className="size-5 text-[#d8e8ca]" aria-hidden="true" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-[#d8e8ca]">Needs review</p><p className="font-display mt-1 text-4xl">{openCases.data?.length ?? 0}</p></div><div className="rounded-[1.5rem] border border-[#dce8d1] bg-[#fffdf5] p-5"><CheckCircle2 className="size-5 text-[#4c8a5a]" aria-hidden="true" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-[#5b835e]">Audit records</p><p className="font-display mt-1 text-4xl text-[#234b36]">{auditHistory.data?.length ?? 0}</p></div></section>
      <section className="mt-7" aria-labelledby="reports-title"><div className="flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Reported posts</p><h2 id="reports-title" className="font-display mt-1 text-3xl tracking-[-0.05em]">Review queue</h2></div><span className="rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-bold text-[#a75b35]">{openCases.data?.length ?? 0} open</span></div>{openCases.isLoading ? <div className="mt-4 flex min-h-28 items-center justify-center rounded-[1.5rem] bg-[#fffdf5]"><Loader2 className="size-6 animate-spin text-[#3e7a50]" /></div> : openCases.data?.length ? <div className="mt-4 space-y-4">{openCases.data.map((item) => <CaseCard key={item.id} item={item} isSaving={resolve.isPending} onResolve={(action, reason) => resolve.mutate({ moderationCaseId: item.id, action, reason })} />)}</div> : <div className="mt-4 rounded-[1.5rem] border border-dashed border-[#cbdcc8] bg-[#fffdf5] p-6 text-center"><UsersRound className="mx-auto size-7 text-[#6d9771]" aria-hidden="true" /><p className="mt-3 font-extrabold text-[#365942]">No open reports right now.</p><p className="mt-2 text-sm leading-6 text-[#66806d]">Reported community posts from signed in students will appear here.</p></div>}</section>
      <section className="mt-8 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5"><div className="flex items-start gap-3"><EyeOff className="mt-1 size-5 text-[#658e68]" aria-hidden="true" /><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6a8a66]">Audit history</p><h2 className="font-display mt-1 text-3xl tracking-[-0.05em]">Teacher decisions</h2><p className="mt-2 text-sm leading-6 text-[#66806d]">Each decision records the teacher, action, reason, and time.</p></div></div>{auditHistory.isLoading ? <Loader2 className="mx-auto my-7 size-6 animate-spin text-[#3e7a50]" /> : auditHistory.data?.length ? <div className="mt-4 space-y-3">{auditHistory.data.map((entry) => <div key={entry.id} className="rounded-xl bg-[#f5f7ef] p-4"><div className="flex items-center justify-between gap-3"><p className="font-extrabold text-[#375941]">{entry.displayName}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#587460]">{actionLabel(entry.action)}</span></div><p className="mt-2 text-sm text-[#57705d]">Reason: {reasonLabel(entry.reason as ModerationReason)}</p><p className="mt-1 text-xs font-bold text-[#728777]">Teacher: {entry.teacherName || "Teacher"} · {new Date(entry.createdAt).toLocaleString()}</p></div>)}</div> : <p className="mt-4 text-sm leading-6 text-[#66806d]">Teacher decisions will appear here after an open report is resolved.</p>}</section></>}
    </div><BottomNavigation /></main>
  );
}
