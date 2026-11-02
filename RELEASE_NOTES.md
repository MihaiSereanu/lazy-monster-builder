# Lazy Monster Builder 1.1.0

Adds optional condition and damage choices to the generator and aligns its CR
statistics with the supplied Forge of Foes resource.

- Adds 12 native D&D 5e attack condition effects and six labelled custom reminders.
- Connects Knockdown to Prone, and Restraining Grab to Grappled and Restrained.
- Adds damage-type selection and hit points within the CR table's low/high range.
- Corrects CR 1/8, 1/2, 4, 7, 16, and 17 statistics and fills missing monster examples.
- Preserves native condition immunity and supports reapplication after removal.

The one-line summary and copy button are omitted as requested.

Validated 492 profile/feature combinations, 410 damage configurations, all 12
native conditions with immunity/removal checks, all six nonmechanical reminders,
and native chat-card application. Chosen HP, damage type, and attack conditions
were tested through the dialog and browser reload. Thirteen Node test cases pass.

Custom condition timers/levels/consequences remain manual. Existing NPCs retain
their saved data; recreate them or edit their activities to use these changes.
See README.md for native condition removal behavior and ATTRIBUTION.md for
source notices.
