/**
 * Hawker Market Journal style: a calm receipt journal for reviewing daily meal estimates.
 * It uses layered paper cards, clear mobile controls, and supportive, non judgemental language.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BottomNavigation from "@/components/BottomNavigation";
import { startLogin } from "@/const";
import { useMealCloudSync } from "@/hooks/useMealCloudSync";
import {
  MealLog,
  EMPTY_HISTORY_MESSAGE,
  calculateDailySummary,
  clearMealLogsForDate,
  deleteMealLog,
  getLocalDateKey,
  getLogsForDate,
  readMealLogs,
  updateMealLogLocation,
  updateMealLogServings,
} from "@/lib/mealHistoryService";
import { formatCarbonFootprint, normaliseServings } from "@/lib/mealFootprint";
import { CalendarDays, ChevronRight, Cloud, Leaf, LogIn, MapPin, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type Confirmation =
  | { type: "delete"; log: MealLog }
  | { type: "clear" };

function formatLoggedTime(loggedAt: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(loggedAt));
}

export default function DailyHistory() {
  const [, navigate] = useLocation();
  const today = getLocalDateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [localLogs, setLocalLogs] = useState<MealLog[]>(() => readMealLogs());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServings, setEditingServings] = useState(1);
  const [editingLocation, setEditingLocation] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const { isAuthenticated, logs: cloudLogs, historyLoading, updateCloudServings, updateCloudLocation, deleteCloudLog, clearCloudDate } = useMealCloudSync();
  const logs = isAuthenticated ? cloudLogs : localLogs;

  const dateLogs = useMemo(() => getLogsForDate(logs, selectedDate), [logs, selectedDate]);
  const summary = useMemo(() => calculateDailySummary(logs, selectedDate), [logs, selectedDate]);

  function startEditing(log: MealLog) {
    setEditingId(log.id);
    setEditingServings(log.servings);
    setEditingLocation(log.location ?? "");
  }

  function saveServingEdit(log: MealLog) {
    if (isAuthenticated) {
      updateCloudServings({ id: Number(log.id), servings: editingServings });
      updateCloudLocation({ id: Number(log.id), locationText: editingLocation.trim() || null });
      setEditingId(null);
      return;
    }
    updateMealLogServings(log.id, editingServings);
    const updatedLogs = updateMealLogLocation(log.id, editingLocation);
    setLocalLogs(updatedLogs);
    setEditingId(null);
  }

  function confirmAction() {
    if (!confirmation) return;

    if (confirmation.type === "delete") {
      if (isAuthenticated) deleteCloudLog({ id: Number(confirmation.log.id) });
      else setLocalLogs(deleteMealLog(confirmation.log.id));
    } else {
      if (isAuthenticated) clearCloudDate({ localDate: selectedDate });
      else setLocalLogs(clearMealLogsForDate(selectedDate));
    }
    setConfirmation(null);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f4e8] pb-28 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-8 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e5f0d9] shadow-[0_6px_0_#bdd2a9]">
              <img src="/manus-storage/platefootprint-logo_8cf36295.png" alt="" className="size-10 object-contain" />
            </span>
            <span className="font-display text-[1.55rem] leading-none tracking-[-0.05em] text-[#174132]">Plate<span className="text-[#c6653f]">Footprint</span></span>
          </div>
          <span className="market-stamp bg-[#fffaf0] text-[#386146]">Meal journal</span>
        </header>

        <section className="pt-10" aria-labelledby="history-title">
          <p className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Daily history</p>
          <h1 id="history-title" className="font-display max-w-[12ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c] sm:text-6xl">Your meal notes.</h1>
          <p className="mt-5 max-w-md text-[1rem] leading-7 text-[#567061]">Look back at your food estimates, one day at a time.</p>
        </section>

        <section className={`mt-6 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${isAuthenticated ? "border-[#c7dfc1] bg-[#edf5e9]" : "border-[#e7d9bd] bg-[#fff9e9]"}`} aria-label="History sync status">
          <div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-xl ${isAuthenticated ? "bg-[#d7ebce] text-[#276540]" : "bg-[#faebc8] text-[#976223]"}`}>{isAuthenticated ? <Cloud className="size-5" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />}</span><p className="text-sm font-bold text-[#486351]">{isAuthenticated ? "Cloud sync is on. Your meal history can follow you across devices." : "Your meal history stays on this device until you sign in."}</p></div>
          {!isAuthenticated && <button type="button" onClick={startLogin} className="min-h-10 shrink-0 rounded-xl bg-[#216442] px-3 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Sign in</button>}
        </section>

        <section className="mt-7 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]" aria-label="Choose history date">
          <label htmlFor="history-date" className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5a865c]">Choose a date</label>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f4f0e4] px-4 py-3">
            <CalendarDays className="size-5 text-[#317247]" aria-hidden="true" />
            <input
              id="history-date"
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value || today)}
              className="min-h-8 w-full bg-transparent text-base font-extrabold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]"
            />
          </div>
        </section>

        <section className="mt-5 rounded-[1.75rem] bg-[#1d563a] p-5 text-[#fffdf5] shadow-[0_16px_35px_rgba(23,65,47,0.16)]" aria-labelledby="summary-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#d5e8c8]">Daily summary</p>
              <h2 id="summary-title" className="font-display mt-1 text-4xl tracking-[-0.055em]">{formatCarbonFootprint(summary.totalCarbonFootprint)}</h2>
              <p className="mt-1 text-sm font-bold text-[#edf5e7]">{summary.mealCount} {summary.mealCount === 1 ? "meal" : "meals"} logged</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#d6e8c8] text-[#205c3d] shadow-[0_4px_0_#a3c49c]"><Leaf className="size-6" aria-hidden="true" /></span>
          </div>
          <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-6 text-[#f4f8ef]">These values are estimates and may vary by recipe, portion size, sourcing, and cooking method.</p>
        </section>

        <section className="mt-8" aria-labelledby="logged-meals-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#6a8a66]">Logged meals</p>
              <h2 id="logged-meals-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173d2d]">For this day</h2>
            </div>
            <button
              type="button"
              disabled={dateLogs.length === 0}
              onClick={() => setConfirmation({ type: "clear" })}
              className="min-h-11 rounded-xl border border-[#e7c1b3] bg-[#fff8f4] px-4 text-sm font-extrabold text-[#9a3b27] transition hover:bg-[#fde9e1] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"
            >
              Clear Day
            </button>
          </div>

          {historyLoading ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#b7cda9] bg-[#fffdf5] px-6 py-10 text-center text-sm font-bold text-[#5e7767]">Loading your synced meal notes.</div>
          ) : dateLogs.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#b7cda9] bg-[#fffdf5] px-6 py-10 text-center shadow-[0_10px_24px_rgba(36,79,54,0.05)]">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#e7f1de] text-[#317247]"><Leaf className="size-6" aria-hidden="true" /></span>
              <h3 className="font-display mt-5 text-3xl tracking-[-0.05em] text-[#214635]">No meal notes yet</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#64776a]">{EMPTY_HISTORY_MESSAGE}</p>
              <button type="button" onClick={() => navigate("/")} className="mt-5 min-h-11 rounded-xl bg-[#216442] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Explore meals</button>
            </div>
          ) : (
            <div className="space-y-4">
              {dateLogs.map((log) => {
                const isEditing = editingId === log.id;
                return (
                  <article key={log.id} className="rounded-[1.6rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6c8770]">{formatLoggedTime(log.loggedAt)}</p>
                        <h3 className="font-display mt-1 text-3xl leading-none tracking-[-0.05em] text-[#173f2e]">{log.mealName}</h3>
                        <p className="mt-2 text-sm font-bold text-[#5f7668]">{log.category} · {log.entryMethod === "camera" ? "Photo estimate" : log.entryMethod === "custom" ? "Custom estimate" : "Manual entry"}</p>
                        {log.location && <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#476854]"><MapPin className="size-4 text-[#4d875a]" aria-hidden="true" />{log.location}</p>}
                      </div>
                      <button type="button" aria-label={`View ${log.mealName} details`} onClick={() => navigate(`/meal/${log.mealId}`)} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f0dc] text-[#1e593d] transition hover:bg-[#d6e8c8] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">
                        <ChevronRight className="size-5" aria-hidden="true" />
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="mt-5 rounded-2xl bg-[#f4f0e4] p-3">
                        <label className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5c7a64]">Edit servings</label>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <button type="button" aria-label={`Decrease ${log.mealName} servings`} disabled={editingServings <= 1} onClick={() => setEditingServings((current) => normaliseServings(current - 1))} className="flex size-11 items-center justify-center rounded-xl bg-white text-[#1e593d] shadow-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Minus className="size-4" aria-hidden="true" /></button>
                          <output aria-live="polite" className="font-display text-3xl tracking-[-0.05em] text-[#174b31]">{editingServings} <span className="font-sans text-sm font-extrabold tracking-normal">{editingServings === 1 ? "serving" : "servings"}</span></output>
                          <button type="button" aria-label={`Increase ${log.mealName} servings`} onClick={() => setEditingServings((current) => current + 1)} className="flex size-11 items-center justify-center rounded-xl bg-[#216442] text-white shadow-[0_3px_0_#143e2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Plus className="size-4" aria-hidden="true" /></button>
                        </div>
                        <label className="mt-4 block text-xs font-extrabold uppercase tracking-[0.13em] text-[#5c7a64]">Where you had it <span className="normal-case tracking-normal">optional and private</span><input aria-label={`Where you had ${log.mealName}`} value={editingLocation} onChange={(event) => setEditingLocation(event.target.value)} maxLength={120} placeholder="Example: ITE canteen, home" className="mt-2 min-h-11 w-full rounded-xl border border-[#d5e2cd] bg-white px-3 text-sm font-bold normal-case tracking-normal text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /></label>
                        <div className="mt-3 flex gap-3">
                          <button type="button" onClick={() => saveServingEdit(log)} className="min-h-11 flex-1 rounded-xl bg-[#216442] px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Save change</button>
                          <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border border-[#ccd9c3] bg-white px-4 text-sm font-extrabold text-[#476854] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl bg-[#f4f0e4] px-4 py-3">
                        <div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#6c8770]">Total estimate</p><p className="font-display mt-1 text-3xl leading-none tracking-[-0.05em] text-[#174b31]">{formatCarbonFootprint(log.totalCarbonFootprint)}</p><p className="mt-2 text-sm font-bold text-[#547062]">{log.servings} {log.servings === 1 ? "serving" : "servings"}</p></div>
                        <div className="flex gap-2">
                          <button type="button" aria-label={`Edit ${log.mealName} servings`} onClick={() => startEditing(log)} className="flex size-11 items-center justify-center rounded-xl bg-white text-[#2b6845] shadow-sm transition hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Pencil className="size-4" aria-hidden="true" /></button>
                          <button type="button" aria-label={`Delete ${log.mealName} log`} onClick={() => setConfirmation({ type: "delete", log })} className="flex size-11 items-center justify-center rounded-xl bg-[#fff5f0] text-[#ae442f] shadow-sm transition hover:bg-[#fde6dd] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><Trash2 className="size-4" aria-hidden="true" /></button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNavigation />

      <AlertDialog open={confirmation !== null} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent className="rounded-[1.75rem] border-[#dce8d1] bg-[#fffdf5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-3xl tracking-[-0.05em] text-[#173f2e]">{confirmation?.type === "clear" ? "Clear this day?" : "Delete this meal note?"}</AlertDialogTitle>
            <AlertDialogDescription className="leading-6 text-[#5d7465]">{confirmation?.type === "clear" ? "This will only remove meal logs for the selected day. Other dates will stay in your history." : "This meal log will be removed from your history. Other meal logs will stay safe."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-xl border-[#ccd9c3] bg-white font-extrabold text-[#476854]">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className="min-h-11 rounded-xl bg-[#ad432f] font-extrabold text-white hover:bg-[#923723]">{confirmation?.type === "clear" ? "Clear Day" : "Delete log"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
