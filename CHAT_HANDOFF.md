# Chat Handoff

Last updated: 2026-06-05

## Project

SFDW Vending Machine

Project folder:

`/Users/cecilia/Documents/Codex/2026-06-05/i-am-working-on-a-fun/SFDW VENDING MACHINE`

## Current Goal

Build an interactive fun fact vending machine with three main parts:

1. A physical button.
2. A TV display running a live web app.
3. A 58mm receipt printer.

The intended experience is:

1. Visitor presses the physical button.
2. Display animates a random selection from people cards.
3. App lands on a selected person/fun fact.
4. Receipt printer prints the selected fun fact.
5. App resets for the next visitor.

## Planned Phases

1. Figma prototype to live web app.
2. Receipt printer integration.
3. Physical button trigger integration.

Start with phase A and use a simulated trigger first, such as a keyboard shortcut, debug button, or local HTTP endpoint. Hardware should be added after the display animation and result payload are stable.

## Known Hardware

Display:

- TV
- 1920 x 1080
- Short edge: 35.5 in
- Use full-screen kiosk-style layout.

Receipt printer:

- Walmart listing: https://www.walmart.com/ip/5324691970
- Anself 58mm direct thermal receipt printer
- USB + Bluetooth listed
- 58mm paper, likely 48mm print width
- 203 dpi
- Likely ESC/POS-compatible, but must be verified with the actual device.

Button:

- Amazon link: https://www.amazon.com/dp/B071FSKY6Q?smid=A3H7VB6FZ4M9FM
- ASIN: B071FSKY6Q
- Appears to be an EG STARTS 100mm illuminated arcade button
- Likely microswitch plus separate 12V LED circuit
- Needs an interface layer: USB arcade encoder, USB HID microcontroller, or Raspberry Pi GPIO.

## Existing Project Docs

Read these first:

- `PROJECT_SCOPE.md`
- `agents/figma-to-webapp-plan.md`
- `agents/hardware-integration-plan.md`
- `agents/orchestration-plan.md`

## Current Architecture Recommendation

Use a local/offline-friendly architecture:

- Frontend: Vite + React + TypeScript full-screen display app.
- Local control service: Node.js or Python.
- App/service communication: WebSocket or Server-Sent Events.
- Simulated trigger first: keyboard/debug button/`POST /trigger`.
- Printer adapter later: ESC/POS over USB preferred first, OS print queue or Bluetooth as fallback.
- Button adapter later: USB arcade encoder preferred for portability, microcontroller or Raspberry Pi GPIO as alternatives.

Important invariant:

One trigger should produce exactly one selected result and one receipt print job.

## Suggested State Machine

- `idle`: waiting for trigger
- `selecting`: animation running
- `selected`: final result visible
- `printing`: receipt command in progress
- `complete`: printed/reveal pause
- `error`: hardware or app failure
- `resetting`: cleanup before returning to idle

## What To Ask User Next

Primary next input:

- Figma prototype link, ideally a node-specific URL with `node-id`.

Other useful details:

- What computer will run the app and hardware: Mac, mini PC, Raspberry Pi, or something else?
- Are people cards/fun facts already prepared?
- Should the screen show the fun fact, the selected person, or both?
- Should the receipt print immediately after selection or after a reveal pause?
- Should the button LED be always on, pulse when idle, or change with app state?
- Does the installation need to run fully offline during the event?

## Recommended Next Action

After the user provides the Figma link, start Phase A:

1. Inspect Figma design context.
2. Scaffold `webapp/`.
3. Build the full-screen 1920 x 1080 display app.
4. Add placeholder people/fun fact data if final content is not ready.
5. Implement simulated trigger and animation state machine.
6. Emit/log a stable receipt payload after selection.
7. Verify at 1920 x 1080 with browser testing.

## Notes

This handoff was created because the user wanted the current logistics and planning chat to be portable into the project folder. The actual chat thread cannot be moved by the assistant, but this file should let a new project chat resume cleanly.
