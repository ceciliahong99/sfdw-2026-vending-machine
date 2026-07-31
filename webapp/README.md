# SFDW Vending Machine Webapp

This is the first live screen pass for the Figma vertical roll and horizontal
selection sequence.

Open `index.html` directly in a browser, or serve this folder with any static server.

The current screen:

- Uses the Figma 1440 x 1024 frame dimensions.
- Centers and scales the frame to the browser viewport.
- Recreates the `Vertical Roll` reel with local rendered card exports from Figma.
- Uses 4x rendered card exports from Figma and clips only the outside-card area transparent.
- Runs the reel using the prototype timing found in Figma:
  - `AFTER_TIMEOUT`: about 50ms
  - `SMART_ANIMATE`: about 62ms
  - Easing: `QUICK`
- Space, Enter, or clicking the screen starts one full local test cycle:
  - The vertical reel rolls for about 1.33 seconds.
  - It then stops at the center row and pauses for 0.5 seconds.
  - The glowing pink horizontal selector starts automatically after the pause.
  - The app picks one random target from all 15 card slots, then stops on that target's row.
  - The horizontal selector lands on that target's column using the current prototype timing.
  - A `250 x 250` selected card pops out from the chosen rolling card.
  - The selected card uses exact Figma `Yes-*` selected-card exports and alternates between two shake states every `250ms`.
  - A print event starts when the selected card reveal begins.
  - Once selected, the next trigger starts a new cycle.
- Emits `sfdw:selection-completed` with the selected person payload.
- Emits `sfdw:printer-print-requested` and `sfdw:printer-print-completed`.
- Posts to the local print service when opened with `?printer=service`.

The production entrypoint uses `?printer=service&input=keyboard`, so a physical
button should arrive as a Space or Enter HID keyboard event. Test mode keeps
click/touch enabled for debugging.

## Fun Fact Monitor Preview

Use monitor preview mode to verify that selected people are mapped to the
corresponding CSV receipt data before testing the physical printer. The preview
shows name, role, fun fact, where-to-find, and the generated go-talk-to sentence:

```text
http://127.0.0.1:4180/?previewFacts=1
```

With the local service running in mock mode, this also tests the browser-to-print
payload path without sending anything to the physical printer:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1
```

Force a specific person for QA:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1&forcePerson=gadi
```

Random selection remains the default when `forcePerson` is omitted.

For all-member QA, show the roster panel:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1&qaRoster=1
```

Click a name in the roster panel, then click the vending-machine screen once.
The animation still runs, but it lands on the selected test person and previews
that person's CSV receipt fields.

## Card Assets

The card components currently use 500 x 500 rendered PNG exports from Figma under
`assets/cards/`, displayed at 125 x 125 in the reel and 250 x 250 in the selected-card
reveal fallback. Direct SVG export failed for
these rolling card components in Figma, likely due to existing component-set export/property
issues, so the current pass keeps the Figma-rendered portraits and applies a
geometry-only transparent mask outside the rounded card shape:

```sh
node tools/clean-card-alpha.mjs
```

Run that script again after replacing the card PNGs with fresh Figma exports. The
script does not remove colors inside the card, so light clothing and light signs are
preserved.

## Selected Card Assets

The selected-card reveal now uses 30 exact Figma exports under
`assets/selected-cards/`:

- 15 people / slots
- 2 shake states per slot
- 500 x 500 PNG files
- displayed at 250 x 250 for 2x pixel density

The file naming pattern is:

```text
assets/selected-cards/{person-id}-state-1.png
assets/selected-cards/{person-id}-state-2.png
```

These were exported from the Figma `Yes-*` component sets using the audited prototype
timing:

- `Property 1=1`
- `Property 1=Variant2`
- `AFTER_TIMEOUT`: `0.25s`
- transition: `null`

The live app mirrors this by toggling the two image layers every `250ms` while the
selected card is visible.
