# SFDW Vending Machine Project Scope

Last updated: 2026-06-05

## Project Summary

The SFDW vending machine is an interactive installation that dispenses fun facts. A visitor presses a physical button, the display animates a random selection from a set of people cards, and the machine prints a receipt containing the selected result.

The project will be built in three phases:

1. Turn the Figma prototype into a live web app.
2. Make the receipt printer work from the app/system.
3. Connect the physical button so one button press triggers the animation and receipt print.

## Known Hardware

### Display

- Target display: TV
- Resolution: 1920 x 1080
- Aspect ratio: 16:9
- Physical short edge: 35.5 in
- Estimated physical width: 63.1 in
- Estimated diagonal: 72.4 in
- Practical implication: the live app should be designed as a full-screen 1920 x 1080 kiosk display and tested at that exact viewport.

### Receipt Printer

- Product link: https://www.walmart.com/ip/Anself-58mm-Receipt-Printer-USB-BT-Direct-Thermal-Printing-for-Shipping-Business-Restaurant-Kitchen/5324691970
- Product family: Anself 58mm direct thermal receipt printer
- Connections listed: USB and Bluetooth
- Paper width: 58mm
- Print width listed by Walmart: 48mm
- Resolution listed by Walmart: 203 dpi
- Print speed listed by Walmart: 90mm/s
- Content support listed: multi-language text, pictures, 1D barcode, QR code
- Likely integration path: ESC/POS commands over USB or Bluetooth, to be verified with the actual unit.

### Physical Button

- Product link: https://www.amazon.com/dp/B071FSKY6Q?smid=A3H7VB6FZ4M9FM
- ASIN: B071FSKY6Q
- Identified product family: EG STARTS 4 inch / 100mm illuminated arcade button
- Button type: large dome arcade push button with microswitch
- Listed button diameter: 100mm, about 4 in
- Listed power: DC 12V for illumination
- Listed switch life: 1,000,000 presses
- Practical implication: the button is probably not a direct USB input device by itself. It will likely need either GPIO on a Raspberry Pi, a small microcontroller, or a USB keyboard/arcade encoder.

## Product Flow

1. Idle screen waits for a trigger.
2. User presses the physical button.
3. Web app starts the Figma-inspired selection animation.
4. Animation cycles through people cards.
5. App lands on a selected person/fun fact.
6. Receipt print command is sent.
7. Printer prints the selected fun fact receipt.
8. App returns to idle after a reset delay.

## Recommended System Architecture

Use a local app architecture so the installation can run without depending on the public internet during the event.

- Frontend display app: browser-based full-screen web app, likely Vite + React.
- Local control service: Node.js or Python service running on the installation computer.
- Event channel: WebSocket or Server-Sent Events between the service and the display app.
- Printer interface: local service sends ESC/POS or system print commands to the thermal printer.
- Button interface: local service listens for GPIO, serial, HID keyboard, or USB encoder input.

During phase A, use a simulated trigger first:

- On-screen debug button
- Keyboard shortcut
- Optional local HTTP endpoint such as `POST /trigger`

This lets the Figma-to-web-app work finish before printer and button hardware are connected.

## Phase A: Figma Prototype To Live Web App

Goals:

- Recreate the prototype layout and animation in a full-screen web app.
- Support a deterministic trigger event, initially simulated.
- Build a data model for people cards and fun facts.
- Make selection state explicit so the same selected result can drive both screen and receipt.
- Test at 1920 x 1080.

Inputs needed:

- Figma file or node-specific prototype link.
- People card assets or export instructions.
- Fun fact data.
- Desired idle, selecting, selected, printing, and reset states.

Likely deliverables:

- `webapp/` project scaffold
- Full-screen display route
- Triggerable animation
- People/facts data file
- Receipt payload object emitted after selection

## Phase B: Receipt Printer

Goals:

- Confirm whether the printer appears as USB serial, USB printer, Bluetooth serial, or OS printer.
- Print a basic text receipt.
- Print a formatted fun fact receipt.
- Decide whether to use ESC/POS direct commands or OS-level print queue.
- Add printer error handling for disconnected printer, no paper, and failed command.

Likely deliverables:

- Printer test script
- Receipt formatting helper
- Print service endpoint
- Hardware setup notes

## Phase C: Physical Button Trigger

Goals:

- Determine the machine computer and button interface.
- Wire the button safely, including separate LED power if needed.
- Convert button press into a single debounced trigger event.
- Prevent duplicate prints while animation/printing is already in progress.

Likely deliverables:

- Button listener script/service
- Wiring notes
- Debounce and lockout behavior
- End-to-end trigger test

## State Machine

Suggested app states:

- `idle`: waiting for input
- `selecting`: animation is running
- `selected`: final person/fact is visible
- `printing`: print command is in progress
- `complete`: receipt printed, short pause before reset
- `error`: hardware or print issue shown in debug/admin mode

Important rule: one trigger should produce one selected result and one print job.

## Sub-Agent Workstreams

The project can be split into focused sub-agents:

- Figma to web app agent: translates the prototype into a live browser app and plans the animation/data model.
- Hardware integration agent: researches and documents printer/button setup, wiring, protocols, and test steps.
- Orchestration agent: designs the event flow connecting trigger, animation, selection, and print output.

Each agent should write its notes under `SFDW VENDING MACHINE/agents/` and avoid editing another agent's files.

## Open Questions

- What is the Figma file or prototype frame link?
- What computer will drive the TV and hardware: Raspberry Pi, Mac, mini PC, or something else?
- Should the receipt print immediately after selection, or after a short reveal pause?
- Should the screen show the printed fun fact, or only show the selected person card?
- Are people/fun facts already prepared, and are they public-safe/final?
- Is the button LED required to light continuously, pulse while idle, or change state during selection?
- Should the installation work fully offline after setup?

## Next Practical Step

Start phase A with a local web app and simulated trigger. Once the animation and result payload are stable, connect the printer service, then replace the simulated trigger with the physical button input.
