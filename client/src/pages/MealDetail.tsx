/**
 * Hawker Market Journal style: a calm paper detail page with large mobile controls,
 * clear carbon facts, supportive guidance, and receipt like source information.
 */
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import SustainableSwapSection from "@/components/SustainableSwapSection";
import { useCloudFoods } from "@/hooks/useCloudFoods";
import { useMealCloudSync } from "@/hooks/useMealCloudSync";
import { FOOD_DATA_SOURCE_URL, MEAL_NOT_FOUND_MESSAGE } from "@/lib/foodDatabase";
import { addMealLog, readMealLogs } from "@/lib/mealHistoryService";
import { evaluateNewAchievements, recordMealDetailView } from "@/lib/positiveLearning";
import {
  FOOTPRINT_SCALE_MAX,
  MIN_SERVINGS,
  calculateTotalCarbonFootprint,
  formatCarbonFootprint,
  getFootprintBand,
  getFootprintProgress,
  normaliseServings,
} from "@/lib/mealFootprint";
import { ArrowLeft, ArrowUpRight, Leaf, Minus, Plus, ReceiptText, Sprout } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

function BackToHome({ navigate }: { navigate: (to: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to meals
    </button>
  );
}

function MealNotFound({ navigate }: { navigate: (to: string) => void }) {
  return (
    <main className="min-h-screen bg-[#f8f4e8] px-4 py-5 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <section className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-lg flex-col justify-center">
        <BackToHome navigate={navigate} />
        <div className="mt-6 rounded-[2rem] border border-[#dce8d1] bg-[#fffdf5] p-7 shadow-[0_14px_30px_rgba(36,79,54,0.1)]">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e5f0d9] text-[#276540] shadow-[0_5px_0_#bdd2a9]">
            <Sprout className="size-7" aria-hidden="true" />
          </div>
          <h1 className="font-display mt-6 text-4xl leading-none tracking-[-0.055em] text-[#173f2e]">Meal not found</h1>
          <p className="mt-3 max-w-sm text-[1rem] leading-7 text-[#5d7465]">
            {MEAL_NOT_FOUND_MESSAGE}
          </p>
        </div>
      </section>
    </main>
  );
}

function MealLoading() {
  return (
    <main className="min-h-screen bg-[#f8f4e8] px-4 py-5 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <section className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-lg flex-col justify-center">
        <div className="rounded-[2rem] border border-[#dce8d1] bg-[#fffdf5] p-7 shadow-[0_14px_30px_rgba(36,79,54,0.1)]" role="status">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[#dcebd4]" />
          <p className="font-display mt-5 text-3xl tracking-[-0.05em] text-[#173f2e]">Loading research meal</p>
          <p className="mt-3 text-[1rem] leading-7 text-[#5d7465]">Please wait while PlateFootprint checks the meal research record.</p>
        </div>
      </section>
    </main>
  );
}

export default function MealDetail() {
  const [, params] = useRoute("/meal/:id");
  const [, navigate] = useLocation();
  const [servings, setServings] = useState(MIN_SERVINGS);
  const { syncLog } = useMealCloudSync();
  const { foods, publishedMealsLoading } = useCloudFoods();
  const food = foods.find((item) => item.id === params?.id);

  useEffect(() => { if (food) recordMealDetailView(food.id); }, [food?.id]);

  if (!food && publishedMealsLoading) return <MealLoading />;
  if (!food) return <MealNotFound navigate={navigate} />;

  const total = calculateTotalCarbonFootprint(food.carbonScore, servings);
  const band = getFootprintBand(food.carbonScore);
  const progress = getFootprintProgress(food.carbonScore);
  const servingText = servings === 1 ? "serving" : "servings";
  const sourceUrl = food.sourceUrl ?? FOOD_DATA_SOURCE_URL;
  const sourceNote = food.estimateMethod === "Published meal research"
    ? "This value is from Singapore focused research and may vary according to portion size, ingredients, sourcing, recipe, and cooking method."
    : food.estimateMethod === "Regional research dataset"
      ? "This value is from a Pan Asian dish research dataset. It combines ingredient and cooking emissions and may vary from a Singapore recipe, portion, sourcing, and cooking method."
      : "This is an ingredient based prototype estimate. It uses Singapore focused food examples and may vary according to portion size, ingredients, sourcing, recipe, and cooking method.";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f4e8] pb-28 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <BackToHome navigate={navigate} />
          <a href="/" aria-label="PlateFootprint home" className="flex items-center gap-2 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]">
            <img src="/manus-storage/platefootprint-logo_8cf36295.png" alt="" className="size-9 rounded-xl bg-[#e5f0d9] object-contain" />
            <span className="font-display hidden text-xl tracking-[-0.05em] text-[#174132] sm:inline">Plate<span className="text-[#c6653f]">Footprint</span></span>
          </a>
        </header>

        <section className="pt-8" aria-labelledby="meal-title">
          <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]">
            <span className="h-px w-7 bg-[#80ad76]" />
            Meal footprint
          </p>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#1d563a] shadow-[0_16px_35px_rgba(23,65,47,0.16)]">
            {food.image ? <img src={food.image} alt={food.name} className="h-52 w-full object-cover opacity-75 sm:h-64" /> : <div aria-hidden="true" className="h-52 w-full opacity-80 sm:h-64" style={{ background: food.cardGradient }} />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#113a2bf2] via-[#113a2b9a] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <span className="market-stamp border-white/30 bg-[#143c2d]/55 text-white">{food.category}</span>
              <h1 id="meal-title" className="font-display mt-3 text-5xl leading-[0.9] tracking-[-0.065em] text-white sm:text-6xl">{food.name}</h1>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6" aria-labelledby="score-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5a865c]">Estimated footprint</p>
              <h2 id="score-title" className="font-display mt-1 text-4xl tracking-[-0.055em] text-[#173f2e]">
                {formatCarbonFootprint(food.carbonScore)}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#557161]">per serving</p>
              <p className="mt-3 inline-flex rounded-full bg-[#edf4e7] px-3 py-1 text-xs font-extrabold text-[#4b7055]">{food.estimateMethod}</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-[#f4f0e4] px-3 py-2 text-xs font-extrabold text-[#476854]">
              <span className={`size-2.5 rounded-full ${band.dotClass}`} aria-hidden="true" />
              {band.label}
            </span>
          </div>

          <div className="mt-6" aria-label={`${band.label}. ${formatCarbonFootprint(food.carbonScore)} per serving on a scale from zero to ten kg CO2e.`}>
            <div className="h-4 overflow-hidden rounded-full bg-[#e3ebda] p-1" role="progressbar" aria-valuemin={0} aria-valuemax={FOOTPRINT_SCALE_MAX} aria-valuenow={food.carbonScore}>
              <div className={`h-full rounded-full ${band.colorClass}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs font-bold text-[#6d7b70]">
              <span>0 kg CO2e</span>
              <span>10 kg CO2e per serving</span>
            </div>
          </div>
          <p className="mt-5 rounded-2xl bg-[#e9f2e2] px-4 py-3 text-sm leading-6 text-[#426553]">
            This is an estimate based on the selected meal and serving size.
          </p>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6" aria-labelledby="serving-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5a865c]">Your portion</p>
              <h2 id="serving-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173f2e]">Choose servings</h2>
            </div>
            <Leaf className="size-8 text-[#81a776]" aria-hidden="true" />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f4f0e4] p-3">
            <button
              type="button"
              aria-label="Decrease servings"
              onClick={() => setServings((current) => normaliseServings(current - 1))}
              disabled={servings <= MIN_SERVINGS}
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#1e593d] shadow-sm transition hover:bg-[#eaf2df] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"
            >
              <Minus className="size-5" aria-hidden="true" />
            </button>
            <output aria-live="polite" aria-label="Serving count" className="min-w-24 text-center">
              <span className="font-display block text-4xl leading-none tracking-[-0.05em] text-[#174b31]">{servings}</span>
              <span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#637b6a]">{servingText}</span>
            </output>
            <button
              type="button"
              aria-label="Increase servings"
              onClick={() => setServings((current) => current + 1)}
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#216442] text-white shadow-[0_4px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 active:scale-95 active:shadow-[0_2px_0_#143e2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"
            >
              <Plus className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-[#1d563a] px-5 py-4 text-[#fffdf5]">
            <p className="text-sm font-bold text-[#d5e8c8]">Total carbon footprint</p>
            <p data-testid="total-carbon-footprint" className="font-display mt-1 text-4xl leading-none tracking-[-0.05em]">{formatCarbonFootprint(total)}</p>
            <p className="mt-2 text-xs font-bold text-[#e7f0dc]">for {servings} {servingText}</p>
          </div>
          <Button
            onClick={() => {
              const newLog = addMealLog({
                mealId: food.id,
                mealName: food.name,
                carbonFootprintPerServing: food.carbonScore,
                servings,
                category: food.category,
              });
              syncLog(newLog);
              const newBadges = evaluateNewAchievements(readMealLogs());
              toast.success(newBadges.length ? "Meal added. You unlocked a new learning badge." : "Meal added to Daily History");
            }}
            className="mt-4 h-13 w-full rounded-2xl bg-[#d57448] text-base font-extrabold text-white shadow-[0_4px_0_#a94f31] transition hover:bg-[#bd5b3b] active:translate-y-0.5 active:shadow-[0_2px_0_#a94f31]"
          >
            Log This Meal
          </Button>
        </section>

        <SustainableSwapSection food={food} />

        <section className="mt-6 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6" aria-labelledby="factors-title">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5a865c]">How this is estimated</p>
          <h2 id="factors-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173f2e]">Main factors included in this estimate</h2>
          <ul className="mt-5 space-y-3">
            {food.factors.map((factor) => (
              <li key={factor} className="flex items-center gap-3 rounded-2xl bg-[#f6f3e8] px-4 py-3 text-sm font-bold text-[#456352]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dcebd4] text-[#28613e]">
                  <Leaf className="size-4" aria-hidden="true" />
                </span>
                {factor}
              </li>
            ))}
          </ul>
        </section>

        <section className="receipt-note relative mt-6 px-5 py-5 text-left text-sm leading-6 text-[#526c5a]" aria-labelledby="source-title">
          <span className="market-stamp mb-3 inline-flex items-center gap-1 bg-[#fffaf0] text-[#386146]"><ReceiptText className="size-3" aria-hidden="true" /> Research note</span>
          <h2 id="source-title" className="font-display text-2xl tracking-[-0.04em] text-[#214635]">Why the value can change</h2>
          <p className="mt-2">
            {sourceNote}
          </p>
          {food.sourceLabel && <p className="mt-3 rounded-xl bg-[#f4f0e4] px-3 py-2 text-xs font-bold text-[#496454]"><span className="font-extrabold">Source: </span>{food.sourceLabel}</p>}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-1 font-extrabold text-[#347349] underline decoration-[#94b989] underline-offset-4 hover:text-[#174a31] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]"
          >
            View data source <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </section>

        <Button onClick={() => navigate("/")} className="mt-7 h-12 w-full rounded-2xl bg-[#216442] text-base font-extrabold text-white shadow-[0_4px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 active:shadow-[0_2px_0_#143e2a]">
          Back to all meals
        </Button>
      </div>
      <BottomNavigation />
    </main>
  );
}
