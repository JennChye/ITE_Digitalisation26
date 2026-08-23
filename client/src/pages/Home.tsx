/**
 * Hawker Market Journal style: warm food journal layout, rice paper base,
 * Hawker Leaf Green accents, soft editorial type, and tap friendly meal cards.
 */
import BottomNavigation from "@/components/BottomNavigation";
import { TopMealSummary, TopMealsDashboard } from "@/components/TopMealsDashboard";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCloudFoods } from "@/hooks/useCloudFoods";
import { FOOD_DATA_SOURCE_URL } from "@/lib/foodDatabase";
import { getFootprintBand } from "@/lib/mealFootprint";
import { getSessionMealIds } from "@/lib/sessionMealPicker";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpenText, ChevronRight, CircleHelp, Cloud, Leaf, LogIn, Sprout } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function cardImpactText(carbonScore: number) {
  if (carbonScore < 2) return "Lighter choice";
  if (carbonScore < 5) return "Medium impact";
  return "Higher impact";
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { isAuthenticated, logout } = useAuth();
  const { foods, publishedMealsLoading } = useCloudFoods();
  const topMeals = trpc.mealHistory.topFive.useQuery(undefined, { enabled: isAuthenticated });
  const [sessionMealIds, setSessionMealIds] = useState<string[]>([]);

  const [, navigate] = useLocation();

  useEffect(() => {
    if (publishedMealsLoading || foods.length < 3) return;
    setSessionMealIds(getSessionMealIds(foods, window.sessionStorage));
  }, [foods, publishedMealsLoading]);

  const sessionMeals = useMemo(
    () => sessionMealIds.map((id) => foods.find((food) => food.id === id)).filter((food): food is typeof foods[number] => Boolean(food)),
    [foods, sessionMealIds],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f4e8] pb-28 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
        <header className="flex items-center justify-between">
          <a href="#top" aria-label="PlateFootprint home" className="group flex items-center gap-3 rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#2c7049]">
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-[#e5f0d9] shadow-[0_6px_0_#bdd2a9] transition-transform duration-200 group-hover:-translate-y-0.5">
              <img src="/manus-storage/platefootprint-logo_8cf36295.png" alt="" className="size-10 object-contain" />
            </span>
            <span className="font-display text-[1.55rem] leading-none tracking-[-0.05em] text-[#174132]">Plate<span className="text-[#c6653f]">Footprint</span></span>
          </a>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={isAuthenticated ? "Sign out of cloud sync" : "Sign in to sync meal history"} title={isAuthenticated ? "Cloud sync is on. Select to sign out." : "Sign in to sync meal history."} className="flex size-11 items-center justify-center rounded-full border border-[#d7e3cb] bg-[#fffdf5] text-[#2b6845] shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" onClick={() => isAuthenticated ? void logout() : startLogin()}>{isAuthenticated ? <Cloud className="size-5" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />}</button>
            <button type="button" aria-label="Open an example meal footprint" className="flex size-11 items-center justify-center rounded-full border border-[#d7e3cb] bg-[#fffdf5] text-[#2b6845] shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]" onClick={() => navigate("/meal/chicken-rice")}><CircleHelp className="size-5" aria-hidden="true" /></button>
          </div>
        </header>

        <section id="top" className="relative pt-12 pb-7">
          <div className="leaf-loop absolute right-0 top-8 hidden h-24 w-24 sm:block" />
          <div className="leaf-loop absolute right-9 top-16 hidden h-14 w-14 rotate-40 opacity-60 sm:block" />
          <p className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Made for ITE students</p>
          <h1 className="font-display max-w-[11ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c] sm:text-6xl">Today’s meal has a story.</h1>
          <p className="mt-5 max-w-md text-[1.02rem] leading-7 text-[#567061]">Explore the estimated carbon footprint behind familiar meals. Every choice is a chance to learn.</p>
        </section>

        <section aria-label="Food carbon footprint guide" className="relative overflow-hidden rounded-[1.75rem] bg-[#1d563a] px-5 py-5 text-[#f9f4e7] shadow-[0_16px_35px_rgba(23,65,47,0.16)] sm:px-7">
          <Leaf className="absolute -right-3 -top-4 size-28 rotate-12 text-[#7cad73]/30" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#d6e8c8] text-[#1e593d] shadow-[0_4px_0_#a3c49c]"><Sprout className="size-6" aria-hidden="true" /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-[#d6e8c8]">Food carbon score</p><span className="market-stamp bg-[#f8f4e8] text-[#29533a]">One serving</span></div>
              <p className="mt-1 max-w-sm text-sm leading-5 text-[#f4ecdc]">The score shows estimated kg CO₂e for one serving. It is a guide, not a rule.</p>
            </div>
          </div>
        </section>

        <TopMealsDashboard isAuthenticated={isAuthenticated} isLoading={topMeals.isLoading} topMeals={(topMeals.data ?? []) as TopMealSummary[]} onLogMeal={() => navigate("/log")} onSignIn={startLogin} />

        <section className="pt-9" aria-labelledby="meal-list-title">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#6a8a66]">Choose a dish</p><h2 id="meal-list-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173d2d]">Three picks for this session</h2></div>
            <span className="rounded-full bg-[#e4efdc] px-3 py-1 text-xs font-bold text-[#44724b]">3 of {foods.length} meals</span>
          </div>

          <div className="space-y-4" aria-live="polite">
            {sessionMeals.length === 3 ? sessionMeals.map((food, index) => {
              const band = getFootprintBand(food.carbonScore);
              return (
                <button
                  key={food.id}
                  type="button"
                  data-testid="session-meal-card"
                  onClick={() => navigate(`/meal/${food.id}`)}
                  className="meal-card group relative block min-h-48 w-full overflow-hidden rounded-[1.75rem] bg-[#fefcf4] text-left shadow-[0_10px_24px_rgba(36,79,54,0.1)] outline-offset-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(36,79,54,0.16)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2c7049]"
                  style={{ animationDelay: `${index * 65}ms` }}
                >
                  {food.image ? <img src={food.image} alt={food.name} className="absolute inset-y-0 right-0 h-full w-[63%] object-cover transition duration-500 group-hover:scale-105" /> : <span aria-hidden="true" className="absolute inset-y-0 right-0 w-[63%] transition duration-500 group-hover:scale-105" style={{ background: food.cardGradient }} />}
                  <span className="absolute inset-y-0 left-0 w-[68%] bg-[#fffaf0]" />
                  <span className="absolute inset-y-0 left-[62%] w-10 bg-gradient-to-r from-[#fffaf0] to-transparent" />
                  <span className="relative flex min-h-48 max-w-[68%] flex-col items-start justify-between p-5 sm:p-6">
                    <span className="flex flex-wrap gap-2"><span className="market-stamp border-[#a7c09c] bg-[#eef4e7] text-[#3e6d49]">Hawker note {String(index + 1).padStart(2, "0")}</span><span className="rounded-full border border-[#d6e3ce] px-2.5 py-1 text-[0.65rem] font-extrabold text-[#617568]">{food.category}</span>{food.estimateMethod === "Regional research dataset" && <span className="rounded-full border border-[#e1c68e] bg-[#fff6dc] px-2.5 py-1 text-[0.65rem] font-extrabold text-[#8b6424]">Pan Asia research</span>}</span>
                    <span>
                      <span className="block font-display text-3xl leading-[0.95] tracking-[-0.05em] text-[#173f2e] sm:text-4xl">{food.name}</span>
                      <span className="mt-3 flex items-center gap-2"><span className={`size-2.5 shrink-0 rounded-full ${band.dotClass}`} aria-hidden="true" /><span className="text-xs font-extrabold text-[#50695a]">{cardImpactText(food.carbonScore)}</span></span>
                      <span className="mt-1 flex items-center gap-2 text-sm font-extrabold text-[#1e573a]">{food.carbonScore.toFixed(2)} kg CO₂e <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /></span>
                    </span>
                  </span>
                </button>
              );
            }) : <div className="rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 text-sm font-bold text-[#577060]">Choosing three meals from the database for this session.</div>}
          </div>
        </section>

        <section className="mt-9 rounded-[1.75rem] border border-[#dce8d1] bg-[#fefdf7] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.06)]">
          <div className="flex items-start gap-4"><div className="mt-1 h-10 w-1 rounded-full bg-[#d57448]" /><div><p className="font-display text-2xl tracking-[-0.045em] text-[#1a432f]">Small choices add up.</p><p className="mt-2 text-sm leading-6 text-[#5d7465]">Food impact can change with portion size, ingredients, and where food comes from. Use these numbers as a starting point.</p></div></div>
        </section>

        <footer className="receipt-note relative mt-8 px-5 py-5 text-left text-xs leading-5 text-[#637467]">
          <span className="market-stamp mb-3 inline-flex items-center gap-1 bg-[#fffaf0] text-[#386146]"><BookOpenText className="size-3" aria-hidden="true" /> Source note</span>
          <p className="max-w-md">Singapore research scores are based on the IPUR NUS food carbon intensity article. Regional research and prototype estimates are clearly labelled on each meal.</p>
          <a className="mt-3 inline-flex items-center gap-1 font-extrabold text-[#347349] underline decoration-[#94b989] underline-offset-4 hover:text-[#174a31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]" href={FOOD_DATA_SOURCE_URL} target="_blank" rel="noreferrer">Read the source <ArrowUpRight className="size-3" aria-hidden="true" /></a>
        </footer>
      </div>
      <BottomNavigation />
    </main>
  );
}
