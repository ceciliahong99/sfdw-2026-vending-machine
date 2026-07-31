# Phase A Plan: Figma Prototype To Full-Screen Web App

## Goal

Turn the Figma prototype into a live 1920 x 1080 kiosk web app that can be triggered deterministically, plays the selection animation, lands on one selected person/fun fact, and emits a stable receipt payload for later printer integration.

Phase A should avoid hardware dependencies. Use a debug button, keyboard shortcut, and optionally a local trigger endpoint so the animation and data contract are solid before receipt and physical button work begins.

## Recommended Stack

- Vite + React + TypeScript for a fast local full-screen app.
- CSS Modules or plain scoped CSS for layout fidelity; avoid adding a UI kit unless the Figma file already uses one.
- Motion for React or GSAP for controlled animation timelines. Prefer one library and keep timing constants centralized.
- React reducer state machine for app flow; consider XState only if the orchestration becomes more complex in Phase B/C.
- Vitest for data/state tests and Playwright for 1920 x 1080 visual and trigger-flow checks.
- Optional tiny Node/Express local service only if Phase A needs `POST /trigger`; otherwise mock triggers can stay in the app.

## Proposed File Structure

```text
webapp/
  package.json
  index.html
  vite.config.ts
  src/
    main.tsx
    App.tsx
    data/
      people.ts
    types/
      vending.ts
    state/
      vendingMachine.ts
    animation/
      selectionTimeline.ts
    components/
      FullscreenStage.tsx
      IdleScreen.tsx
      CardCarousel.tsx
      SelectedResult.tsx
      DebugControls.tsx
    styles/
      tokens.css
      global.css
      stage.module.css
    tests/
      vendingMachine.test.ts
      selectionPayload.test.ts
  public/
    assets/
      people/
```

Keep Figma-exported raster/SVG assets in `public/assets/people/` unless they are imported as React components. Store app data in code during Phase A so selected results are typed and easy to validate.

## Data Model

```ts
type PersonCard = {
  id: string;
  displayName: string;
  roleOrLabel?: string;
  imageSrc?: string;
  accentColor?: string;
  facts: FunFact[];
};

type FunFact = {
  id: string;
  text: string;
  receiptTitle?: string;
};

type SelectionResult = {
  selectionId: string;
  selectedAt: string;
  personId: string;
  personName: string;
  factId: string;
  factText: string;
};

type ReceiptPayload = {
  jobId: string;
  source: "sfdw-webapp";
  result: SelectionResult;
};
```

Selection should happen once per trigger, before the final reveal animation completes. The same `SelectionResult` must drive both the screen reveal and the future receipt print so the display and printed receipt never disagree.

## Interaction Contract

The web app should treat the animation as a deterministic run, not as a loose visual effect. A trigger creates a run, the run creates exactly one selection, and every visual state reads from that same run object.

Core rules:

- Accept triggers only while the app is in `idle`.
- Generate the selected person/fact immediately after accepting the trigger, before the spin animation starts.
- Keep the chosen `SelectionResult` immutable for the rest of the run.
- Ignore repeated keyboard, button, or debug triggers while the app is `selecting`, `selected`, `printing`, `complete`, or `resetting`.
- Do not choose the winner inside animation callbacks; callbacks should only advance visual phases.
- Cancel all timers on reset or unmount so a stale timer cannot advance a future run.
- Log rejected triggers in debug mode, but never show busy/debug language on the public event display.

Recommended runtime modes:

```ts
type RuntimeMode = "event" | "admin" | "debug";
```

- `event`: full-screen public mode; no debug controls.
- `admin`: full-screen mode with a small hidden/revealable control overlay.
- `debug`: visible controls, state readout, payload log, and accelerated timing options.

## Reducer State And Actions

Keep the reducer small and explicit. Animation libraries can handle transforms and easing, but app state should be owned by React.

```ts
type AppPhase =
  | "idle"
  | "selecting"
  | "selected"
  | "printing"
  | "complete"
  | "error"
  | "resetting";

type PrintStatus = "not_started" | "simulating" | "printed" | "failed";

type RunContext = {
  triggerId: string;
  animationSeed: string;
  startedAt: string;
  selectedResult: SelectionResult;
  receiptPayload: ReceiptPayload;
  printStatus: PrintStatus;
};

type VendingState = {
  phase: AppPhase;
  mode: RuntimeMode;
  run?: RunContext;
  lastCompletedRun?: RunContext;
  error?: {
    code: "missing_data" | "animation_timeout" | "print_simulation_failed";
    message: string;
  };
};
```

Suggested reducer actions:

- `TRIGGER_ACCEPTED`: creates `RunContext`, sets `phase` to `selecting`.
- `TRIGGER_REJECTED`: no state change in event mode; increments/debug-logs in debug mode.
- `ANIMATION_SETTLED`: sets `phase` to `selected`.
- `REVEAL_HOLD_COMPLETE`: sets `phase` to `printing`.
- `PRINT_SIMULATION_STARTED`: keeps `phase` as `printing`, sets `printStatus`.
- `PRINT_SIMULATION_SUCCEEDED`: sets `phase` to `complete`, sets `printStatus`.
- `PRINT_SIMULATION_FAILED`: sets `phase` to `error`, stores error.
- `RESET_STARTED`: sets `phase` to `resetting`.
- `RESET_COMPLETED`: clears `run`, clears `error`, sets `phase` to `idle`.

Guard conditions:

- `TRIGGER_ACCEPTED` is valid only from `idle`.
- `ANIMATION_SETTLED` is valid only from `selecting`.
- `REVEAL_HOLD_COMPLETE` is valid only from `selected`.
- `PRINT_SIMULATION_*` actions are valid only from `printing`.
- `RESET_COMPLETED` is valid only from `resetting`.

## Component Properties

Use explicit props so the eventual Figma translation has clear component boundaries. Avoid components reading global app state directly unless they are the top-level coordinator.

```ts
type TimingConfig = {
  spinDurationMs: number;
  revealDurationMs: number;
  selectedHoldMs: number;
  printSimulationMs: number;
  resetDelayMs: number;
  triggerLockoutMs: number;
};

type StageProps = {
  phase: AppPhase;
  mode: RuntimeMode;
  children: React.ReactNode;
};

type IdleScreenProps = {
  isReady: boolean;
  mode: RuntimeMode;
  onTrigger: (source: "debug_button" | "keyboard") => void;
};

type CardCarouselProps = {
  cards: PersonCard[];
  selectedResult?: SelectionResult;
  animationSeed?: string;
  phase: AppPhase;
  timing: TimingConfig;
  onSettled: () => void;
};

type SelectedResultProps = {
  result: SelectionResult;
  phase: AppPhase;
  printStatus: PrintStatus;
  showFact: boolean;
};

type DebugControlsProps = {
  state: VendingState;
  canTrigger: boolean;
  onTrigger: () => void;
  onReset: () => void;
};
```

Component responsibilities:

- `App`: owns reducer, timers, keyboard listener, data validation, and receipt payload logging.
- `FullscreenStage`: owns 16:9 scaling and public display bounds.
- `IdleScreen`: renders only the idle composition and optional trigger affordance.
- `CardCarousel`: owns only visual card movement; it receives the selected result instead of choosing it.
- `SelectedResult`: renders the final selected person/fact and print/complete visual states.
- `DebugControls`: visible only in `admin` or `debug` mode.

## Figma Properties To Capture

When the Figma link is available, capture these properties before coding the final visuals:

- Stage: frame size, background fill, safe margins, alignment grid, and any fixed logos or labels.
- Idle state: default card positions, idle animation if any, button prompt copy, and exact reset frame.
- Card component: width, height, border radius, image crop, name text style, role/fact text style, shadows, strokes, and selected/active variants.
- Carousel path: number of visible cards, direction, spacing, scale changes, rotation if any, blur/opacity rules, and offscreen entry/exit behavior.
- Reveal state: selected card final position, fact reveal position, final typography, decorative assets, and hold duration.
- Responsive behavior: confirm whether the design is fixed 1920 x 1080 only or should letterbox/scale on other displays.
- Assets: export format, asset naming, transparent backgrounds, and whether portraits are individual files or baked into cards.

Represent these as a local visual config where practical:

```ts
type CardVisualSpec = {
  width: number;
  height: number;
  borderRadius: number;
  imageAspectRatio: number;
  idleScale: number;
  activeScale: number;
  selectedScale: number;
};
```

The first build can use placeholder values, but final tuning should replace them with values measured from Figma.

## Animation And App States

Primary state machine:

- `idle`: full-screen waiting state; accepts one trigger.
- `selecting`: animation is running; triggers are ignored or queued as no-ops.
- `selected`: final person/fact is revealed; receipt payload is available.
- `printing`: placeholder state in Phase A; simulate success after a short delay.
- `complete`: short confirmation/pause before returning to idle.
- `error`: debug-only fallback for failed data, asset, or future printer issues.
- `resetting`: timers and visual state clear before returning to the exact idle frame.

Animation sequence:

1. Idle composition matches the Figma starting frame.
2. Trigger locks input and generates `SelectionResult`.
3. Cards accelerate through a shuffled/seeded order.
4. Cards decelerate toward the selected card.
5. Selected card snaps/settles into final Figma reveal layout.
6. Fun fact appears with the timing specified by the prototype.
7. Receipt payload is emitted/logged and the app enters `printing`.
8. Reset returns to the exact idle frame after a configurable delay.

Timing constants to define early:

- `spinDurationMs`
- `revealDurationMs`
- `selectedHoldMs`
- `printSimulationMs`
- `resetDelayMs`
- `triggerLockoutMs`

Suggested visual animation phases inside `CardCarousel`:

- `warmup`: first 150-250 ms after trigger; selected result exists but is not visible yet.
- `accelerating`: card movement speeds up from idle.
- `spinning`: repeated card loop at peak speed.
- `decelerating`: movement slows and the selected card is introduced into the visible sequence.
- `settling`: selected card moves into final reveal position.
- `factReveal`: fun fact appears after the card settles.

Use the animation seed to derive the same intermediate card order for test runs. The final selected result should remain the source of truth even if the visual order changes during tuning.

## Selection Algorithm

Phase A can start with uniform random selection, but it should be wrapped in a function that can later support no-repeat or weighted behavior.

```ts
type SelectionOptions = {
  seed: string;
  previousPersonIds?: string[];
  allowImmediateRepeat: boolean;
};

function createSelectionResult(
  people: PersonCard[],
  options: SelectionOptions
): SelectionResult;
```

Rules:

- Validate that at least one person and one fact exist before accepting triggers.
- Prefer no immediate repeat if there is more than one person available.
- Choose one fact from the selected person's `facts`.
- Generate stable IDs for `selectionId` and `jobId` so test logs can trace one run across screen and receipt.
- In tests, use a fixed seed so the same trigger chooses the same result.

## Keyboard And Debug Trigger Behavior

- Space and Enter should request a trigger while in `idle`.
- Holding a key should not create repeated runs; ignore `KeyboardEvent.repeat`.
- The debug trigger button should disable while not idle.
- `Escape` may reset only in `admin` or `debug` mode.
- Debug payload output should show the latest `ReceiptPayload` after selection.
- Event mode should hide all controls and rely on future service/button triggers.

## Receipt Payload Logging

Phase A does not print, but it should emit the exact shape Phase B expects. For now, log the payload in `debug` mode and expose it through tests.

```ts
type ReceiptLogEntry = {
  createdAt: string;
  payload: ReceiptPayload;
};
```

Log moment:

- Build `ReceiptPayload` when the trigger is accepted.
- Display can reveal the result later, but the receipt payload is already fixed.
- Simulated print begins only after the reveal hold completes.

## Figma Handoff Checklist

- Node-specific Figma link for the full-screen frame and prototype flow.
- Exact 1920 x 1080 frame name plus any alternate states.
- Export list for people cards, portraits, backgrounds, logos, icons, and receipt-related art.
- Typography names, sizes, weights, line heights, and fallbacks if fonts are unavailable.
- Color tokens, gradients, shadows, borders, and any blend modes used.
- Prototype timing: easing, duration, delay, loop count, and final reveal behavior.
- Card order rules: random, weighted, predetermined, or no repeats.
- Final people/fun fact copy, approved for public display and printing.
- Whether the selected screen shows the person, the fact, or both.
- Idle/reset behavior and whether the app should hide debug controls for event mode.

## First Implementation Tasks

1. Scaffold `webapp/` with Vite, React, TypeScript, and Playwright.
2. Add global full-screen stage styles locked to a 16:9 layout and test at 1920 x 1080.
3. Create typed placeholder `people.ts` data with at least 6 cards and 1-2 facts each.
4. Implement the reducer state machine and lockout behavior.
5. Add debug triggers: on-screen button and keyboard shortcut.
6. Build the idle, selecting, selected, simulated printing, and reset screens.
7. Implement the selection timeline with centralized timing constants.
8. Emit/log a `ReceiptPayload` after selection and add unit tests for payload consistency.
9. Replace placeholder visuals with Figma exports and tune spacing/timing against the prototype.
10. Run Playwright at 1920 x 1080 to verify no clipping, overlap, blank states, or repeat-trigger bugs.

## Detailed Build Order For Interaction Logic

1. Define TypeScript data types, timing constants, and placeholder people/fact data.
2. Implement `createSelectionResult` with seeded test support.
3. Implement `buildReceiptPayload(result)` and verify screen/receipt consistency.
4. Implement reducer state, actions, and guard conditions.
5. Add keyboard and debug-button trigger intake.
6. Add timer coordination for selected hold, print simulation, complete delay, and reset.
7. Build `CardCarousel` with placeholder motion and `onSettled`.
8. Add a debug state panel and latest receipt payload panel for development.
9. Add unit tests for reducer guards, selection stability, no-repeat behavior, and payload shape.
10. Add Playwright checks for one trigger, duplicate trigger rejection, reset to idle, and 1920 x 1080 layout.

## Phase A Exit Criteria

- App runs locally without internet access after dependencies are installed.
- Full-screen display matches the Figma prototype closely at 1920 x 1080.
- One trigger produces one selected result and one receipt payload.
- Repeat triggers are ignored while the app is selecting, printing, or resetting.
- Result payload is deterministic enough for printer integration tests.
- Debug controls can be hidden for event/kiosk mode.
