# Private meal location recording

## What changed

Students can now add an optional place when they log a manual meal or save a photo estimate. The field suggests broad places such as ITE canteen, home, or hawker centre. It asks students not to enter a full address.

The saved place appears only in the owner own Daily History. Students can edit or clear it together with a meal history edit. It is stored in browser history while signed out and is included in the user owned cloud meal log after sign in.

The `userMealLogs.locationText` database column is optional. The protected location update procedure checks the signed in owner ID before changing a saved place. Meal locations are not included in Student Community, the leaderboard, badge collection, or teacher moderation records.

## Manual testing steps

1. Open Log a Meal and select Enter Manually.
2. Select a supported meal and add a broad place such as ITE canteen.
3. Save the meal and open Daily History.
4. Confirm the place appears under that meal with the location icon.
5. Select edit, change the place to Home, and save.
6. Sign in and confirm the place remains after cloud history loads.
7. Open Student Community and confirm meal place information is not shown.

## Verification

The database migration `0003_aromatic_young_avengers.sql` was applied without removing existing meal data. The full test suite passed 112 tests and the production build passed. The Log a Meal and Daily History pages were checked at 390 pixel mobile width.
