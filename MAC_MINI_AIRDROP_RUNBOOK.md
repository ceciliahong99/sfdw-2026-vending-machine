# Mac Mini AirDrop Runbook

Last updated: 2026-06-10

This is the current migration guide for running the SFDW Vending Machine on the
Mac mini without Codex. It assumes you will AirDrop the whole project folder.

## Goal

After setup, the Mac mini should:

1. Boot into the kiosk user.
2. Start the local Node service automatically.
3. Open the preferred kiosk page.
4. Accept the arcade button as a USB keyboard Space press.
5. Print one receipt through the `SFDW_POS58` printer queue.

## What This Project Needs

Runtime:

- Node.js, preferably Node 22 on a Big Sur Intel Mac mini.
- Google Chrome for the cleanest kiosk startup.
- A macOS/CUPS receipt-printer queue named `SFDW_POS58`.
- The QT Py / USB HID button sending Space or Enter.

What it does not need:

- Codex on the Mac mini.
- `npm install`.
- A frontend build step.
- Internet access after Node, Chrome, and printer drivers are installed.

## Current Audit Summary

The project is a plain static webapp plus a local Node service.

Important files:

```text
webapp/index.html
webapp/test.html
webapp/production.html
webapp/app.js
webapp/styles.css
webapp/data/people-facts.js
service/server.mjs
service/receiptFormatter.mjs
ops/install-mac-mini.sh
ops/start-event-service.sh
ops/open-kiosk-chrome.sh
hardware/qtpy-esp32s3-button-code.py
```

Verified on this folder:

```text
Node syntax checks: passed
Live roster count: 15
Fact records: 15
Missing live card/profile/print assets: none
Legacy extra visual assets: mystery card files only
Current local Node version used for audit: v24.14.0
```

Known non-blockers:

- `webapp/data/people-facts.js` contains replacement characters from CSV encoding
  in Gadi's restaurant and Cecilia's where-to-find text. Printing still works
  because receipt text is normalized to printer-safe ASCII, but clean the CSV
  before event day if you care about those exact on-screen preview strings.
- `ops/com.sfdw.vending-machine.plist` has old absolute paths. Do not copy it
  manually into `~/Library/LaunchAgents`; run `ops/install-mac-mini.sh` on the
  Mac mini so the plist is regenerated with the Mac mini path.
- `service/logs/` and `service/print-jobs/` contain previous test output. They
  are safe to ignore.

## Step 1: Prepare The Mac Mini

Use a dedicated kiosk macOS user if possible.

Install or confirm:

1. Google Chrome.
2. POS-58 printer driver or PPD.
3. Node.js.

For an Intel Mac mini on macOS Big Sur 11.6.1, use Node 22 x64 if possible.
Node 22 officially lists macOS x64 11.0+ support and remains scheduled through
2027-04-30. Avoid Node 24+ on Big Sur because Node 24 lists macOS 13.5+ for
official binaries.

Verify Node in Terminal:

```sh
node --version
```

Any Node 18+ should run this app, but Node 22 is the best fit for Big Sur.

## Step 2: AirDrop And Place The Folder

AirDrop the entire folder:

```text
SFDW VENDING MACHINE
```

Recommended final location on the Mac mini:

```text
/Users/Shared/SFDW VENDING MACHINE
```

Using `/Users/Shared` avoids Desktop/Documents privacy prompts that can confuse
LaunchAgents.

If AirDrop puts the folder in Downloads, move it with Finder or Terminal:

```sh
mkdir -p /Users/Shared
mv "$HOME/Downloads/SFDW VENDING MACHINE" /Users/Shared/
```

If AirDrop creates a duplicate name such as `SFDW VENDING MACHINE 2`, rename it
back to:

```text
SFDW VENDING MACHINE
```

Then open Terminal:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
```

## Step 3: Verify The Copied Folder

Run:

```sh
node --check webapp/app.js
node --check service/server.mjs
node --check service/receiptFormatter.mjs
node --check service/syncPeopleFacts.mjs
node --check service/buildReceiptProfileImages.mjs
```

Check required receipt assets:

```sh
find webapp/assets/receipt-profiles -name '*.png' | wc -l
find service/receipt-profile-cache -name '*.bin' | wc -l
```

Expected:

```text
15
15
```

## Step 4: Safe Browser Test Without Printing

Start the service in mock mode:

```sh
PORT=4180 PRINTER_MODE=mock PRINT_PROFILE_IMAGES=1 node service/server.mjs
```

Open this URL on the Mac mini:

```text
http://127.0.0.1:4180/test.html
```

Press Space.

Confirm:

- The page loads.
- The animation runs.
- A person is selected.
- The receipt preview updates.
- The Terminal prints mock receipt text.

Stop the service with `Control-C` before continuing.

## Step 5: Set Up The Receipt Printer Queue

Plug the receipt printer into the Mac mini by USB.

Check current queues and USB devices:

```sh
lpstat -p
lpstat -v
lpinfo -v | grep -i -E 'POS|YICHIP|58|usb'
```

The app expects this queue name:

```text
SFDW_POS58
```

If the queue already exists, verify it:

```sh
lpstat -p SFDW_POS58
lpstat -v SFDW_POS58
lpq -P SFDW_POS58
```

If the queue does not exist, create it using the Mac mini's detected USB URI.
The current machine used this command:

```sh
sudo lpadmin -p SFDW_POS58 -E -v "usb://YICHIP3121/POS-58%20Printer?serial=B120300001" -m "/Library/Printers/PPDs/Contents/Resources/POS-58.ppd.gz"
```

Only reuse that exact URI if the Mac mini reports the same URI. If the Mac mini
reports a different USB URI, replace the `-v` value with the Mac mini value.

## Step 6: Real Printer Test

Start the service in printer mode:

```sh
PORT=4180 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 PRINT_PROFILE_IMAGES=1 PRINT_COOLDOWN_MS=20000 node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/test.html
```

Press Space once.

Confirm:

- One animation runs.
- One receipt prints.
- The printed receipt includes the selected profile image.
- The printer does not keep printing duplicates.

Wait at least 20 seconds between print tests.

Useful status URLs:

```text
http://127.0.0.1:4180/health
http://127.0.0.1:4180/printer/status
```

Stop the service with `Control-C` after the real printer test passes.

## Step 7: Button Test

The button should act like a USB keyboard and send Space or Enter.

Safe order:

1. Open any text field on the Mac mini.
2. Press the physical button.
3. Confirm it types one Space per press.
4. Start mock mode again:

```sh
PORT=4180 PRINTER_MODE=mock PRINT_PROFILE_IMAGES=1 node service/server.mjs
```

5. Open:

```text
http://127.0.0.1:4180/?printer=mock&input=keyboard&previewFacts=1
```

6. Press the button and confirm one animation.
7. Stop the service with `Control-C`.

Do not use the preferred live URL until the button test passes.

## Step 8: Install Auto-Start

After mock mode, real printer mode, and button input all pass, install the
LaunchAgents:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
ops/install-mac-mini.sh
```

This installs:

```text
com.sfdw.vending-machine
com.sfdw.vending-machine.chrome
```

The service LaunchAgent runs:

```text
PORT=4180
PRINTER_MODE=lp
PRINTER_QUEUE=SFDW_POS58
PRINT_PROFILE_IMAGES=1
PRINT_COOLDOWN_MS=20000
```

The Chrome LaunchAgent waits for `/health`, then opens the preferred live URL:

```text
http://127.0.0.1:4180/?printer=service
```

Verify:

```sh
launchctl print "gui/$(id -u)/com.sfdw.vending-machine"
launchctl print "gui/$(id -u)/com.sfdw.vending-machine.chrome"
curl http://127.0.0.1:4180/health
```

## Step 9: Reboot Test

Restart the Mac mini.

Confirm:

- The kiosk user logs in.
- The service starts.
- Chrome opens the production page.
- The browser window is frontmost.
- The physical button triggers one animation.
- One receipt prints.

Preferred live URL:

```text
http://127.0.0.1:4180/?printer=service
```

Testing URL:

```text
http://127.0.0.1:4180/test.html
```

## Mac Settings For Event Day

Set these manually:

- Auto-login to the kiosk user.
- Disable computer sleep.
- Disable display sleep during the event.
- Disable screen saver or set it longer than the event.
- Turn off notifications/focus interruptions.
- Keep Chrome frontmost.
- Confirm the TV/projector resolution looks right.
- Tape down or strain-relieve USB power, printer USB, button USB, and display
  cables.

## Troubleshooting

Service not healthy:

```sh
curl http://127.0.0.1:4180/health
tail -n 80 service/logs/event-service.err.log
tail -n 80 service/logs/event-service.log
```

Port already in use:

```sh
lsof -ti tcp:4180
```

Printer queue missing:

```sh
lpstat -p
lpinfo -v | grep -i -E 'POS|YICHIP|58|usb'
```

Restart LaunchAgents:

```sh
launchctl kickstart -k "gui/$(id -u)/com.sfdw.vending-machine"
launchctl kickstart -k "gui/$(id -u)/com.sfdw.vending-machine.chrome"
```

Remove LaunchAgents if you need to reinstall:

```sh
launchctl bootout "gui/$(id -u)/com.sfdw.vending-machine"
launchctl bootout "gui/$(id -u)/com.sfdw.vending-machine.chrome"
```

Then rerun:

```sh
ops/install-mac-mini.sh
```

## Final Acceptance Checklist

Before the event, verify:

- `node --version` works in Terminal.
- `curl http://127.0.0.1:4180/health` reports `printerMode: "lp"`.
- `lpstat -p SFDW_POS58` reports the queue.
- `test.html` can print one receipt.
- `http://127.0.0.1:4180/?printer=service` can print one receipt from the button.
- Holding the button does not create repeated print jobs.
- At least 20 receipts print during a soak test.
- Reboot returns to the production kiosk automatically.
- Printer power cycle does not require recreating the queue.

## Details Still Useful From The Mac Mini

Send these back if setup hits a snag:

```text
macOS version
Intel or Apple Silicon
Node version
Chrome installed or not
Printer driver/PPD installed or not
Output of: lpstat -p
Output of: lpstat -v
Output of: lpinfo -v | grep -i -E 'POS|YICHIP|58|usb'
Final install path of the project folder
```

## References

- Node 22 platform notes: https://github.com/nodejs/node/blob/v22.x/BUILDING.md
- Node 24 platform notes: https://github.com/nodejs/node/blob/v24.x/BUILDING.md
- Node release schedule: https://github.com/nodejs/Release/blob/main/schedule.json
