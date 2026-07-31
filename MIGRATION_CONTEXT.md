# Migration Context

Last updated: 2026-06-08

This file captures the working context from the chat so the project can move into another folder or continue in a new project chat.

## Product Summary

SFDW Vending Machine is a fun fact vending machine installation.

It has:

- A physical push button.
- A 1920 x 1080 TV display.
- A 58mm direct thermal receipt printer.

Current build focus:

- Turn the Figma prototype into a live display webapp.
- Keep printer and physical button integration for later phases.

## Current Webapp Location

`webapp/`

The app is static HTML/CSS/JS. It does not currently require npm install.

Current preview URL in this workspace:

`http://127.0.0.1:4174/?v=selected-card-shake-alpha`

## Current Display Behavior

Trigger:

- Click
- Space
- Enter

Sequence:

1. User triggers the app.
2. App randomly picks one target from all 15 card slots.
3. Vertical reel rolls for about 1.33 seconds.
4. Reel stops with the target row centered.
5. App waits 0.5 seconds.
6. Horizontal pink selector starts.
7. Selector rolls across the centered row.
8. Selector stops on the target person.
9. Full-machine grey shade appears.
10. Matching selected-card asset pops out at 250 x 250.
11. Selected card shakes by toggling two Figma-exported states every 250ms.
12. Mock printer request/completion events fire.

## Current Timing Values

From `webapp/app.js`:

- Figma `AFTER_TIMEOUT`: `50ms`
- Figma `SMART_ANIMATE`: `62.02129274606705ms`
- Figma easing label: `quick`
- Vertical roll: `1333.3333333333333ms`
- Pause before horizontal roll: `500ms`
- Reveal delay after horizontal choice: `180ms`
- Selected-card shake step: `250ms`
- Mock print duration: `1400ms`

## Current Events

The webapp dispatches:

- `sfdw:selection-completed`
- `sfdw:printer-print-requested`
- `sfdw:printer-print-completed`

These are the bridge points for the future local printer service.

## People And Slots

The app has 15 equally weighted slots:

```text
Top row:
jan, henry, dennis, cecilia, kimberly

Middle row:
gadi, michele, jeff, yoshi, kyu

Bottom row:
stan, yuri, felipe, aidan, mystery
```

Each slot has:

- Rolling card asset: `webapp/assets/cards/{person-id}.png`
- Selected state 1 asset: `webapp/assets/selected-cards/{person-id}-state-1.png`
- Selected state 2 asset: `webapp/assets/selected-cards/{person-id}-state-2.png`

## Figma Source

Figma file:

- Name: `SFDW 2026`
- File key: `6mgzLDLMGz0kLU908YXSiZ`

Primary audited sections:

- `339:2003`: earlier step sequence section.
- `358:8374`: machine chassis and window alignment reference.
- `358:8775`: step-by-step machine geometry/window structure.
- `358:8778`: second step, vertical rolling and horizontal selector.
- `386:8779`: selected-card pop-out and print moment.

Most important selected-card nodes:

- Section: `386:8779`, `Step 03-Show Card (2x size)`
- Screen frame: `339:20532`, `Step 04-Show Card (2x size)`
- Machine frame: `339:20533`, `Horizontal Roll-OPS`
- Selected-card instance: `339:20840`, `People Card (When Selected)`
- Selected-card component set: `339:19433`, `People Card (When Selected)`

Selected-card Figma behavior:

- `People Card (When Selected)` has 15 variants.
- Each selected-card variant corresponds to one rolling-card person/slot.
- Each nested `Yes-*` component has two variants.
- Prototype trigger is `AFTER_TIMEOUT`.
- Timeout is `0.25s`.
- Navigation is `CHANGE_TO`.
- Transition is `null`.

## Figma Export Status

Rolling card assets:

- Exported as 500 x 500 PNGs.
- Cleaned with a geometry-only alpha mask so light clothing/signs are preserved.

Selected-card assets:

- Exported as exact Figma selected-card assets.
- 30 files total.
- Two states per person.
- All 500 x 500 PNGs.
- Active in the live app.

## Visual Notes From User Feedback

Important corrections already handled:

- Rolling card backgrounds must be transparent outside the card shape.
- Light clothing must not be destroyed by alpha cleanup.
- Card assets need high enough resolution for a large TV.
- Machine chassis/window geometry should follow Figma closely.
- Specific divider lines should be covered or exposed according to Figma windows.
- Pink horizontal selector should align tightly to the card edge.
- Selector glow should render fully at the left/right edges.
- Selected card should not have a pink glow.
- During selected-card reveal, the whole machine interface should get a semi-transparent grey shade.
- The selection should be equally random across all 15 people/slots.

## Hardware Notes

Printer:

- Anself 58mm direct thermal receipt printer.
- Listed as USB + Bluetooth.
- Verify ESC/POS support with the actual unit.
- USB should be tried first.

Button:

- EG STARTS-style 100mm illuminated arcade button.
- Likely requires a USB arcade encoder, USB HID microcontroller, or Raspberry Pi GPIO.
- LED power is likely separate from signal.

## Suggested Next Work

Phase B printer adapter:

- Add a local service.
- Receive selected payload from the webapp.
- Format 58mm receipt content.
- Send to printer.
- Preserve mock print mode for debugging.

Phase C button adapter:

- Connect physical button to the same trigger path.
- Debounce the input.
- Ignore triggers while app is not idle.
- Optionally drive button LED from app state.
