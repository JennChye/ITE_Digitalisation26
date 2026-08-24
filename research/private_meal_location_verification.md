# Private meal place verification

## Owner only data

The meal place is optional. It is stored only on a user own meal record. The protected cloud location update checks both meal log ID and signed in user ID. A user cannot update another user meal record through this procedure.

## Record and edit flow

1. Students can enter a broad place when saving a manual meal or photo estimate.
2. The field has a 120 character limit and asks students not to add a full address.
3. Daily History shows the saved place only under the owner meal card.
4. The owner can edit or clear the place in Daily History.
5. Local to cloud history mapping preserves the optional place after sign in.

## Privacy boundary

Places are not copied into Student Community, participation leaderboard, badge collection, sustainable swap activity, or teacher moderation records.

## Checks completed

The optional `locationText` database column was applied. Local storage, cloud input mapping, protected update ownership, manual logging, and history update tests passed. The Log a Meal and Daily History pages were checked at 390 pixel mobile width. The full suite passed 112 tests and the production build passed.
