# Figma Audit: Selected Card Pop-Out And Print Moment

Last updated: 2026-06-08

## Requested Node

- Figma file: `SFDW 2026`
- File key: `6mgzLDLMGz0kLU908YXSiZ`
- Requested node ID: `386:8779`
- User-described purpose: after one person is chosen, a selected-card version pops out with animation; this visual moment aligns with receipt printing.

## Current Audit Status

Direct Figma inspection is now available.

Successful reads on 2026-06-05:

- Tool: Figma `whoami`
- Result: authenticated as `Cecilia`
- Tool: Figma metadata read
- Target: `386:8779`
- Result: returned section metadata
- Tool: Figma screenshot read
- Target: `386:8779`
- Result: returned 2048px-high screenshot
- Tool: Figma Plugin API read-only audit
- Target: `386:8779`, `339:20840`, `339:19433`, and all `Yes-*` component sets
- Result: returned component variants, selected instance details, and prototype reaction objects

The previous `401 token_expired` blocker is resolved for this session.

## Direct Figma Audit: Node `386:8779`

Page:

- `Vending Machine (For Dev)`

Section:

- Node: `386:8779`
- Name: `Step 03-Show Card (2x size)`
- Type: `SECTION`
- Position: `x=8669`, `y=500`
- Size: `1776 x 3410`

Primary screen frame inside the section:

- Node: `339:20532`
- Name: `Step 04-Show Card (2x size)`
- Position: `x=162`, `y=195`
- Size: `1440 x 1024`

Machine frame inside the screen:

- Node: `339:20533`
- Name: `Horizontal Roll-OPS`
- Position: `x=349`, `y=271`
- Size: `742 x 481`

Selected card instance on the screen:

- Node: `339:20840`
- Name: `People Card (When Selected)`
- Position: `x=595`, `y=387`
- Size: `250 x 250`
- Variant property: `Property 1=Yes-Gadi`
- Nested instance: `Yes-Gadi`
- Nested `Yes-Gadi` instance size: `250 x 250`
- Nested profile instance: `Profile-Gadi`
- Nested profile size: `126 x 126`

This confirms the live app's current selected-card destination of `250 x 250` at roughly `x=595`, `y=387` matches the Figma selected card frame.

## People Card (When Selected)

Component set:

- Node: `339:19433`
- Name: `People Card (When Selected)`
- Type: `COMPONENT_SET`
- Position: `x=162`, `y=1405`
- Size: `745 x 445`
- Variants: 15

Each variant is a `125 x 125` component. In the screen frame, the selected-card instance is scaled to `250 x 250`, so the selected-card visual is effectively displayed at 2x scale.

Variant layout:

| Variant | Node | Component position | Nested `Yes-*` main component |
| --- | --- | --- | --- |
| `Yes-Gadi` | `339:19426` | `x=20`, `y=20`, `125 x 125` | `339:18652` |
| `Yes-Michele` | `339:19419` | `x=165`, `y=20`, `125 x 125` | `339:18828` |
| `Yes-Jeff` | `339:19418` | `x=310`, `y=20`, `125 x 125` | `339:18858` |
| `Yes-Yoshi` | `339:19421` | `x=455`, `y=20`, `125 x 125` | `339:18884` |
| `Yes-Kyu` | `339:19432` | `x=600`, `y=20`, `125 x 125` | `339:18913` |
| `Yes-Jan` | `339:19427` | `x=27`, `y=157`, `125 x 125` | `339:18965` |
| `Yes-Henry` | `339:19429` | `x=172`, `y=157`, `125 x 125` | `339:18992` |
| `Yes-Dennis` | `339:19422` | `x=317`, `y=157`, `125 x 125` | `339:19017` |
| `Yes-Cecilia` | `339:19420` | `x=462`, `y=157`, `125 x 125` | `339:19042` |
| `Yes-Kimberly` | `339:19425` | `x=607`, `y=157`, `125 x 125` | `339:19069` |
| `Yes-Stan` | `339:19430` | `x=27`, `y=294`, `125 x 125` | `339:19129` |
| `Yes-Yuri` | `339:19428` | `x=172`, `y=294`, `125 x 125` | `339:19154` |
| `Yes-Felipe` | `339:19431` | `x=317`, `y=294`, `125 x 125` | `339:19179` |
| `Yes-Aidan` | `339:19424` | `x=462`, `y=294`, `125 x 125` | `339:19206` |
| `Yes-Mystery` | `339:19423` | `x=607`, `y=294`, `125 x 125` | `339:19246` |

## Yes-name Components

There are 15 `Yes-*` component sets:

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

Each `Yes-*` set has:

- Component set size: `165 x 320`
- Two variants:
  - `Property 1=1` at `x=20`, `y=20`, `125 x 125`
  - `Property 1=Variant2` at `x=20`, `y=175`, `125 x 125`
- Direct child frame inside each variant:
  - Name: `Card Shake(v2)`
  - Position: `x=7.5`, `y=7.5`
  - Size: `110 x 110`

## Prototype Reactions

Representative raw reaction from `Yes-Gadi`, `Property 1=1`:

```json
{
  "trigger": { "type": "AFTER_TIMEOUT", "timeout": 0.25 },
  "action": {
    "type": "NODE",
    "destinationId": "339:18660",
    "navigation": "CHANGE_TO",
    "transition": null,
    "resetVideoPosition": false
  }
}
```

Representative raw reaction from `Yes-Gadi`, `Property 1=Variant2`:

```json
{
  "trigger": { "type": "AFTER_TIMEOUT", "timeout": 0.25 },
  "action": {
    "type": "NODE",
    "destinationId": "339:18652",
    "navigation": "CHANGE_TO",
    "transition": null,
    "resetVideoPosition": false
  }
}
```

The nested `Yes-Gadi` instance inside the selected-card screen instance has the same reaction:

- `AFTER_TIMEOUT`
- Timeout: `0.25s`
- `CHANGE_TO`
- Destination: `Property 1=Variant2`
- Transition: `null`

Working interpretation:

- The selected-card internal animation is a two-state loop.
- It alternates between `Property 1=1` and `Property 1=Variant2`.
- Each state holds for `0.25s`.
- A full shake cycle is about `0.5s`.
- There is no explicit Smart Animate/easing object for this internal `Yes-*` toggle; the visual movement is baked into the two component variants.

## Confirmed From Previous Local Audit

The earlier `03 Screen Content` audit identified these relevant interaction steps:

| Step | Node ID | Frame name | Role |
| --- | --- | --- | --- |
| 03 | `339:20217` | `Step 03-Chosen` | Horizontal reel with highlighted chosen card |
| 04 | `339:20532` | `Step 04-Show Card (2x size)` | Reel plus selected-card reveal at `250 x 250` |
| 05 | `339:20850` | `Step 05-Print Receipt` | Visually similar to Step 04; likely backend print phase |

Component inventory from the same audit:

- `People Card (When Selected)` component set: `339:19433`
- Variant count: 15
- Visual size in Step 04 and Step 05: `250 x 250`
- One selected-card variant exists for each person/mystery slot.
- Each selected-card variant generally nests a matching `Yes-[Name]` component, a `Profile-[Name]` component, and text for name plus department/label.
- There are 15 `Yes-*` component sets, each with two variants: `Property 1=1` and `Property 1=Variant2`.

## People / Variants

The selected-card reveal should support the same 15 IDs already used by the rolling cards:

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

## Working Interpretation

The live app should treat this section as two connected states:

1. `chosen`
   - Horizontal selector has landed on the selected person.
   - The selected result becomes canonical.
   - The app dispatches `sfdw:selection-completed`.

2. `selectedRevealAndPrinting`
   - A larger selected-card treatment pops out over the reel.
   - The selected-card asset/DOM should be chosen by the same `personId` used by the landed selector.
   - Receipt printing should be triggered once at the start of this state or immediately after the pop-out begins.
   - The display and receipt must use the same selected result payload.

## Implementation Implications

- The existing horizontal selector should continue to decide `currentSelection`.
- After horizontal selection completes, add a delayed/animated reveal stage instead of immediately ending in `chosen`.
- The selected-card reveal should be data-driven by `personId`, not hardcoded to the prototype's visible Gadi example.
- The selected-card visual should probably use separate assets from `People Card (When Selected)`, not the current `People Card (When Rolling)` card PNGs.
- If selected-card Figma exports are not available yet, the first live pass can scale and enhance the existing card image as a temporary stand-in.
- Receipt printing should be represented in Phase A as a mock event/log, then wired to the real printer adapter later.

## Current Live App Pass

Implemented and updated through 2026-06-08:

- The selected reveal is driven by the same `currentSelection.personId` and `columnIndex` produced by horizontal selection.
- The selected card animates from the actual chosen rolling-card position to a centered `250 x 250` card.
- The selected-card visual now uses exact Figma `People Card (When Selected)` / `Yes-*` exports, not the temporary rolling-card fallback.
- The active selected-card asset path is `assets/selected-cards/{personId}-state-{1|2}.png`.
- There are 30 selected-card PNGs total: 15 people/slots with 2 states each.
- Those PNG files are `500 x 500`, so displaying them at `250 x 250` preserves 2x pixel density.
- The app toggles the two selected-card states every `250ms`, matching the audited `AFTER_TIMEOUT 0.25s` Figma logic.
- The app emits `sfdw:selection-completed` when the horizontal selector lands.
- The app emits `sfdw:printer-print-requested` when the pop-out reveal begins.
- The app emits `sfdw:printer-print-completed` after the current mock print duration.

## Proposed Live App Phase Mapping

Current implemented phases:

- `idle`
- `verticalRolling`
- `rowStopped`
- `horizontalSelecting`
- `chosen`

Next recommended phases:

- `selectedReveal`
- `printing`
- `complete`

Suggested transition:

```text
horizontalSelecting
  -> chosen
  -> selectedReveal
  -> printing
  -> complete/reset
```

For the physical installation, duplicate triggers should remain ignored from `verticalRolling` through `printing`.

## Receipt Timing Recommendation

Based on the user's latest description, print should start when the selected card pops out.

Recommended Phase A behavior:

- Enter `selectedReveal`.
- Begin selected-card pop-out animation.
- Emit a mock `printer.print.requested` event with the canonical selection payload.
- Keep the selected card visible while the mock print is `printing`.
- Later replace the mock event with the hardware printer adapter.

## Still Needed After Figma Auth Refresh

Completed on 2026-06-05:

- Exact section/frame identification.
- Exact selected-card position and size.
- `People Card (When Selected)` variant list.
- `Yes-*` component structure.
- Internal selected-card shake timing.
- Export strategy for selected-card assets.

## Exported Assets

Exported on 2026-06-05:

- Output folder: `webapp/assets/selected-cards/`
- Count: 30 PNG files
- Size: `500 x 500`
- Density: displayed at `250 x 250`, so the assets are 2x for the live app
- Export source: temporary Figma instances created from each `Yes-*` component variant using `rescale(4)`
- Temporary Figma export staging frame was removed after download

File naming:

```text
{person-id}-state-1.png
{person-id}-state-2.png
```

The live web app now uses these files for the selected-card reveal and toggles state 1/state 2 every `250ms`.
