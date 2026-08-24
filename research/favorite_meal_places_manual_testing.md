# Favourite Meal Places Manual Testing

## Purpose

Favourite meal places help a student reuse a broad place name such as ITE canteen, home, or a hawker centre. The feature is optional. It is for quick private logging and does not judge any food choice.

## Privacy Boundary

| Item | Expected result |
| --- | --- |
| Favourite place list | Saved only in this browser device storage |
| Meal location | Can remain part of the student's own private meal history |
| Community, badges, reflection and teacher tools | Never show favourite place labels |
| Address guidance | The page asks students not to enter a full address |

## Student Checks

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | Open Log a Meal and choose manual entry or finish a photo review. | The optional private place field is visible. |
| 2 | Enter `ITE canteen` and select Save as favourite place. | A favourite place chip appears. |
| 3 | Clear the place field and select the `ITE canteen` chip. | The field fills with `ITE canteen`. |
| 4 | Save the meal. | The chosen place appears only in the student's Daily History. |
| 5 | In Daily History, select Save as favourite place next to a recorded place. | The place is added to the private favourite list. |
| 6 | Select the remove button beside a favourite place. | The favourite place disappears and does not change saved meal records. |

## Safety and Mobile Checks

Use short broad labels rather than addresses. Check that place chips wrap cleanly on a phone width and that the chip and remove controls are easy to tap. Confirm that a saved favourite does not appear in Student Community, the leaderboard, teacher moderation, badge collection, or monthly reflection.
