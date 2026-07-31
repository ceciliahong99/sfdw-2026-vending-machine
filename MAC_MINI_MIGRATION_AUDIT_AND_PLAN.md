# Mac Mini Migration Audit And Plug-And-Play Plan

Date: 2026-06-10

## Goal

Move the whole SFDW Vending Machine installation to a Mac mini with the least
manual setup possible.

Target experience:

1. Mac mini boots.
2. Local service starts automatically.
3. Browser opens the production kiosk URL.
4. USB HID button sends Space.
5. Webapp runs one selection.
6. Receipt printer prints exactly one receipt.

## Current Project State

The project is currently self-contained in:

```text
/Users/cecilia/Documents/SFDW VENDING MACHINE
```

The current runtime is a static browser app plus a Node.js service. There is no
npm install and no build step.

Current verified local host state:

```text
macOS: 12.7.6
Architecture: x86_64
Node used here: /Applications/Codex.app/Contents/Resources/node
Node version here: v24.14.0
Service port: 4180
Printer queue: SFDW_POS58
Printer URI: usb://YICHIP3121/POS-58%20Printer?serial=B120300001
Printer PPD: POS-58
```

The service health endpoint reports:

```json
{
  "ok": true,
  "printerMode": "lp",
  "printerQueue": "SFDW_POS58",
  "receiptWidth": 32,
  "printProfileImages": true,
  "printCooldownMs": 20000
}
```

## Folder Inventory

Runtime source:

```text
webapp/index.html
webapp/production.html
webapp/test.html
webapp/styles.css
webapp/app.js
webapp/data/people-facts.js
service/server.mjs
service/receiptFormatter.mjs
service/syncPeopleFacts.mjs
service/buildReceiptProfileImages.mjs
ops/start-event-service.sh
ops/install-mac-mini.sh
ops/open-kiosk-chrome.sh
ops/create-migration-archive.sh
ops/com.sfdw.vending-machine.plist
hardware/qtpy-esp32s3-button-code.py
hardware/arduino/qtpy_sfdw_button/qtpy_sfdw_button.ino
```

Source data:

```text
data/ppl_facts.csv
```

Runtime assets:

```text
webapp/assets/cards/
webapp/assets/selected-cards/
webapp/assets/receipt-profiles/
webapp/assets/receipt-header/sfdw-header.png
service/receipt-profile-cache/
```

Docs and historical audit files:

```text
PROJECT_SCOPE.md
PROJECT_MANIFEST.md
MIGRATION_GUIDE.md
MIGRATION_CONTEXT.md
MIGRATION_ARTIFACTS.md
PHASE_2_RECEIPT_PRINTER_AUDIT_AND_PLAN.md
ESP32_BUTTON_AUDIT.md
HARDWARE_BUTTON_HANDOFF.md
FIGMA_*.md
agents/
```

Generated/test artifacts:

```text
service/print-jobs/
service/logs/
sfdw-vending-machine-migration-2026-06-08.tar.gz
webapp/verification-*.png
```

## Runtime Architecture

```text
Physical button
  -> USB HID keyboard Space key
  -> browser production page
  -> webapp random selection
  -> POST /print
  -> local Node service
  -> receipt formatter
  -> ESC/POS bytes
  -> lp -d SFDW_POS58 -o raw
  -> USB POS-58 receipt printer
```

The production page is:

```text
http://127.0.0.1:4180/production.html
```

`production.html` redirects to:

```text
./?printer=service&input=keyboard
```

That means production mode ignores pointer/click input and expects keyboard or
HID keyboard input.

Test page:

```text
http://127.0.0.1:4180/test.html
```

Test mode keeps the receipt preview visible and is safer for setup checks.

## What Is Already Plug-And-Play

- No npm package install.
- No frontend build.
- Browser app is plain HTML/CSS/JS.
- Service is plain Node ESM.
- Receipt profile images are prebuilt as ESC/POS byte chunks.
- All 15 live people have matching facts, rolling card art, selected-card art,
  receipt profile PNG, and ESC/POS profile cache.
- Button path is simple HID keyboard Space input.
- Service has `mock`, `file`, `raw`, and `lp` printer modes.
- Production print cooldown is already 20 seconds.

## Integrity Check Results

Syntax checks passed:

```text
webapp/app.js
service/server.mjs
service/receiptFormatter.mjs
service/syncPeopleFacts.mjs
service/buildReceiptProfileImages.mjs
```

Roster integrity:

```text
Live roster count: 15
Fact records: 15
Missing live assets/data: none
Legacy extras: mystery.png, mystery-state-1.png, mystery-state-2.png
```

Asset dimensions:

```text
webapp/assets/cards: 16 files, 500 x 500 PNG
webapp/assets/selected-cards: 32 files, 500 x 500 PNG
webapp/assets/receipt-profiles: 15 files, 300 x 300 PNG
service/receipt-profile-cache: 15 files
webapp/assets/receipt-header/sfdw-header.png: 476 x 213 PNG
```

Receipt length range:

```text
Shortest current receipt: Kyu, about 31 lines
Longest current receipt: Anthony, about 36 lines
```

## Important Audit Findings

### 1. Absolute paths must be regenerated on the Mac mini

These files currently hard-code the existing local path:

```text
ops/com.sfdw.vending-machine.plist
~/Library/LaunchAgents/com.sfdw.vending-machine.plist
```

`ops/start-event-service.sh` is now portable and detects its project path from
its own location. For a clean migration, do not hand-edit the LaunchAgent plist
after copying. Run `ops/install-mac-mini.sh`; it writes the Mac mini's actual
project path and Node path into the LaunchAgent.

Recommended target path:

```text
/Users/Shared/SFDW VENDING MACHINE
```

Reason: it avoids macOS Desktop/Documents privacy prompts and makes the path
stable across login sessions.

### 2. Do not depend on the Codex app Node binary on the Mac mini

Current script uses:

```text
/Applications/Codex.app/Contents/Resources/node
```

That works here, but the Mac mini should use a normal installed `node` binary or
a copied/bundled Node binary that the startup script can find.

Minimum practical requirement:

```text
node --version
```

Node 18+ should be sufficient for this code because it uses built-in ESM,
top-level await in scripts, and built-in Node modules only.

### 3. Printer setup is the main hardware migration step

Current queue:

```text
SFDW_POS58
```

Current device URI:

```text
usb://YICHIP3121/POS-58%20Printer?serial=B120300001
```

Current PPD exists here:

```text
/Library/Printers/PPDs/Contents/Resources/POS-58.ppd.gz
```

System Profiler saw the POS-58 queue but reported it as offline during one
audit pass, while `lpstat`/`lpq` reported the queue as ready. For migration, the
real acceptance test is a physical print from `production.html`, not only
queue status.

### 4. LaunchAgent has prior startup errors in logs

Current log file contains repeated:

```text
/bin/zsh: can't open input file: /Users/cecilia/Documents/SFDW VENDING MACHINE/ops/start-event-service.sh
```

The script now exists and is executable, but the log suggests the LaunchAgent
was loaded while the path was unavailable or blocked. Installing to
`/Users/Shared` and regenerating the plist should remove that class of failure.

### 5. Source CSV encoding should be cleaned before final handoff

`data/ppl_facts.csv` is detected as:

```text
text/csv; charset=iso-8859-1
```

Generated `webapp/data/people-facts.js` is UTF-8, but it currently contains
replacement characters in at least these fields:

```text
Fierro Caf�
Get to Know NDD �Vending Machine� Zone
```

The receipt formatter strips unsupported glyphs before printing, so this should
not crash the printer. But the clean migration should fix the CSV source and
rerun:

```sh
node service/syncPeopleFacts.mjs
```

### 6. Graphic receipt header is currently not in the print path

The folder has:

```text
webapp/assets/receipt-header/sfdw-header.png
service/receipt-header-cache/
```

But current source code does not generate or load a receipt-header ESC/POS
cache. The printed top block is currently text:

```text
NEW DEAL DESIGN
333 BRYANT ST #190
```

This is fine for migration if the current print layout is accepted. Restore a
graphic header only as a separate printer test.

### 7. Git state is not a normal committed repo

`git status --short` shows the project files as untracked. For migration, treat
the folder itself as the source of truth, or make a clean archive/git commit
before moving.

## Recommended Plug-And-Play Migration Plan

### Phase 0: Prepare this folder before copying

1. Fix CSV encoding/replacement characters.
2. Regenerate generated browser data:

```sh
node service/syncPeopleFacts.mjs
```

3. Regenerate receipt profile ESC/POS cache:

```sh
node service/buildReceiptProfileImages.mjs
```

4. Run syntax and roster checks.
5. Create a fresh migration archive:

```sh
ops/create-migration-archive.sh
```

The archive helper excludes `.git/`, `.DS_Store`, previous migration archives,
logs, and print-job test outputs.

### Phase 1: Prepare the Mac mini

Needed on the Mac mini:

- macOS user account that will auto-login for the kiosk.
- Node.js installed and available as `node`.
- POS-58 printer driver/PPD available.
- Chrome, Safari, or another browser suitable for fullscreen kiosk use.
- The QT Py / USB HID button plugged in.
- The receipt printer plugged in by USB.

Recommended folder:

```text
/Users/Shared/SFDW VENDING MACHINE
```

### Phase 2: Copy project

Copy the whole project folder to:

```text
/Users/Shared/SFDW VENDING MACHINE
```

Then verify:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
node --check webapp/app.js
node --check service/server.mjs
node --check service/receiptFormatter.mjs
find webapp/assets/receipt-profiles -name '*.png' | wc -l
find service/receipt-profile-cache -name '*.bin' | wc -l
```

Expected counts:

```text
receipt profile PNGs: 15
ESC/POS profile caches: 15
```

### Phase 3: Set up receipt printer queue

Plug in the POS-58 printer over USB.

Check for existing queues:

```sh
lpstat -p
lpstat -v
```

If `SFDW_POS58` does not exist, create it using the Mac mini's actual detected
USB URI. On the current machine the command is:

```sh
sudo lpadmin -p SFDW_POS58 -E -v "usb://YICHIP3121/POS-58%20Printer?serial=B120300001" -m "/Library/Printers/PPDs/Contents/Resources/POS-58.ppd.gz"
```

But on the Mac mini, confirm the URI first:

```sh
lpinfo -v | grep -i -E 'POS|YICHIP|58|usb'
```

Then verify:

```sh
lpstat -p SFDW_POS58
lpstat -v SFDW_POS58
lpq -P SFDW_POS58
```

### Phase 4: Run service in safe mode first

Mock mode:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
PORT=4180 PRINTER_MODE=mock PRINT_PROFILE_IMAGES=1 node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/test.html
```

Confirm:

- Page loads.
- Space triggers selection.
- Receipt preview updates.
- Terminal logs a mock receipt.

File mode:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
PORT=4180 PRINTER_MODE=file PRINT_PROFILE_IMAGES=1 node service/server.mjs
```

Confirm `.txt` and `.escpos.bin` files appear under:

```text
service/print-jobs/
```

### Phase 5: Run real printer mode

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
PORT=4180 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 PRINT_PROFILE_IMAGES=1 PRINT_COOLDOWN_MS=20000 node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/test.html
```

Run one print. Wait 20 seconds between tests.

Then open production:

```text
http://127.0.0.1:4180/production.html
```

### Phase 6: Install auto-start

Use the included installer so the LaunchAgent is regenerated on the Mac mini,
not copied with old absolute paths.

Recommended LaunchAgent behavior:

- Run at login.
- Keep alive.
- Start `ops/start-event-service.sh`.
- Log to `service/logs/`.
- Use `/usr/bin/caffeinate -dimsu` so display and sleep settings do not interrupt
  the kiosk.

Install:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
ops/install-mac-mini.sh
```

Verify:

```sh
launchctl print "gui/$(id -u)/com.sfdw.vending-machine"
curl http://127.0.0.1:4180/health
```

### Phase 7: Configure kiosk browser

Recommended simplest manual path:

1. Add browser to Login Items.
2. Set its startup page to:

```text
http://127.0.0.1:4180/production.html
```

3. Put browser in fullscreen.
4. Disable display sleep in macOS settings.
5. Confirm the browser window stays focused.

More automated path:

- Add a second LaunchAgent or AppleScript app that opens the production URL after
  a short delay.
- Use browser kiosk/fullscreen flags only after testing on the specific browser.

### Phase 8: Button validation

Before real printer testing:

1. Open a plain text field.
2. Press the physical arcade button.
3. Confirm exactly one Space per press.
4. Confirm holding the button does not repeatedly type forever.
5. Open:

```text
http://127.0.0.1:4180/?printer=mock&input=keyboard&previewFacts=1
```

6. Press button and confirm one animation run.
7. Only then use:

```text
http://127.0.0.1:4180/production.html
```

## Final Acceptance Checklist

Run on the Mac mini:

```sh
node --version
lpstat -p SFDW_POS58
lpstat -v SFDW_POS58
curl http://127.0.0.1:4180/health
curl http://127.0.0.1:4180/printer/status
```

Manual checks:

- TV is at desired resolution and browser is fullscreen.
- `test.html` works.
- `production.html` works.
- Button sends Space.
- One button press creates one animation and one receipt.
- Rapid repeated presses do not create duplicate receipts.
- Printer power cycle does not require rebuilding the queue.
- Mac reboot returns to ready kiosk state.

Soak test:

- Print at least 20 receipts.
- Include Anthony, Michele, and Dennis because they produce the longest receipts.
- Restart service once.
- Reboot Mac once.
- Power-cycle printer once.
- Confirm no duplicate print jobs.

## Information Still Needed For The Mac Mini

Not blocking this audit, but needed for the final plug-and-play setup:

```text
1. Mac mini macOS version
2. Mac mini chip/architecture: Intel or Apple Silicon
3. Login username that will run the kiosk
4. Final project install path
5. Browser choice: Safari, Chrome, or other
6. Whether the printer appears with the same USB URI on the Mac mini
7. Whether POS-58 driver/PPD is already installed on the Mac mini
8. Whether the Mac mini should auto-login after reboot
9. Whether the button LED needs to be always-on or controlled
```

## Included Setup Helper

The project now includes:

```text
ops/install-mac-mini.sh
ops/open-kiosk-chrome.sh
ops/create-migration-archive.sh
```

`ops/install-mac-mini.sh`:

1. Detects the project path.
2. Detects Node.
3. Creates `service/logs`.
4. Generates `ops/com.sfdw.vending-machine.plist` with the actual path.
5. Installs/loads the LaunchAgent.
6. Checks whether `SFDW_POS58` already exists.
7. Installs a Chrome kiosk LaunchAgent.
8. Prints the final setup checklist.

`ops/open-kiosk-chrome.sh` waits for `/health`, then opens Chrome to
`production.html`.

`ops/create-migration-archive.sh` makes a clean transfer archive.

Together these turn migration from a hand-run checklist into repeatable setup
steps.
