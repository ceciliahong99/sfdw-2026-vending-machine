# Migration Guide

Last updated: 2026-06-08

## Short Answer

The best way to migrate this project is to move the whole `SFDW VENDING MACHINE` folder into the existing project folder.

The chat thread itself cannot be moved by Codex, but the important context has been captured in markdown files and the app/assets are already inside this folder.

## Recommended Migration Method

Copy this entire folder:

`/Users/cecilia/Documents/Codex/2026-06-05/i-am-working-on-a-fun/SFDW VENDING MACHINE`

into the destination project folder.

Keep this internal structure intact:

```text
SFDW VENDING MACHINE/
  PROJECT_SCOPE.md
  PROJECT_MANIFEST.md
  CHAT_HANDOFF.md
  MIGRATION_GUIDE.md
  MIGRATION_CONTEXT.md
  MIGRATION_ARTIFACTS.md
  FIGMA_*.md
  agents/
  webapp/
  migration/
```

## Archive Option

A portable archive is prepared here:

`migration/sfdw-vending-machine-migration-2026-06-08.tar.gz`

Use this if it is easier to transfer one file. The archive excludes `.DS_Store` files and excludes the `migration/` folder itself to avoid nesting the package inside itself.

## Preview After Migration

From the migrated folder:

```sh
cd "SFDW VENDING MACHINE/webapp"
python3 -m http.server 4174 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4174/?v=selected-card-shake-alpha
```

The port number can be changed if `4174` is already in use.

## What To Verify

After migration, confirm:

```sh
node --check webapp/app.js
find webapp/assets -type f | wc -l
find webapp/assets/cards -type f | wc -l
find webapp/assets/people -type f | wc -l
find webapp/assets/selected-cards -type f | wc -l
```

Expected counts:

- `webapp/assets`: 61 files
- `webapp/assets/cards`: 15 files
- `webapp/assets/people`: 15 files
- `webapp/assets/selected-cards`: 30 files

Also test the app manually:

1. Load the preview URL.
2. Click the screen, or press Space/Enter.
3. Confirm the vertical roll starts.
4. Confirm it stops after about 1.33 seconds.
5. Confirm horizontal selection starts after a 0.5 second pause.
6. Confirm a selected card pops out and shakes.
7. Confirm a new click starts a new random cycle.

## What A New Chat Should Read

If this work continues in a new project chat, ask the assistant to read these first:

1. `MIGRATION_CONTEXT.md`
2. `PROJECT_MANIFEST.md`
3. `webapp/README.md`
4. `FIGMA_SELECTED_CARD_PRINT_AUDIT.md`
5. `PROJECT_SCOPE.md`

## Current Implementation Boundary

Already implemented:

- Figma-inspired vertical roll screen.
- Chassis/window/divider alignment pass.
- High-resolution transparent card assets.
- Equal random chance across 15 slots.
- One-click selection sequence.
- Horizontal pink selector.
- Full-machine grey reveal shade.
- Exact Figma selected-card exports.
- Two-state selected-card shake animation.
- Mock receipt-printer events.

Not implemented yet:

- Real receipt printer communication.
- Physical button input.
- Local orchestration service.
- Final receipt content/fun facts.

## Next Build Step

The clean next move is the printer adapter:

1. Keep the webapp as the display layer.
2. Add a local Node.js or Python service.
3. Connect the webapp to the service with `fetch` or WebSocket.
4. Translate the selected payload into a 58mm receipt layout.
5. Send ESC/POS commands to the printer over USB once hardware is confirmed.
