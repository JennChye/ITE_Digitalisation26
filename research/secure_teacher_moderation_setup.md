# Secure teacher moderation setup

## Teacher role access

The moderation dashboard uses server checked roles. Only accounts with the `teacher` or `admin` role can read moderation cases, resolve a report, or view audit history. A normal user cannot access these procedures even if they change the browser page.

An administrator must approve a staff account first. In the Users database, set the approved account role to `teacher`. The teacher must then sign out and sign in again before opening Teacher review. The project owner account remains an `admin` and can also moderate.

## Required moderation reason

Teachers select one reason before making a decision. The choices are private information, unkind or harmful content, not related to community learning, safety concern, and other teacher reason. Removal also needs a confirmation step.

## Audit history testing

1. Sign in as a Teacher or Administrator.
2. Ask a signed in student account to report a community post.
3. Open Teacher review and select a reason.
4. Restore, hide, or remove the report.
5. Check the audit history shows the teacher name, action, reason, and time.
6. Check that hidden and removed posts no longer appear in the shared community feed. Restored posts can appear again.
7. Sign in as a standard student and confirm the Teacher access only page appears without case or audit data.

## Completed checks

The teacher role migration, moderation case storage, and audit log storage were applied. The server access tests block visitors and standard students. The full automated suite passed 91 tests and the production build passed.
