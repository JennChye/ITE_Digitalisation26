# Positive learning and sustainable swaps

## Files created or changed

`client/src/lib/positiveLearning.ts` stores private browser only badge progress, preference settings, recommendation views, and swap activity records.

`client/src/components/PositiveLearningDashboard.tsx` adds the Dashboard achievement cards, personal progress summary, feature controls, and private food preference settings.

`client/src/components/SustainableSwapSection.tsx` adds transparent sustainable swap cards to meal details. Each card shows the original meal, alternative, limitation, and no made up carbon saving.

`client/src/pages/Home.tsx` displays the private dashboard section.

`client/src/pages/MealDetail.tsx` records meal detail views, logs badge progress, and displays optional swaps.

`client/src/pages/LogMeal.tsx` keeps the optional manual note with a meal log so a food waste note can unlock Waste Wise.

`client/src/lib/mealHistoryService.ts` stores the optional note and sends a browser only update event.

## Manual testing steps

### Unlock a badge

1. Open a meal detail page and select Log This Meal.
2. Return to Home.
3. Check that First Plate becomes unlocked and the private count changes.

### View a swap recommendation

1. Open Chicken Rice, Laksa, Chicken Biryani, or Roti Prata.
2. Scroll to Sustainable Food Swaps.
3. Select View this option. Check that no carbon saving is claimed.

### Change preferences

1. Open Food preferences for swaps on Home.
2. Turn on Vegetarian swap options only, add an allergy such as tofu, or enter a cultural preference such as halal.
3. Return to Chicken Rice and check that unsuitable recommendations are not shown.

### Record a tried swap

1. Select View this option on a swap card.
2. Leave I logged this option in Daily History unchecked unless it was actually logged.
3. Select I tried this option. Check that the card confirms a private activity record.

### Turn features off

1. Turn off Learning badges on Home. Check that Achievements hides while meal logging still works.
2. Turn off Sustainable swaps. Open a meal detail page and check that the swap cards are hidden while the footprint remains visible.

## Mobile visual check

The Home page and Chicken Rice detail page were checked at 390 pixel mobile width. Achievement cards, controls, progress labels, swap explanation, and touch buttons remain readable without horizontal scrolling. The full automated suite passed 106 tests and the production build passed.
