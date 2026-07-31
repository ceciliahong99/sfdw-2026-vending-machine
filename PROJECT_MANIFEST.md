# Project Manifest

Last updated: 2026-06-08

This folder is the self-contained working folder for the SFDW Vending Machine project.

Project path:

`/Users/cecilia/Documents/Codex/2026-06-05/i-am-working-on-a-fun/SFDW VENDING MACHINE`

## Current Folder Status

The project-relevant files are inside `SFDW VENDING MACHINE`.

The app currently needs no package install to preview because it is a static HTML/CSS/JS prototype. It can be opened from disk, but serving the folder with a local static server is more reliable for cache behavior and browser testing.

Current local preview used in this workspace:

`http://127.0.0.1:4174/?v=selected-card-shake-alpha`

Port `4174` is only the current workspace preview port. A migrated copy can use any available static-server port.

## Core App

- `webapp/index.html`
- `webapp/styles.css`
- `webapp/app.js`
- `webapp/README.md`

Current cache/version tags:

- CSS: `20260605-selected-card-shake`
- JS: `20260605-selected-card-shake-alpha`
- Rolling assets: `20260605-hires-geometry-mask`
- Selected-card assets: `20260605-selected-card-shake-alpha`

## Asset Inventory

Rolling card assets:

- `webapp/assets/cards/`
- 15 files
- 500 x 500 PNG exports
- displayed at 125 x 125 in the reel
- transparent outside the card geometry

Portrait/reference assets:

- `webapp/assets/people/`
- 15 files

Selected-card reveal assets:

- `webapp/assets/selected-cards/`
- 30 files
- 15 people / slots
- 2 shake states per slot
- 500 x 500 PNG files
- displayed at 250 x 250 for 2x pixel density

Shared vector asset:

- `webapp/assets/union.svg`

Asset cleanup tool:

- `webapp/tools/clean-card-alpha.mjs`

## Documentation And Context

Primary context files:

- `PROJECT_SCOPE.md`
- `CHAT_HANDOFF.md`
- `PROJECT_MANIFEST.md`
- `MIGRATION_GUIDE.md`
- `MIGRATION_CONTEXT.md`
- `MIGRATION_ARTIFACTS.md`

Figma audit notes:

- `FIGMA_03_SCREEN_CONTENT_AUDIT.md`
- `FIGMA_PROTOTYPE_TIMING_AUDIT.md`
- `FIGMA_VERTICAL_ROLL_CHASSIS_AUDIT.md`
- `FIGMA_SELECTED_CARD_PRINT_AUDIT.md`

Agent planning notes:

- `agents/figma-to-webapp-plan.md`
- `agents/hardware-integration-plan.md`
- `agents/orchestration-plan.md`

Migration package:

- `migration/README.md`
- `migration/sfdw-vending-machine-migration-2026-06-08.tar.gz`

## Current Live Behavior

The live web app currently supports:

- Click, Space, or Enter trigger.
- Random selection across all 15 people/card slots with equal slot chance.
- Vertical rolling for about 1.33 seconds.
- Stop on the randomly selected row.
- Pause for 0.5 seconds.
- Horizontal pink selector roll.
- Stop on the randomly selected column.
- Full-machine grey shade overlay.
- Matching 250 x 250 selected-card reveal using exact Figma `People Card (When Selected)` / `Yes-*` selected-card exports.
- Two-state selected-card shake loop at 250ms per state.
- Mock receipt print request and completion events.

The app dispatches:

- `sfdw:selection-completed`
- `sfdw:printer-print-requested`
- `sfdw:printer-print-completed`

## Figma Status

Most recent deep audit:

- File: `SFDW 2026`
- File key: `6mgzLDLMGz0kLU908YXSiZ`
- Page: `Vending Machine (For Dev)`
- Section node: `386:8779`
- Section name: `Step 03-Show Card (2x size)`
- Screen frame: `339:20532`, `Step 04-Show Card (2x size)`
- Selected-card instance: `339:20840`, `People Card (When Selected)`
- Selected-card component set: `339:19433`, `People Card (When Selected)`
- Focus: `People Card (When Selected)`, all `Yes-*` components, and prototype interaction parameters.

The previous Figma auth issue was resolved during the selected-card audit. If a new chat cannot access Figma, reconnect the Figma MCP/server authorization and reuse the node IDs above.

## Next Implementation Work

Recommended next steps:

1. Continue visual tuning against Figma only if needed.
2. Replace the mock printer event with a local receipt-printer adapter.
3. Wire the physical button trigger after the display and printer payload are stable.
4. Add a local orchestration service so one physical trigger produces exactly one animation cycle and one print job.
