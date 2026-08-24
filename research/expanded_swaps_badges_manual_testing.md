# Expanded local swaps and badge collection

## Files changed

`client/src/lib/positiveLearning.ts` now provides transparent local Singapore swap ideas for all twelve supported local meals. Each idea keeps its ingredient list, vegetarian tag, cautious cultural filter, and uncertainty note.

`client/src/pages/BadgeCollection.tsx` creates a private badge collection page. It separates earned badges from badges that are still available to explore.

`client/src/components/PositiveLearningDashboard.tsx` includes a View my badge collection action.

`client/src/pages/Home.tsx` opens the private collection from the Dashboard, and `client/src/App.tsx` registers the `/badges` route.

## Manual testing steps

### Browse a local swap

1. Open a local meal such as Nasi Lemak, Char Kway Teow, Hokkien Mee, Mee Soto, or Beef Rendang Rice.
2. Scroll to Sustainable Food Swaps.
3. Check that the original meal, the alternative, explanation, ingredients, and uncertainty note are clear.
4. Check that the card does not state a made up carbon saving.

### Open the badge collection

1. Open Home and scroll to Achievements.
2. Select View my badge collection.
3. Check that Earned badges and Continue exploring are visible.
4. Check that the page states that the collection is private and not shared with Student Community.

### Feature settings

1. Turn off Learning badges on Home and open `/badges`.
2. Check that Badges are paused appears with a route back to dashboard controls.
3. Turn badges back on and check that the collection returns.

## Mobile visual check

The private Badge Collection and Nasi Lemak meal detail pages were checked at 390 pixel mobile width. The badge grid, original meal label, swap card, controls, and long text remain readable without horizontal scrolling.

## Automated checks

The full automated suite passed 110 tests. The production build passed.

## Dedicated badge page refinement

Achievement cards and progress counts are no longer displayed on Home. Home now has only a private badge collection entry beside the learning controls. All earned and locked badge details remain on the dedicated `/badges` page.

The Home and Badge Collection pages were checked at 390 pixel mobile width after this refinement. The Dashboard keeps a compact collection entry, while all badge cards remain on the dedicated page.
