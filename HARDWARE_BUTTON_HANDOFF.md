# SFDW Vending Machine - Hardware Button Handoff

This handoff captures the final working software/printer state for continuing in
a new chat focused on the physical button trigger.

## Project Folder

```text
/Users/cecilia/Documents/SFDW VENDING MACHINE
```

## Current Working State

- The HTML prototype animation works.
- The receipt printer is connected through macOS/CUPS.
- The receipt prints selected-person data from `data/ppl_facts.csv`.
- Profile image printing is enabled and working through prebuilt ESC/POS raster
  image chunks.
- The testing version includes a people chooser with `Random` plus all 15 names.
- The production version has no chooser, no receipt preview, and is configured
  for keyboard/HID button input only.
- The next hardware step is wiring the physical arcade button to an input
  interface that sends one Space or Enter keypress.

## Current Live Service

The local service is expected to run on port `4180`.

Current health state at handoff:

```json
{
  "ok": true,
  "printerMode": "lp",
  "printerDevice": null,
  "printerQueue": "SFDW_POS58",
  "receiptWidth": 32,
  "printProfileImages": true
}
```

Start/restart command:

```sh
cd "/Users/cecilia/Documents/SFDW VENDING MACHINE"
env PORT=4180 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 PRINT_PROFILE_IMAGES=1 /Applications/Codex.app/Contents/Resources/node service/server.mjs
```

If something is already on port `4180`:

```sh
lsof -ti tcp:4180
```

Then stop the PID before restarting the service.

## URLs

Testing version, with receipt preview and chooser:

```text
http://127.0.0.1:4180/test.html
```

Production version, with no chooser and no receipt preview:

```text
http://127.0.0.1:4180/production.html
```

Equivalent raw URLs:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1
http://127.0.0.1:4180/?printer=service&input=keyboard
```

Forced-person testing can still be done with:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1&forcePerson=jan
```

Supported person IDs:

```text
jan, henry, dennis, cecilia, kimberly,
gadi, michele, jeff, yoshi, kyu,
stan, yuri, felipe, aidan, anthony
```

## Printer Setup

Printer queue:

```text
SFDW_POS58
```

macOS/CUPS device:

```text
usb://YICHIP3121/POS-58%20Printer?serial=B120300001
```

Queue creation command, if it ever needs to be recreated:

```sh
sudo lpadmin -p SFDW_POS58 -E -v "usb://YICHIP3121/POS-58%20Printer?serial=B120300001" -m "Library/Printers/PPDs/Contents/Resources/POS-58.ppd.gz"
```

Queue check:

```sh
lpstat -p SFDW_POS58
lpstat -v SFDW_POS58
```

## Key Software Files

```text
webapp/index.html
webapp/test.html
webapp/production.html
webapp/app.js
webapp/styles.css
webapp/data/people-facts.js
data/ppl_facts.csv
service/server.mjs
service/receiptFormatter.mjs
service/syncPeopleFacts.mjs
service/buildReceiptProfileImages.mjs
service/README.md
hardware/README.md
hardware/qtpy-esp32s3-button-code.py
```

## Asset Directories

Rolling people-card images:

```text
webapp/assets/cards/
```

Selected card animation images:

```text
webapp/assets/selected-cards/
```

Receipt profile PNGs exported from Figma:

```text
webapp/assets/receipt-profiles/
```

Printer-ready ESC/POS profile image chunks:

```text
service/receipt-profile-cache/
```

Expected receipt profile assets:

```text
aidan, anthony, cecilia, dennis, felipe,
gadi, henry, jan, jeff, kimberly,
kyu, michele, stan, yoshi, yuri
```

## CSV/Data Sync

Source CSV:

```text
data/ppl_facts.csv
```

Generated browser data:

```text
webapp/data/people-facts.js
```

After CSV changes, regenerate:

```sh
/Applications/Codex.app/Contents/Resources/node service/syncPeopleFacts.mjs
```

The sync handles both `Full Name` and the current `Full Mame` header typo.

## Receipt Image Sync

If the profile PNGs are changed, rebuild printer-ready image chunks:

```sh
/Applications/Codex.app/Contents/Resources/node service/buildReceiptProfileImages.mjs
```

Image print mode is controlled by:

```sh
PRINT_PROFILE_IMAGES=1
```

Fallback text-only mode:

```sh
PRINT_PROFILE_IMAGES=0
```

## Current Trigger Logic

The app already supports three software triggers in `webapp/app.js`:

- Mouse/touch: `pointerdown`
- Keyboard Space
- Keyboard Enter

For production, `production.html` redirects to:

```text
./?printer=service&input=keyboard
```

That keeps the final installation on keyboard/HID button input only. Test mode
still allows click/touch plus Space/Enter.

Relevant functions:

```text
handleTrigger()
startSelectionSequence()
window.sfdwVending.startSelectionSequence()
```

Relevant code behavior:

- `handleTrigger()` only starts when the phase is `idle` or `complete`.
- Space/Enter key repeats are ignored until the key is released, so a held HID
  button cannot auto-repeat into a second print after the app reaches
  `complete`.
- The trigger starts the vertical roll, automatically stops on a selected row,
  runs horizontal selection, reveals the selected card, and posts the receipt
  payload to `/print`.
- Production mode is already randomized because no `forcePerson` param is set.

## Recommended Physical Button Path

The linked button is:

```text
https://www.amazon.com/dp/B071FSKY6Q?smid=A3H7VB6FZ4M9FM&th=1
```

Identified hardware:

- EG STARTS / JM-100mm style 4 inch / 100mm illuminated arcade pushbutton.
- Bare arcade button assembly with a microswitch, spring, and separate LED.
- The LED side is listed as 12V DC.
- The switch side is not USB by itself.

Best first hardware approach:

Wire the button microswitch to a USB HID keyboard encoder or microcontroller
that sends exactly one key press: `Space` or `Enter`.

Why:

- The browser already listens for Space and Enter.
- No Web Serial/WebUSB permissions are needed.
- No extra local bridge service is needed.
- It works well for kiosk/event setups on macOS.

Examples of suitable hardware approaches:

- USB arcade button encoder that can appear as a keyboard and send Space or
  Enter.
- Arduino Leonardo / Micro / Pro Micro using the Keyboard library.
- Raspberry Pi Pico / RP2040 running CircuitPython HID keyboard code.
- Current detected board: Adafruit QT Py ESP32-S3, with a ready CircuitPython
  Space-key firmware file at `hardware/qtpy-esp32s3-button-code.py`.

Wiring assumptions to verify with the actual button:

- Use the microswitch `COM` and `NO` terminals for the trigger.
- Do not use `NC` for the trigger.
- Keep the 12V LED circuit separate from the switch/input circuit.
- Do not connect 12V LED power to a USB encoder input, microcontroller GPIO, or
  Raspberry Pi GPIO.
- If the LED should be lit, power it from a separate 12V DC supply or a driver
  appropriate for the chosen controller.

Mac input test before touching the live printer path:

1. Wire button `COM` + `NO` to the chosen encoder input.
2. Configure the encoder/microcontroller to send `Space` or `Enter`.
3. Open any text field on the Mac.
4. Press and hold the arcade button.
5. Confirm it sends one keypress per press, or at minimum that the app ignores
   held-key repeat.
6. Open `http://127.0.0.1:4180/?printer=mock&input=keyboard` and test the same
   button without printing.
7. Confirm the browser window is frontmost/focused before the event.
8. Only for the final end-to-end test, open
   `http://127.0.0.1:4180/production.html`; a successful button press there will
   send the receipt to the physical printer.

Avoid as first path:

- Browser Web Serial as the only trigger path, because it needs permission and
  can be fragile in a kiosk setting.
- Direct GPIO on the iMac/Mac mini, because Macs do not expose simple GPIO pins.
- A gamepad-only arcade encoder, unless you also add Gamepad API polling to the
  app. Prefer keyboard HID for this final step.

## Suggested Next-Chat First Prompt

Paste this into the new chat:

```text
We are continuing the SFDW Vending Machine project in:
/Users/cecilia/Documents/SFDW VENDING MACHINE

Please read HARDWARE_BUTTON_HANDOFF.md first. The HTML prototype, receipt
printer, image receipts, testing URL, and production URL are already working.
The next task is hardware testing for a physical button that should trigger the
same selection-and-print path as the current software trigger. Production mode
expects Space or Enter from a USB HID keyboard-style button interface, so please
start by helping me choose/test the safest button-to-keyboard-emulation path on
macOS, then integrate only if needed.
```

## Safety Notes For The Next Chat

- Do not send physical print jobs unless explicitly requested.
- Keep `production.html` clean: no chooser, no receipt preview.
- Keep `test.html` for debugging: receipt preview plus Random/person chooser.
- Do not remove the current assets unless asked.
- If changing receipt image behavior, test with file/mock mode first before
  sending to the physical printer.
