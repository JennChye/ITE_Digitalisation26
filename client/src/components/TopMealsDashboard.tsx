import { BarChart3, LogIn, Plus } from "lucide-react";
import React from "react";

export type TopMealSummary = {
  mealSlug: string;
  mealName: string;
  category: "Vegetarian" | "Non Vegetarian";
  timesLogged: number;
  totalServings: number;
  lastLoggedAt: Date;
};

export function TopMealsDashboard({ isAuthenticated, isLoading, topMeals, onLogMeal, onSignIn }: { isAuthenticated: boolean; isLoading: boolean; topMeals: TopMealSummary[]; onLogMeal: () => void; onSignIn: () => void }) {
  const highestCount = Math.max(...topMeals.map((meal) => meal.timesLogged), 1);

  return (
    <section className="mt-9 rounded-[1.75rem] border border-[#d7e5cf] bg-[#fefdf7] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.06)] sm:p-6" aria-labelledby="top-meals-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#638764]">Your meal pattern</p>
          <h2 id="top-meals-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173d2d]">Your top five meals</h2>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e2efd8] text-[#286342]"><BarChart3 className="size-5" aria-hidden="true" /></span>
      </div>

      {!isAuthenticated ? (
        <div className="mt-5 rounded-2xl bg-[#edf4e8] p-4">
          <p className="text-sm font-bold leading-6 text-[#456953]">Sign in to see your five most frequently logged meals. This summary stays private to your account.</p>
          <button type="button" onClick={onSignIn} className="mt-4 min-h-12 rounded-xl bg-[#216442] px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><LogIn className="mr-2 inline size-4" aria-hidden="true" />Sign in to view your meals</button>
        </div>
      ) : isLoading ? (
        <div className="mt-5 space-y-3" aria-label="Loading top meals">
          {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#edf4e8]" />)}
        </div>
      ) : topMeals.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-[#edf4e8] p-4">
          <p className="text-sm font-bold leading-6 text-[#456953]">Log your first meal to see the meals you choose most often.</p>
          <button type="button" onClick={onLogMeal} className="mt-4 min-h-12 rounded-xl bg-[#216442] px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Plus className="mr-2 inline size-4" aria-hidden="true" />Log a meal</button>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {topMeals.map((meal, index) => {
            const width = Math.max((meal.timesLogged / highestCount) * 100, 8);
            return <li key={meal.mealSlug} className="rounded-2xl bg-[#f3f6ed] px-4 py-3">
              <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span aria-label={`Rank ${index + 1}`} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d6e8c8] text-xs font-extrabold text-[#285c3b]">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#244a35]">{meal.mealName}</p><p className="mt-0.5 text-xs font-bold text-[#66806c]">{meal.category}</p></div></div><p className="shrink-0 text-sm font-extrabold text-[#1e593d]">{meal.timesLogged} {meal.timesLogged === 1 ? "log" : "logs"}</p></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#deead9]" role="progressbar" aria-label={`${meal.mealName} was logged ${meal.timesLogged} times`} aria-valuemin={0} aria-valuemax={highestCount} aria-valuenow={meal.timesLogged}><div className="h-full rounded-full bg-[#6f9f63]" style={{ width: `${width}%` }} /></div>
            </li>;
          })}
        </ol>
      )}
    </section>
  );
}
