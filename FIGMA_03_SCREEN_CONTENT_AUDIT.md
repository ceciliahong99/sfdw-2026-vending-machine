# Figma Audit: 03 Screen Content

Last updated: 2026-06-05

Figma file:

https://www.figma.com/design/6mgzLDLMGz0kLU908YXSiZ/SFDW-2026?node-id=339-2003&t=lebGwMrcgHdF9F2M-11

## Audited Node

- Section name: `03 Screen Content`
- Node ID: `339:2003`
- Size: `13003 x 5744`
- Top-level children: 26
- Main purpose: interaction sequence plus component inventory for the vending-machine display animation.

## Interaction Step Frames

The step frames are arranged left-to-right by `x` position. The layer order is not the interaction order, so implementation should use frame names and spatial order.

| Step | Node ID | Frame name | Size | Main contents |
| --- | --- | --- | --- | --- |
| 00 | `339:21018` | `Step 00-Switch Triggered` | `1440 x 1024` | `Vertical Roll` instance, full-frame overlay rectangle, `Nudge eye` trigger/indicator group |
| 01 | `339:19434` | `Step 01-Vertical Roll` | `1440 x 1024` | `Vertical Roll` instance |
| 02 | `339:19904` | `Step 02-Horizontal Roll` | `1440 x 1024` | `Horizontal Roll-(Row 1 for example)` instance |
| 03 | `339:20217` | `Step 03-Chosen` | `1440 x 1024` | Local `Horizontal Roll-OPS` frame with 15 rolling cards and a highlighted selected card position |
| 04 | `339:20532` | `Step 04-Show Card (2x size)` | `1440 x 1024` | Local `Horizontal Roll-OPS` frame plus `People Card (When Selected)` instance scaled to `250 x 250` |
| 05 | `339:20850` | `Step 05-Print Receipt` | `1440 x 1024` | Same display composition as Step 04, used as the print-receipt moment |

Implementation note: Step 04 and Step 05 look structurally very similar in the hierarchy. Treat Step 04 as the visual reveal and Step 05 as the backend print phase unless the prototype animation later shows a visual difference.

## Component Sets Below The Steps

There are 20 component sets inside the section.

### Core Motion/Display Components

| Component set | Node ID | Variants | Notes |
| --- | --- | --- | --- |
| `Card-Shaking-2` | `339:12921` | 1 | Base 125 x 125 shaking-card component. Nested cards also reference similarly named component sets outside this section. |
| `People Card (When Rolling)` | `339:14841` | 15 | One 125 x 125 rolling card variant per person/mystery slot. |
| `Vertical Roll` | `339:3014` | 3 | 742 x 481 reel component used by Steps 00 and 01. Variant names are not very descriptive; two variants have very long duplicated people-name strings. |
| `Horizontal Roll-(Row 1 for example)` | `339:16569` | 5 | 742 x 481 reel component used by Step 02. Variant names are mostly repeated as `1`, so implementation should not rely on these names alone. |
| `People Card (When Selected)` | `339:19433` | 15 | One selected-card variant per person/mystery slot. Used at 250 x 250 in Steps 04 and 05. |

### Per-Person Selected Components

There are 15 `Yes-*` component sets. Each has two variants: `Property 1=1` and `Property 1=Variant2`.

- `Yes-Gadi`
- `Yes-Michele`
- `Yes-Jeff`
- `Yes-Yoshi`
- `Yes-Kyu`
- `Yes-Jan`
- `Yes-Henry`
- `Yes-Dennis`
- `Yes-Cecilia`
- `Yes-Kimberly`
- `Yes-Stan`
- `Yes-Yuri`
- `Yes-Felipe`
- `Yes-Aidan`
- `Yes-Mystery`

Likely interpretation: each `Yes-*` component represents the selected-card treatment for that person, while the two variants represent two selected states or visual moments. This needs confirmation before coding the selected-card animation.

## Individuals / Variants

The audit found 15 total variants across:

- `People Card (When Rolling)`
- `People Card (When Selected)`
- `Yes-*` component sets

The same 15 are represented in all three places:

- Gadi
- Michele
- Jeff
- Yoshi
- Kyu
- Jan
- Henry
- Dennis
- Cecilia
- Kimberly
- Stan
- Yuri
- Felipe
- Aidan
- Mystery

The visible rolling grid appears to use three rows of five:

- Row `xd`: Jan, Henry, Dennis, Cecilia, Kimberly
- Row `ops`: Gadi, Michele, Jeff, Yoshi, Kyu
- Row `pd`: Stan, Yuri, Felipe, Aidan, Mystery

Step 03 highlights the first card in the `ops` row, which is Gadi in the current prototype state.

## Selected Card Structure

Each `People Card (When Selected)` variant generally nests:

- A matching `Yes-[Name]` component.
- A matching `Profile-[Name]` component.
- Text for the person name and sometimes a department/label.

Observed examples:

- `Yes-Gadi` nests `Yes-Gadi / 1` and `Profile-Gadi / Frame 2`.
- `Yes-Kyu` includes text `Kyu`, `ID`, `Kyu`.
- `Yes-Felipe` includes text `Felipe`, `PD`, `Felipe`.
- `Yes-Cecilia` includes text `Cecilia`, `XD`, `Cecilia`.
- `Yes-Kimberly` includes text `Kimberly`, `SD`, `Kimberly`.
- `Yes-Mystery` has no profile instance and uses `?` text.

## File Health / Implementation Risks

- Accessing `componentProperties` and `variantProperties` through the Figma Plugin API throws `Component set for node has existing errors` for at least one component set. Structural reads still work.
- Because of that, implementation should rely on stable component set names, component IDs, frame names, and exported assets rather than assuming all Figma component-property metadata is healthy.
- Several variant names are too generic for code mapping, especially in `Horizontal Roll-(Row 1 for example)`, where multiple variants resolve to `1`.
- The current prototype selected person appears hardcoded to Gadi in Steps 03-05.
- Step 04 and Step 05 appear structurally duplicated; the app may need to create the print phase as a state change rather than a distinct visual screen.

## Naming/Content Items To Verify

- `People Card (When Rolling)` variant `aidan` has visible text `Aidan`, but its nested instance is named `gayatri`. This may be harmless layer naming, but should be confirmed before asset export.
- `People Card (When Rolling)` variant `mystery` has visible text `?`, but its nested instance is named `gadi`. This may be placeholder content, but should be confirmed.
- `People Card (When Selected)` variant `Yes-Aidan` includes text `Daren`, `PD`, and `Aidan`. Confirm whether `Daren` is intentional, a role/name alias, or old copy.
- Confirm whether `Mystery` counts as one of the 15 individuals, or whether it is a special wildcard card.
- Confirm what `Yes-*` variants `1` and `Variant2` mean visually.
- Confirm whether `XD`, `OPS`, `PD`, `ID`, and `SD` are department labels to include in app data and receipt data.

## Suggested Web App Mapping

Use a canonical data model keyed by the lowercase variant IDs:

- `gadi`
- `michele`
- `jeff`
- `yoshi`
- `kyu`
- `jan`
- `henry`
- `dennis`
- `cecilia`
- `kimberly`
- `stan`
- `yuri`
- `felipe`
- `aidan`
- `mystery`

Suggested phase mapping:

- `idle`: before Step 00.
- `triggered`: Step 00.
- `verticalRoll`: Step 01.
- `horizontalRoll`: Step 02.
- `chosen`: Step 03.
- `showSelectedCard`: Step 04.
- `printing`: Step 05.
- `reset`: return to idle.

For implementation, the current section should be treated as a visual prototype and motion reference. The live app should build the same steps with data-driven variants rather than hardcoding Gadi.

## Next Audit Targets

Before implementation, inspect:

- The profile component sets referenced by `Profile-[Name]`, because many live outside this audited section.
- Any other pages/sections that contain receipt layout or final copy.
- The Figma prototype wiring/timings, if available, to extract exact animation durations and easing.
- Exportable raster assets for the 15 profile/card visuals.
