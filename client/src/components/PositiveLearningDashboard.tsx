import { MEAL_HISTORY_EVENT, readMealLogs } from "@/lib/mealHistoryService";
import { Achievement, calculateAchievements, evaluateNewAchievements, POSITIVE_LEARNING_EVENT, readPositiveLearningState, updateFoodPreferences, updatePositiveLearningSettings } from "@/lib/positiveLearning";
import { Award, BadgeCheck, CalendarDays, Eye, Leaf, Lightbulb, LockKeyhole, Recycle, Settings2, Utensils } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const ICONS = { "first-plate": Utensils, "meal-explorer": Award, "local-food-learner": Eye, "smart-swap-starter": Lightbulb, "weekly-tracker": CalendarDays, "waste-wise": Recycle } as const;

function listToText(items: string[]) { return items.join(", "); }
function textToList(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }

export default function PositiveLearningDashboard() {
  const [state, setState] = useState(() => readPositiveLearningState());
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(() => {
    const logs = readMealLogs();
    const newBadges = evaluateNewAchievements(logs);
    setState(readPositiveLearningState());
    if (newBadges.length) setNotice("You unlocked a new learning badge.");
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(MEAL_HISTORY_EVENT, refresh);
    window.addEventListener(POSITIVE_LEARNING_EVENT, refresh);
    return () => { window.removeEventListener(MEAL_HISTORY_EVENT, refresh); window.removeEventListener(POSITIVE_LEARNING_EVENT, refresh); };
  }, [refresh]);

  const logs = useMemo(() => readMealLogs(), [state]);
  const achievements = useMemo(() => calculateAchievements(logs, state), [logs, state]);
  const earned = achievements.filter((achievement) => achievement.earned);
  const locked = achievements.filter((achievement) => !achievement.earned);
  const uniqueMeals = new Set(logs.map((log) => log.mealId)).size;

  const updateSettings = (settings: Parameters<typeof updatePositiveLearningSettings>[0]) => updatePositiveLearningSettings(settings);
  const savePreferences = (preferences: Parameters<typeof updateFoodPreferences>[0]) => updateFoodPreferences(preferences);

  return (
    <section className="mt-7" aria-label="Private learning progress">
      <div className="rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6">
        <div className="flex items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e5f0d9] text-[#276540] shadow-[0_4px_0_#bdd2a9]"><Settings2 className="size-5" aria-hidden="true" /></div><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5a865c]">Private learning controls</p><h2 className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173f2e]">Choose what helps you learn.</h2><p className="mt-2 text-sm leading-6 text-[#5d7465]">These settings stay on this device. They are not sent to Student Community or the leaderboard.</p></div></div>
        <div className="mt-5 space-y-3 rounded-2xl bg-[#f4f0e4] p-4">
          <label className="flex min-h-12 items-center justify-between gap-4"><span><span className="block text-sm font-extrabold text-[#355743]">Learning badges</span><span className="mt-0.5 block text-xs font-bold text-[#69806d]">Show private achievement progress</span></span><input aria-label="Turn learning badges on" type="checkbox" checked={state.settings.badgesEnabled} onChange={(event) => updateSettings({ badgesEnabled: event.target.checked })} className="size-5 accent-[#216442]" /></label>
          <label className="flex min-h-12 items-center justify-between gap-4 border-t border-[#ddd7c7] pt-3"><span><span className="block text-sm font-extrabold text-[#355743]">Sustainable swaps</span><span className="mt-0.5 block text-xs font-bold text-[#69806d]">Show optional meal detail ideas</span></span><input aria-label="Turn sustainable swaps on" type="checkbox" checked={state.settings.recommendationsEnabled} onChange={(event) => updateSettings({ recommendationsEnabled: event.target.checked })} className="size-5 accent-[#216442]" /></label>
        </div>
        <details className="group mt-4 rounded-2xl border border-[#d9e5d0] bg-white"><summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-extrabold text-[#315f42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Leaf className="size-4 text-[#4a8058]" aria-hidden="true" />Food preferences for swaps</summary><div className="space-y-4 border-t border-[#e0ead8] p-4"><label className="flex min-h-11 items-center gap-3 text-sm font-extrabold text-[#315f42]"><input aria-label="Vegetarian swap options only" type="checkbox" checked={state.preferences.vegetarianOnly} onChange={(event) => savePreferences({ vegetarianOnly: event.target.checked })} className="size-5 accent-[#216442]" />Vegetarian swap options only</label><label className="block text-sm font-extrabold text-[#315f42]">Allergies or safety concerns<input aria-label="Allergies or safety concerns" value={listToText(state.preferences.allergies)} onChange={(event) => savePreferences({ allergies: textToList(event.target.value) })} placeholder="Example: tofu, nuts" className="mt-2 min-h-11 w-full rounded-xl border border-[#d5e2cd] px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></label><label className="block text-sm font-extrabold text-[#315f42]">Ingredients to avoid<input aria-label="Ingredients to avoid" value={listToText(state.preferences.avoidedIngredients)} onChange={(event) => savePreferences({ avoidedIngredients: textToList(event.target.value) })} placeholder="Example: seafood" className="mt-2 min-h-11 w-full rounded-xl border border-[#d5e2cd] px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></label><label className="block text-sm font-extrabold text-[#315f42]">Cultural preferences<input aria-label="Cultural preferences" value={listToText(state.preferences.culturalPreferences)} onChange={(event) => savePreferences({ culturalPreferences: textToList(event.target.value) })} placeholder="Example: halal" className="mt-2 min-h-11 w-full rounded-xl border border-[#d5e2cd] px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" /></label><p className="rounded-xl bg-[#fff8e9] p-3 text-xs leading-5 text-[#765e32]">Safety concerns and avoided ingredients are filtered before a swap option is shown. Cultural preferences are kept private and guide your own decision.</p></div></details>
      </div>
      {state.settings.badgesEnabled && <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6" aria-labelledby="achievements-title"><div className="flex items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8e6a2] text-[#72591c] shadow-[0_4px_0_#ddc56d]"><Award className="size-5" aria-hidden="true" /></div><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#8c7025]">Positive progress</p><h2 id="achievements-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173f2e]">Achievements</h2><p className="mt-2 text-sm leading-6 text-[#5d7465]">Explore at your own pace. There are no daily streaks or deadlines.</p></div></div>{notice && <p role="status" className="mt-4 rounded-xl bg-[#e7f2df] p-3 text-sm font-extrabold text-[#2c6541]">{notice}</p>}<div className="mt-5 grid grid-cols-2 gap-3">{earned.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}{locked.map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}</div><div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f4f0e4] p-4 text-center"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6a806f]">Badges earned</p><p className="font-display mt-1 text-3xl text-[#214b35]">{earned.length}/6</p></div><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6a806f]">Meals logged</p><p className="font-display mt-1 text-3xl text-[#214b35]">{logs.length}</p></div><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6a806f]">Meals explored</p><p className="font-display mt-1 text-3xl text-[#214b35]">{uniqueMeals}</p></div><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6a806f]">Swaps viewed</p><p className="font-display mt-1 text-3xl text-[#214b35]">{state.viewedRecommendationIds.length}</p></div></div></section>}
    </section>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ICONS[achievement.id];
  const percent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
  return <article className={`rounded-2xl border p-4 ${achievement.earned ? "border-[#b9d8b4] bg-[#edf6e7]" : "border-[#e0e4d9] bg-[#f7f5ef]"}`}><div className="flex items-start justify-between gap-2"><span className={`flex size-9 items-center justify-center rounded-xl ${achievement.earned ? "bg-[#d7ebce] text-[#28613e]" : "bg-[#ecebe4] text-[#747d74]"}`}>{achievement.earned ? <BadgeCheck className="size-5" aria-label="Earned badge" /> : <LockKeyhole className="size-4" aria-label="Locked badge" />}</span><Icon className={`size-4 ${achievement.earned ? "text-[#3e7850]" : "text-[#88938b]"}`} aria-hidden="true" /></div><h3 className="mt-4 text-sm font-extrabold text-[#315540]">{achievement.title}</h3><p className="mt-1 text-xs leading-5 text-[#65796b]">{achievement.description}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label={`${achievement.title} progress`} aria-valuemin={0} aria-valuemax={achievement.target} aria-valuenow={achievement.progress}><div className={`h-full rounded-full ${achievement.earned ? "bg-[#4f945b]" : "bg-[#b9c5b5]"}`} style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs font-extrabold text-[#5d7465]">{achievement.earned ? "Unlocked" : `${achievement.progress} of ${achievement.target}`}</p></article>;
}
