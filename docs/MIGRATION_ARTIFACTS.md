# Migration Artifacts

Last updated: 2026-06-08

This inventory lists the files that should travel with the project.

## Root Documentation

- `PROJECT_SCOPE.md`: original high-level project scope and phase plan.
- `PROJECT_MANIFEST.md`: current file inventory and implementation status.
- `CHAT_HANDOFF.md`: narrative handoff from the original chat.
- `MIGRATION_GUIDE.md`: how to move and preview the project.
- `MIGRATION_CONTEXT.md`: compact technical context for a new chat.
- `MIGRATION_ARTIFACTS.md`: this artifact inventory.

## Figma Audit Notes

- `FIGMA_03_SCREEN_CONTENT_AUDIT.md`
- `FIGMA_PROTOTYPE_TIMING_AUDIT.md`
- `FIGMA_VERTICAL_ROLL_CHASSIS_AUDIT.md`
- `FIGMA_SELECTED_CARD_PRINT_AUDIT.md`

These capture frame names, prototype timings, machine geometry notes, selected-card component details, and export/audit findings.

## Agent Planning Notes

- `agents/figma-to-webapp-plan.md`
- `agents/hardware-integration-plan.md`
- `agents/orchestration-plan.md`

These are planning docs for dividing future work across Figma-to-webapp, hardware, and orchestration concerns.

## Webapp Core

- `webapp/index.html`
- `webapp/styles.css`
- `webapp/app.js`
- `webapp/README.md`

The webapp is currently static and can be served without installing dependencies.

## Webapp Assets

Total asset files under `webapp/assets`: 61

Rolling cards:

- Folder: `webapp/assets/cards/`
- Count: 15
- Format: PNG
- Size: 500 x 500 each
- Use: vertical reel and horizontal selector rows

People/reference assets:

- Folder: `webapp/assets/people/`
- Count: 15
- Format: PNG
- Use: source/reference portraits from Figma exports

Selected-card assets:

- Folder: `webapp/assets/selected-cards/`
- Count: 30
- Format: PNG
- Size: 500 x 500 each
- Use: selected-card pop-out animation
- Naming: `{person-id}-state-1.png`, `{person-id}-state-2.png`

Shared vector:

- `webapp/assets/union.svg`

## Webapp Tools

- `webapp/tools/clean-card-alpha.mjs`

This script applies the geometry-only alpha cleanup to card PNGs. It preserves light clothing and signs inside the card art.

## Verification Screenshots

Root-level screenshots:

- `verification-equal-selection-chance.png`
- `verification-horizontal-selector-chosen.png`
- `verification-horizontal-selector.png`
- `verification-machine-reveal-shade.png`
- `verification-one-click-sequence.png`
- `verification-selected-card-mask.png`
- `verification-selected-card-reveal.png`
- `verification-selected-card-shake-alpha.png`
- `verification-selector-dimensions.png`
- `verification-selector-glow-edge-visible.png`
- `verification-selector-glow-edge.png`
- `verification-two-second-pause.png`

Webapp-level screenshots:

- `webapp/figma-step-01-vertical-roll-reference.png`
- `webapp/verification-chassis-audit.png`
- `webapp/verification-divider-lines.png`
- `webapp/verification-geometry-lines.png`
- `webapp/verification-step-01-hires-mask.png`
- `webapp/verification-step-01-transparent.png`
- `webapp/verification-step-01.png`
- `webapp/verification-structure-align.png`
- `webapp/verification-yoshi-hires-mask.png`

These are optional for runtime, but useful for visual QA and remembering design decisions.

## Migration Archive

Archive path:

- `migration/sfdw-vending-machine-migration-2026-06-08.tar.gz`

Archive contents should include:

- root docs
- Figma audit notes
- agent planning notes
- `webapp/`
- verification screenshots

Archive contents should exclude:

- `.DS_Store`
- `migration/`
- generated archive files
