# Student Community prototype

## Files changed

`client/src/lib/communityService.ts` keeps only anonymous community posts and participation preferences in browser local storage. It has no connection to Daily History records.

`client/src/lib/communityService.test.ts` checks privacy mode, post creation, deletion, reporting, participation scoring, voluntary inclusion, and local storage fallback.

`client/src/pages/StudentCommunity.tsx` provides the mobile first Student Community page, post preview and confirmation, privacy choices, feed, positive reaction, and Learning Together leaderboard.

`client/src/pages/StudentCommunity.test.tsx` checks page access, preview before publishing, private mode, deletion, reporting, and leaderboard joining or leaving.

`client/src/App.tsx` adds the `/community` page route.

`client/src/components/BottomNavigation.tsx` adds a compact Community link for mobile navigation.

`todo.md` records the completed Student Community tasks.

`client/src/pages/TeacherModeration.tsx` provides a local prototype workspace for reviewing reported posts. A teacher can restore a post, hide it from the feed, or remove it after confirmation.

`client/src/pages/CommunitySafety.tsx` provides clear sharing rules, privacy guidance, reporting information, and trusted adult support guidance for students.

`client/src/pages/TeacherModeration.test.tsx` and `client/src/pages/CommunitySafety.test.tsx` check the new page access and moderation actions.

## Manual testing steps

### Create a post

1. Open Student Community from the bottom navigation.
2. Turn off **Keep all progress private**.
3. Enter an anonymous name, a meal count, a weekly estimate, and one positive message.
4. Select **Preview post**. Check that only these four items appear.
5. Select **Confirm and publish**. Check that the post appears in the feed.

### Delete a post

1. Publish a post using the steps above.
2. Select the delete button on your own post.
3. Check that the post disappears from the feed.

### Report a post

1. Select the report button on a sample post.
2. Check that the reported post disappears only from the current feed.
3. Refresh the page and check that the browser remembers this local report.

### Join or leave the leaderboard

1. Turn on **Join the participation leaderboard**.
2. Check that a personal position appears and that the anonymous name appears in the list.
3. Turn the setting off.
4. Check that the personal position is replaced by the voluntary joining message.

### Review a reported post

1. Open Student Community and select the report button on a sample post.
2. Open **Teacher review** from the Student Community guide card.
3. Check that the reported post appears in the review queue.
4. Select **Restore to feed** and check that the post moves to Recent actions.
5. Report another sample post. Select **Hide from feed** or **Remove post**. For removal, check that a confirmation step appears first.

### Read safety rules

1. Open Student Community and select **Safety rules**.
2. Check that the page explains personal privacy, positive sharing, optional posts, reporting, and trusted adult support.
3. Select **Student Community** to return to the shared feed.

## Testing completed

The automated suite passed 85 tests. The production build passed. The teacher moderation and safety pages were also checked at a 390 pixel mobile width.
