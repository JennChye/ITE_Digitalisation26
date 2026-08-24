# Student Community prototype

## Files changed

`client/src/lib/communityService.ts` keeps only anonymous community posts and participation preferences in browser local storage. It has no connection to Daily History records.

`client/src/lib/communityService.test.ts` checks privacy mode, post creation, deletion, reporting, participation scoring, voluntary inclusion, and local storage fallback.

`client/src/pages/StudentCommunity.tsx` provides the mobile first Student Community page, post preview and confirmation, privacy choices, feed, positive reaction, and Learning Together leaderboard.

`client/src/pages/StudentCommunity.test.tsx` checks page access, preview before publishing, private mode, deletion, reporting, and leaderboard joining or leaving.

`client/src/App.tsx` adds the `/community` page route.

`client/src/components/BottomNavigation.tsx` adds a compact Community link for mobile navigation.

`todo.md` records the completed Student Community tasks.

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

## Testing completed

The automated suite passed 79 tests. The production build passed. The Student Community page was also checked at a 390 pixel mobile width.
