# PlateFootprint Product Requirements Document

**Author:** Manus AI  
**Product:** PlateFootprint  
**Audience:** ITE Higher Nitec students, teachers, and project stakeholders  
**Status:** Current product baseline with future gamification clearly separated  
**Date:** September 2026

## 1. Product Summary

PlateFootprint is a mobile first food carbon learning application for Singapore students. It helps users explore food emissions, estimate the impact of meals, record private meal history, compare sustainable alternatives, and learn why estimates can differ.

The product uses supportive language. It does not label meals as good or bad, and it does not rank students by personal carbon results. It explains that food impact values are estimates affected by portion size, ingredients, sourcing, recipe, and cooking method.

## 2. Problem Statement

Many students want to understand the environmental effect of daily meals but may not know where to find simple and Singapore relevant information. Food impact data can also be incomplete or different across research sources. PlateFootprint turns this information into an easy learning experience without creating pressure or blame.

## 3. Product Goals

The current product must let a student explore supported meals, calculate servings, enter a meal manually, use a temporary food photo for a prototype review flow, estimate a custom meal from ingredients, view private history, and learn about lower impact alternatives.

The product must make assumptions visible. It must protect personal information. It must keep private learning activity separate from public community content and teacher moderation.

## 4. Target Users

| User | Current need | Access boundary |
| --- | --- | --- |
| Student | Explore meals, estimate impact, record meals, and review personal progress | Own private records and optional anonymous community participation |
| Teacher or administrator | Review reported community content and moderation actions | Protected moderation tools only when the account has the required role |
| Visitor | Understand the food impact concept and view supported meal information | Public meal catalogue and learning content |

## 5. Current Product Scope

| Area | Current capability | Status |
| --- | --- | --- |
| Home | Friendly dashboard with three session selected meals, navigation, and private learning controls | Current |
| Meal catalogue | Singapore and regional meal records with carbon values, categories, images, source labels, and uncertainty notes | Current |
| Meal detail | Serving controls, total calculation, progress colour, estimate label, factors, and source information | Current |
| Meal logging | Manual entry, supported dish search, temporary photo review, unclear photo fallback, custom meal estimation, amount controls, and method selection | Current |
| Custom estimation | Ingredient contribution breakdown with transparent factors and cautious estimate wording | Current |
| Private history | Date filtering, editing, deletion, day clearing, optional broad meal place, local storage, and protected cloud history | Current |
| Favourite places | Browser local private shortcuts that can be saved, reused, and removed | Current |
| Personal learning | Sustainable swaps, dietary preferences, private badges, badge collection, and optional monthly reflection | Current |
| Student Community | Anonymous local community prototype with privacy controls, deletion, reactions, reports, and safety guidance | Current |
| Teacher moderation | Protected report queue, moderation reasons, restore, hide, remove, and audit history | Current |
| Growing Plate Garden | Pet companion growth based on personal progress | Future only |

## 6. Main User Journeys

A student can begin on Home, choose a meal card, adjust servings, read the estimate, and return to Home. A student can also open Log a Meal, search for a known dish, review a temporary photo estimate, or build a custom estimate from ingredients. The student can save the result to private history with an optional broad place such as ITE canteen or hawker centre.

From Daily History, the student can filter records by date, edit or clear a meal place, delete records, and save a recorded place as a browser local favourite. Favourites can later be selected during manual or photo logging. Exact home addresses are discouraged.

The student can open Badge Collection, Sustainable Swaps, or Monthly Reflection. These are private learning areas. Community participation is a separate choice and must not expose meal history, exact places, favourite places, badges, or reflection notes.

## 7. Technical Architecture

### 7.1 Architecture Overview

PlateFootprint uses a React 19 client with Tailwind CSS for the mobile first interface. Wouter provides page routing. Shared interface components use the existing component library. React Query manages server request state, while tRPC provides typed calls between the client and server.

The server uses Express with tRPC procedures. Authentication uses the existing Manus OAuth session flow. Protected procedures receive the signed in user from the server context. Drizzle ORM connects server procedures to the MySQL or TiDB database. The database stores only data that needs protected multi device access. Browser local storage remains the main store for private features that are intentionally not cloud synced.

### 7.2 Architecture Layers

| Layer | Responsibility | Main examples |
| --- | --- | --- |
| Presentation | Mobile screens, accessible controls, feedback, and navigation | Home, Meal Detail, Log Meal, Daily History, Community, Badges, Reflection |
| Client domain logic | Calculation, validation, local persistence, and view state | Food database, custom estimator, meal history service, favourite place service, positive learning service |
| API contract | Typed client to server communication | tRPC queries and mutations under the API route |
| Server application | Authentication context, ownership checks, moderation rules, and business procedures | Meal history, meal recognition, published meals, moderation, authentication |
| Persistence | Protected cloud records and browser local records | MySQL or TiDB, browser local storage, temporary photo state |
| External services | Authentication, AI assisted recognition, and storage helpers when required | Manus OAuth, built in AI services, protected storage helpers |

### 7.3 Data Ownership Model

| Data type | Primary location | Sync rule | Visibility |
| --- | --- | --- | --- |
| Food catalogue | Application data and published meal records | Shared catalogue data | Public learning content |
| Private meal history | Protected cloud database and local cache | User specific cloud sync when signed in | The owner only |
| Broad meal place | Private meal history record | Can sync through protected owned history | The owner only |
| Favourite meal places | Browser local storage under a separate key | Never sent to cloud | The browser owner only |
| Badges and swaps | Browser local storage | Never sent to community or teacher tools | The browser owner only |
| Monthly reflection | Browser local storage | Never sent to community or leaderboard tools | The browser owner only |
| Community content | Separate community storage and protected moderation records | Only approved anonymous community fields are shared | Community and authorised moderators according to rules |
| Photo data | Temporary client or protected temporary processing state | Not retained as a permanent meal photo record | The student during review only |
| Future Garden state | Planned browser local private data | No public sync by default | The browser owner only |

## 8. Data Flow

### 8.1 Meal Exploration Flow

The student selects a meal on Home. The client reads the meal record from the catalogue, calculates the selected serving total, and renders the progress bar, estimate label, factors, and source note. No personal data is required for this flow.

### 8.2 Manual Meal Logging Flow

The student searches or selects a supported meal, enters servings, adds optional ingredients or a broad place, and confirms the estimate. The client validates the form and calculates the result. The meal record is written to private local history and, when the student is signed in, can be sent through the protected meal history procedure. The server checks ownership before creating or updating a cloud record.

### 8.3 Photo Review Flow

The student captures or uploads a photo. The image is treated as temporary input for the prototype recognition flow. The client shows a scanning state, then displays a review with a known meal match or an unclear photo message. The student can retake the photo, switch to manual entry, or continue with a transparent custom estimate. The original photo is not presented as a permanent public record.

### 8.4 Custom Estimate Flow

The student enters ingredients, amounts, and cooking information. Client calculation logic combines the selected factors and produces a total with an ingredient contribution breakdown. If detailed information is unavailable, the interface identifies the result as an estimate and explains the uncertainty rather than inventing a precise value.

### 8.5 Private History and Sync Flow

A saved meal first updates the local private history for fast feedback. When cloud history is enabled and the student is authenticated, a typed tRPC request sends only the meal record fields needed for the owner account. The server maps the record to the authenticated user, checks ownership on updates, and returns the protected result. Favourites are not included in this request.

### 8.6 Favourite Place Flow

The student enters a broad place name and chooses Save as favourite. The client normalises the text, removes duplicates, applies the safe limit, and writes the result to a separate browser local storage key. When the student taps a favourite chip during logging, only the current meal form is filled. Removing a favourite updates the same local key. No tRPC procedure, database table, community post, badge record, reflection record, or teacher view receives the favourite.

### 8.7 Community and Moderation Flow

Community content follows a separate flow. A student chooses what to share and sees privacy guidance before posting. Reports are sent only through protected procedures when required. Teacher or administrator moderation actions require the correct role, a selected reason, and an audit record. Private meal history, favourite places, badges, swaps, and reflection notes do not flow into this system.

### 8.8 Future Garden Flow

The planned Growing Plate Garden will read only private progress values from the student device. A weekly or monthly comparison will use the student's own earlier estimated meal impact as the baseline. A lower personal estimate can add growth points, while learning actions can provide small supportive progress. The Garden must not use public ranking, teacher comparison, exact places, community posts, or photos.

## 9. Security and Privacy Requirements

The system must use protected server procedures for signed in records. Every private cloud read and update must be scoped to the authenticated user. Role checks must protect teacher moderation. The client must not treat local storage as cloud security, and the user must be able to clear local private data.

The system must use separate data models and storage keys for private learning, community content, favourite places, and future Garden state. User interfaces must explain what is private, what is shared, and what is temporary. Exact home addresses should not be encouraged. Photos should remain temporary unless a future requirement explicitly receives consent for storage.

## 10. Non Functional Requirements

The application must work well on a mobile screen first, use clear contrast, support keyboard navigation, provide screen reader labels, and use tap targets that are comfortable for students. It must show loading, empty, unclear, and error states in friendly language.

Estimates must remain transparent. Each supported record should identify its source or research label. The interface must not show false precision when ingredients, sourcing, portion size, or cooking method are uncertain.

The application should keep local interactions responsive and use typed API calls for server operations. Unit tests must cover calculation logic, validation, privacy boundaries, protected procedures, and important user journeys. Production builds must pass before release.

## 11. Success Measures

| Measure | Desired result |
| --- | --- |
| Meal understanding | Students can explain that a displayed value is an estimate and identify at least one factor affecting it. |
| Logging completion | Students can complete a supported, photo, or custom meal log without confusion. |
| Transparency | Every estimate has clear source or uncertainty information. |
| Privacy | Private records remain owner scoped, and community content does not expose personal history. |
| Accessibility | Main flows are usable on a mobile screen with keyboard and screen reader support. |
| Learning value | Students use comparisons and swaps to explore options without being judged by a score. |

## 12. Future Development: Gamification

Gamification is not part of the current release. Future options include the Growing Plate Garden, learning quests, food footprint quizzes, Meal Explorer stamps, and optional group progress.

The first Garden release should use at least six original companion stages, with the smallest Seed stage and the largest Blooming stage. The visual direction must be approved before implementation. Growth should be based on personal weekly and monthly comparisons, not a fixed judgement of the student's diet. The feature must include pause, reset, and delete controls.

Future gamification must remain optional and supportive. It must not publish personal meal values, exact places, badges, reflection notes, or private growth state. Any class activity should show group totals only and require clear student choice.

## 13. Risks and Mitigations

Food impact data may differ between sources. The product should show source labels, assumptions, and uncertainty. Portion sizes and recipes may be entered incorrectly. The product should allow editing and explain that results are estimates. Students may feel judged by carbon scores. The product should use learning language and avoid public ranking. Local storage may be cleared by the browser. The product should explain the difference between local private data and signed in cloud history.

AI photo recognition may be uncertain. The product should make review mandatory, show a clear fallback, and let the student switch to manual or custom entry. Community data may accidentally reveal personal information. The product should show privacy guidance, keep community storage separate, and require moderation controls.

## 14. References

[1]: https://ipur.nus.edu.sg/ "Institute for the Public Understanding of Risk, National University of Singapore"

[2]: https://github.com/JennChye/ITE_Digitalisation26 "PlateFootprint project repository"

## 15. Document Notes

This document describes the current product baseline and does not claim that the Growing Plate Garden or other gamification features have been implemented. Future requirements must be reviewed against the privacy boundaries before development begins.

The architecture section is based on the current PlateFootprint route structure, typed tRPC server design, protected user history procedures, browser local private services, and separate community moderation flow.

## Changelog

| Version | Change |
| --- | --- |
| 1.0 | Documented the current product scope and future gamification boundary. |
| 1.1 | Added technical architecture, ownership model, data flows, and future Garden privacy requirements. |
| 1.2 | Clarified that the Garden uses six or more size based companion stages, beginning with an approved Seed concept. |

Written by Manus AI.


References

[1] Institute for the Public Understanding of Risk, National University of Singapore. [https://ipur.nus.edu.sg/](https://ipur.nus.edu.sg/)

[2] PlateFootprint project repository. [https://github.com/JennChye/ITE_Digitalisation26](https://github.com/JennChye/ITE_Digitalisation26)
