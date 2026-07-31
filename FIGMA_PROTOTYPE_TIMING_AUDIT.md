# Figma Prototype Timing Audit

Last updated: 2026-06-05

Figma file:

https://www.figma.com/design/6mgzLDLMGz0kLU908YXSiZ/SFDW-2026?node-id=339-2003&t=lebGwMrcgHdF9F2M-11

## What Is Readable

Figma's Plugin API exposes prototype `reactions` on nodes. This includes:

- Trigger type.
- `AFTER_TIMEOUT` timeout values.
- Destination node IDs.
- Navigation type such as `CHANGE_TO`.
- Transition type such as `SMART_ANIMATE`.
- Easing such as `QUICK` or `EASE_OUT`.
- Transition duration in seconds.

## Step 01: Vertical Roll

Audited frame:

- `Step 01-Vertical Roll`
- Node ID: `339:19434`

The frame itself has no direct prototype reactions. Its child `Vertical Roll` instance does.

Observed reaction:

- Node: `Vertical Roll` instance inside Step 01
- Trigger: `AFTER_TIMEOUT`
- Timeout: `0.05000000074505806s`, effectively `50ms`
- Action: `NODE`
- Navigation: `CHANGE_TO`
- Destination: the next `Vertical Roll` component variant
- Transition: `SMART_ANIMATE`
- Easing: `QUICK`
- Duration: `0.06202129274606705s`, effectively `62ms`

## Vertical Roll Component Set

Component set:

- `Vertical Roll`
- Node ID: `339:3014`

It has three variants. The variants loop in sequence:

1. `339:3015` -> `358:2644`
2. `358:2644` -> `358:2800`
3. `358:2800` -> `339:3015`

Each transition uses the same timing:

- `AFTER_TIMEOUT`: about `50ms`
- `SMART_ANIMATE`: about `62ms`
- Easing: `QUICK`

Implementation interpretation:

- One visual step starts after a 50ms delay.
- The movement lasts about 62ms.
- A full three-variant loop is about `(50ms + 62ms) * 3 = 336ms`.

## Step 02: Horizontal Roll

The `Horizontal Roll-(Row 1 for example)` component follows the same timing pattern:

- `AFTER_TIMEOUT`: about `50ms`
- `SMART_ANIMATE`: about `62ms`
- Easing: `QUICK`

It loops through five variants, corresponding to the five card positions in the
stopped center row.

Live web app interpretation:

- One trigger starts the vertical reel.
- The live app first chooses one random target from all 15 card slots.
- The vertical reel runs for about `1333ms`, then snaps the currently visible center row.
- The app pauses on that stopped row for `500ms`.
- The horizontal selector starts automatically after the pause.
- The selector begins at the first card position.
- Each horizontal move uses the same `50ms` delay plus `62.021ms` transform duration.
- Card x positions in the live layout are `0`, `135`, `270`, `405`, and `540`.
- The vertical row and horizontal column are both derived from the same random target, giving every card slot equal chance.
- The current live pass performs at least two full five-card sweeps, then lands on the target card.
- On completion, the selected card remains highlighted and the app dispatches `sfdw:selection-completed`.

## Nested Card Hover Reactions

Many nested `Card-Shaking-2` instances have hover reactions:

- Trigger: `MOUSE_ENTER`
- Delay: `0ms`
- Transition: `SMART_ANIMATE`
- Easing: `EASE_OUT`
- Duration: about `50ms`

These are probably source-component hover/shake interactions, not the main vending-machine reel timing. The first web app pass does not depend on them.

## Current Webapp Timing Constants

The current live screen uses:

- `afterDelayMs: 50`
- `transitionMs: 62.02129274606705`
- A three-row vertical reel loop with local DOM/CSS transforms.
- A five-position horizontal selector loop for the stopped center row.

This mirrors the Step 01 and Step 02 prototype timing while keeping the implementation data-driven.
