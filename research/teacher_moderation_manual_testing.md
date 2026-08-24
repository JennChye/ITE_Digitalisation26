# Teacher moderation and safety pages

## Files changed

`client/src/lib/communityService.ts` adds local prototype statuses for reported, restored, and hidden posts. It also adds restore, hide, and remove actions. Private meal history remains outside this data.

`client/src/pages/TeacherModeration.tsx` adds the teacher review queue. It displays reported anonymous posts only and provides restore, hide, and confirmed remove actions.

`client/src/pages/CommunitySafety.tsx` adds clear student rules for privacy, positive sharing, optional posting, reporting, and trusted adult support.

`client/src/App.tsx` adds routes for `/teacher-moderation` and `/community-safety`.

`client/src/pages/TeacherModeration.test.tsx` and `client/src/pages/CommunitySafety.test.tsx` test the new pages and core flows.

## Manual testing steps

### Report and review

1. Open Student Community and report a sample post.
2. Open Teacher review.
3. Check that the reported post appears in the review queue.

### Restore, hide, and remove

1. Select Restore to feed and check that the post moves from the open queue to Recent actions.
2. Report another sample post. Select Hide from feed and check that the post is not shown in the community feed.
3. Report another sample post. Select Remove post and check that confirmation is needed before removal.

### Safety rules

1. Open Safety rules from Student Community.
2. Check that the page explains personal privacy, positive messages, optional sharing, reporting, and trusted adult support.
3. Select Student Community to return to the community feed.

## Checks completed

The automated suite passed 85 tests. The production build passed. Both pages were checked at a 390 pixel mobile width.
