/**
 * Hawker Market Journal style: a calm ingredient builder with mobile friendly
 * gram controls, transparent prototype assumptions, and local history saving.
 */
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { useMealCloudSync } from "@/hooks/useMealCloudSync";
import { FOOD_DATA_SOURCE_URL } from "@/lib/foodDatabase";
import { addMealLog } from "@/lib/mealHistoryService";
import {
  COCONUT_DAIRY_COMPONENT,
  COOKING_METHODS,
  CUSTOM_BASES,
  CUSTOM_MEAL_NOTICE,
  CUSTOM_PROTEINS,
  GLOBAL_INGREDIENT_FACTOR_SOURCE_URL,
  INGREDIENT_AMOUNT_STEP_GRAMS,
  MAX_INGREDIENT_AMOUNT_GRAMS,
  MIN_INGREDIENT_AMOUNT_GRAMS,
  VEGETABLE_COMPONENT,
  CustomBaseId,
  CustomProteinId,
  CookingMethodId,
  createCustomMealSuggestion,
  createCustomMealId,
  estimateCustomMeal,
  validateCustomMealInput,
} from "@/lib/customMealEstimator";
import { MAX_ENTRY_SERVINGS, MIN_ENTRY_SERVINGS } from "@/lib/mealEntryUtils";
import { formatCarbonFootprint } from "@/lib/mealFootprint";
import { ArrowLeft, ArrowUpRight, ChefHat, Minus, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Choice = { id: string; label: string; carbonPer100g?: number; carbonPerServing?: number; source?: string };
const CONTRIBUTION_COLORS = ["bg-[#d6e8c8]", "bg-[#f5dfae]", "bg-[#d7b198]", "bg-[#9cc6b8]", "bg-[#c6b6df]"];

function ChoiceGroup({ label, options, value, onChange }: { label: string; options: Choice[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">{label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.id;
          const amountLabel = option.carbonPer100g !== undefined ? `${option.carbonPer100g.toFixed(2)} kg CO2e per 100 g` : `${option.carbonPerServing?.toFixed(2)} kg CO2e per serving`;
          return (
            <button key={option.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option.id)} className={`min-h-13 rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049] ${selected ? "border-[#6d9e69] bg-[#dcebd4] text-[#1c593b] shadow-[0_3px_0_#b5d2aa]" : "border-[#dbe6d3] bg-[#fffdf5] text-[#456653] hover:bg-[#eef5e9]"}`}>
              <span className="block text-sm font-extrabold leading-tight">{option.label}</span>
              <span className="mt-1 block text-xs font-bold opacity-80">{amountLabel}</span>
              {option.source && <span className="mt-1 block text-[0.68rem] font-bold leading-4 opacity-75">{option.source}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function AmountControl({ label, value, onChange }: { label: string; value: number; onChange: (nextValue: number) => void }) {
  const decrease = () => onChange(Math.max(MIN_INGREDIENT_AMOUNT_GRAMS, value - INGREDIENT_AMOUNT_STEP_GRAMS));
  const increase = () => onChange(Math.min(MAX_INGREDIENT_AMOUNT_GRAMS, value + INGREDIENT_AMOUNT_STEP_GRAMS));

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f4f0e4] p-3">
      <span className="text-sm font-extrabold text-[#385a46]">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Decrease ${label}`} onClick={decrease} disabled={value <= MIN_INGREDIENT_AMOUNT_GRAMS} className="flex size-11 items-center justify-center rounded-xl bg-white text-[#1e593d] shadow-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Minus className="size-4" aria-hidden="true" /></button>
        <output aria-label={`${label} amount`} className="w-16 text-center text-sm font-extrabold text-[#1d563a]">{value} g</output>
        <button type="button" aria-label={`Increase ${label}`} onClick={increase} disabled={value >= MAX_INGREDIENT_AMOUNT_GRAMS} className="flex size-11 items-center justify-center rounded-xl bg-[#216442] text-white shadow-[0_3px_0_#143e2a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Plus className="size-4" aria-hidden="true" /></button>
      </div>
    </div>
  );
}

export function parseFlexibleEstimateSearch(search: string) {
  const params = new URLSearchParams(search);
  const mealName = params.get("meal")?.trim();
  if (!mealName) return null;
  const visibleIngredients = (params.get("ingredients") ?? "").split("|").map((ingredient) => ingredient.trim()).filter(Boolean).slice(0, 8);
  return createCustomMealSuggestion(mealName, visibleIngredients);
}

function readSuggestedMeal() {
  if (typeof window === "undefined") return null;
  return parseFlexibleEstimateSearch(window.location.search);
}

export default function CustomMealEstimator() {
  const [, navigate] = useLocation();
  const { syncLog } = useMealCloudSync();
  const [initialSuggestion] = useState(readSuggestedMeal);
  const [mealName, setMealName] = useState(initialSuggestion?.mealName ?? "");
  const [proteinId, setProteinId] = useState<CustomProteinId>(initialSuggestion?.proteinId ?? "tofu");
  const [baseId, setBaseId] = useState<CustomBaseId>(initialSuggestion?.baseId ?? "rice");
  const [cookingMethodId, setCookingMethodId] = useState<CookingMethodId>(initialSuggestion?.cookingMethodId ?? "boiled");
  const [includesVegetables, setIncludesVegetables] = useState(initialSuggestion?.includesVegetables ?? true);
  const [includesCoconutOrDairy, setIncludesCoconutOrDairy] = useState(initialSuggestion?.includesCoconutOrDairy ?? false);
  const [proteinAmountGrams, setProteinAmountGrams] = useState(initialSuggestion?.proteinAmountGrams ?? 100);
  const [baseAmountGrams, setBaseAmountGrams] = useState(initialSuggestion?.baseAmountGrams ?? 150);
  const [vegetableAmountGrams, setVegetableAmountGrams] = useState(initialSuggestion?.vegetableAmountGrams ?? 100);
  const [coconutOrDairyAmountGrams, setCoconutOrDairyAmountGrams] = useState(initialSuggestion?.coconutOrDairyAmountGrams ?? 100);
  const [servings, setServings] = useState(initialSuggestion?.servings ?? 1);
  const [showErrors, setShowErrors] = useState(false);

  const input = { mealName, proteinId, baseId, cookingMethodId, includesVegetables, includesCoconutOrDairy, proteinAmountGrams, baseAmountGrams, vegetableAmountGrams, coconutOrDairyAmountGrams, servings };
  const validationMessage = validateCustomMealInput(input);
  const calculationInput = { ...input, mealName: mealName.trim() || "Custom meal" };
  const calculationValidationMessage = validateCustomMealInput(calculationInput);
  const estimate = useMemo(() => calculationValidationMessage ? null : estimateCustomMeal(calculationInput), [calculationValidationMessage, mealName, proteinId, baseId, cookingMethodId, includesVegetables, includesCoconutOrDairy, proteinAmountGrams, baseAmountGrams, vegetableAmountGrams, coconutOrDairyAmountGrams, servings]);

  function updateServings(nextValue: number) {
    setServings(Math.min(MAX_ENTRY_SERVINGS, Math.max(MIN_ENTRY_SERVINGS, nextValue)));
  }

  function saveCustomMeal() {
    setShowErrors(true);
    if (!estimate) return;

    const newLog = addMealLog({
      mealId: createCustomMealId(mealName),
      mealName: mealName.trim(),
      carbonFootprintPerServing: estimate.carbonPerServing,
      servings,
      category: estimate.category,
      entryMethod: "custom",
    });
    syncLog(newLog);
    toast.success("Custom meal added to Daily History");
    navigate("/history");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f4e8] pb-28 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-10 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate("/log")} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ArrowLeft className="size-4" aria-hidden="true" />Back to Log a Meal</button>
          <img src="/manus-storage/platefootprint-logo_8cf36295.png" alt="PlateFootprint" className="size-10 rounded-xl bg-[#e5f0d9] object-contain" />
        </header>

        <section className="pt-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />Custom meal estimate</p>
          <h1 className="font-display max-w-[12ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c]">Build your meal.</h1>
          <p className="mt-5 max-w-md text-[1rem] leading-7 text-[#567061]">Choose the main ingredients, their amount, and cooking style. This helps you estimate meals that are not in the dish list.</p>
        </section>

        {initialSuggestion && <p role="status" className="mt-5 rounded-2xl border border-[#c9dfc1] bg-[#edf5e8] px-4 py-3 text-sm font-bold leading-6 text-[#315f42]">{initialSuggestion.note}</p>}

        <section className="mt-7 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)] sm:p-6">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Meal name</span>
            <input value={mealName} onChange={(event) => setMealName(event.target.value)} placeholder="Example: My tofu noodle bowl" className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" />
          </label>
          {showErrors && validationMessage && <p role="alert" className="mt-2 text-sm font-bold text-[#aa412e]">{validationMessage}</p>}

          <div className="mt-6 space-y-7">
            <div><ChoiceGroup label="Main protein" options={CUSTOM_PROTEINS} value={proteinId} onChange={(id) => setProteinId(id as CustomProteinId)} /><AmountControl label="Protein amount" value={proteinAmountGrams} onChange={setProteinAmountGrams} /></div>
            <div><ChoiceGroup label="Rice or noodle base" options={CUSTOM_BASES} value={baseId} onChange={(id) => setBaseId(id as CustomBaseId)} />{baseId !== "none" && <AmountControl label="Rice or noodle amount" value={baseAmountGrams} onChange={setBaseAmountGrams} />}</div>
            <ChoiceGroup label="Cooking method" options={COOKING_METHODS} value={cookingMethodId} onChange={(id) => setCookingMethodId(id as CookingMethodId)} />
          </div>

          <fieldset className="mt-7">
            <legend className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Extra components</legend>
            <div className="mt-3 space-y-3">
              <div><label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-[#f4f0e4] px-4 py-3 text-sm font-extrabold text-[#385a46]"><span><span className="block">Vegetables</span><span className="mt-1 block text-xs text-[#647a6a]">{VEGETABLE_COMPONENT.carbonPer100g.toFixed(2)} kg CO2e per 100 g</span></span><input type="checkbox" checked={includesVegetables} onChange={(event) => setIncludesVegetables(event.target.checked)} className="size-5 accent-[#216442]" aria-label="Include vegetables" /></label>{includesVegetables && <AmountControl label="Vegetable amount" value={vegetableAmountGrams} onChange={setVegetableAmountGrams} />}</div>
              <div><label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-[#f4f0e4] px-4 py-3 text-sm font-extrabold text-[#385a46]"><span><span className="block">{COCONUT_DAIRY_COMPONENT.label}</span><span className="mt-1 block text-xs text-[#647a6a]">{COCONUT_DAIRY_COMPONENT.carbonPer100g.toFixed(2)} kg CO2e per 100 g</span></span><input type="checkbox" checked={includesCoconutOrDairy} onChange={(event) => setIncludesCoconutOrDairy(event.target.checked)} className="size-5 accent-[#216442]" aria-label="Include coconut or dairy" /></label>{includesCoconutOrDairy && <AmountControl label="Coconut or dairy amount" value={coconutOrDairyAmountGrams} onChange={setCoconutOrDairyAmountGrams} />}</div>
            </div>
          </fieldset>

          <section className="mt-7" aria-labelledby="custom-serving-title">
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Your portion</p>
            <h2 id="custom-serving-title" className="font-display mt-1 text-3xl tracking-[-0.05em] text-[#173f2e]">Choose servings</h2>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#f4f0e4] p-3">
              <button type="button" aria-label="Decrease servings" onClick={() => updateServings(servings - 1)} disabled={servings <= MIN_ENTRY_SERVINGS} className="flex size-12 items-center justify-center rounded-xl bg-white text-[#1e593d] shadow-sm disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Minus className="size-5" aria-hidden="true" /></button>
              <output aria-live="polite" className="text-center"><span className="font-display block text-4xl leading-none tracking-[-0.05em] text-[#174b31]">{servings}</span><span className="mt-1 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#637b6a]">{servings === 1 ? "serving" : "servings"}</span></output>
              <button type="button" aria-label="Increase servings" onClick={() => updateServings(servings + 1)} disabled={servings >= MAX_ENTRY_SERVINGS} className="flex size-12 items-center justify-center rounded-xl bg-[#216442] text-white shadow-[0_4px_0_#143e2a] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Plus className="size-5" aria-hidden="true" /></button>
            </div>
          </section>
        </section>

        {estimate && (
          <section className="mt-6 rounded-[1.75rem] bg-[#1d563a] p-6 text-white shadow-[0_14px_30px_rgba(36,79,54,0.16)]" aria-live="polite">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#d5e8c8]">Your custom estimate</p><p className="font-display mt-2 text-5xl leading-none tracking-[-0.06em]">{formatCarbonFootprint(estimate.totalCarbonFootprint)}</p><p className="mt-2 text-sm font-bold text-[#ecf4e7]">for {servings} {servings === 1 ? "serving" : "servings"}</p></div><span className="flex size-12 items-center justify-center rounded-2xl bg-[#d6e8c8] text-[#1e593d]"><ChefHat className="size-6" aria-hidden="true" /></span></div>
            <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-6 text-[#edf5e7]">{CUSTOM_MEAL_NOTICE}</p>
            <p className="mt-4 text-sm font-bold text-[#d5e8c8]">{formatCarbonFootprint(estimate.carbonPerServing)} per serving</p>
            <section className="mt-6" aria-labelledby="contribution-title">
              <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#d5e8c8]">Ingredient breakdown</p><h2 id="contribution-title" className="font-display mt-1 text-2xl tracking-[-0.04em]">What makes up this estimate</h2></div><span className="text-xs font-bold text-[#d5e8c8]">Per serving</span></div>
              <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-white/15" role="img" aria-label={estimate.contributions.map((contribution) => `${contribution.label} ${contribution.percentage}%`).join(", ")}>
                {estimate.contributions.map((contribution, index) => <span key={contribution.label} className={`${CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length]} first:rounded-l-full last:rounded-r-full`} style={{ width: `${contribution.percentage}%` }} />)}
              </div>
              <ul className="mt-5 space-y-3">
                {estimate.contributions.map((contribution, index) => (
                  <li key={contribution.label} className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 font-extrabold text-[#f6fbf2]"><span className={`size-3 shrink-0 rounded-full ${CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length]}`} aria-hidden="true" />{contribution.label}</span><span className="shrink-0 font-extrabold text-[#d5e8c8]">{contribution.percentage}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label={`${contribution.label} contributes ${contribution.percentage}% or ${contribution.carbonPerServing.toFixed(2)} kg CO2e per serving`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={contribution.percentage}><div className={`h-full rounded-full ${CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length]}`} style={{ width: `${contribution.percentage}%` }} /></div>
                    <p className="mt-2 text-xs font-bold text-[#d5e8c8]">{contribution.carbonPerServing.toFixed(2)} kg CO2e per serving</p>
                  </li>
                ))}
              </ul>
            </section>
          </section>
        )}

        <section className="receipt-note mt-6 px-5 py-5 text-sm leading-6 text-[#526c5a]">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#3d704d]"><Sparkles className="size-4" aria-hidden="true" /> Why this is a prototype</p>
          <p className="mt-2">The estimator uses rounded ingredient factors and your selected amounts. It is a learning tool and not a full recipe assessment.</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1"><a href={FOOD_DATA_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-extrabold text-[#347349] underline decoration-[#94b989] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]">Singapore examples <ArrowUpRight className="size-4" aria-hidden="true" /></a><a href={GLOBAL_INGREDIENT_FACTOR_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-extrabold text-[#347349] underline decoration-[#94b989] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]">Global ingredient factors <ArrowUpRight className="size-4" aria-hidden="true" /></a></div>
        </section>

        <Button onClick={saveCustomMeal} className="mt-6 h-13 w-full rounded-2xl bg-[#d57448] text-base font-extrabold text-white shadow-[0_4px_0_#a94f31] transition hover:bg-[#bd5b3b] active:translate-y-0.5 active:shadow-[0_2px_0_#a94f31]">Save custom meal</Button>
      </div>
      <BottomNavigation />
    </main>
  );
}
