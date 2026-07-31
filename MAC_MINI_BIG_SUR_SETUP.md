# Mac Mini Big Sur Setup

Target Mac:

```text
macOS Big Sur 11.6.1
Intel Mac mini
Google Chrome
POS-58/POS driver installed by user
```

## What Is Ready Here

This folder has been prepared so the Mac mini setup only needs machine-specific
checks:

- service startup script is path-portable
- LaunchAgent installer is generated on the Mac mini
- Chrome kiosk opener is included
- clean migration archive helper is included
- runtime still has no npm install and no build step

## Transfer Package

On this Mac, create a clean archive:

```sh
cd "/Users/cecilia/Documents/SFDW VENDING MACHINE"
ops/create-migration-archive.sh
```

Move the generated `.tar.gz` to the Mac mini.

## Recommended Install Location

On the Mac mini:

```sh
sudo mkdir -p /Users/Shared
cd /Users/Shared
tar -xzf /path/to/sfdw-vending-machine-mac-mini-*.tar.gz
cd "/Users/Shared/SFDW VENDING MACHINE"
```

`/Users/Shared` is recommended because it avoids the extra Documents/Desktop
privacy prompts that can interfere with LaunchAgents on macOS.

## Node

Install an Intel macOS Node.js binary that runs on Big Sur. The app only needs
built-in Node modules, so use a stable Node release that supports your Big Sur
installer instead of chasing the newest version.

Verify:

```sh
node --version
node --check webapp/app.js
node --check service/server.mjs
node --check service/receiptFormatter.mjs
```

## Printer Queue

After installing the POS driver and plugging in the printer by USB:

```sh
lpstat -p
lpstat -v
lpinfo -v | grep -i -E 'POS|YICHIP|58|usb'
```

If `SFDW_POS58` does not exist yet, create it with the Mac mini's detected USB
URI. The current machine used:

```sh
sudo lpadmin -p SFDW_POS58 -E -v "usb://YICHIP3121/POS-58%20Printer?serial=B120300001" -m "/Library/Printers/PPDs/Contents/Resources/POS-58.ppd.gz"
```

Only reuse that URI if the Mac mini reports the same one.

Verify:

```sh
lpstat -p SFDW_POS58
lpstat -v SFDW_POS58
lpq -P SFDW_POS58
```

## Safe First Run

Mock mode, no printer:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
PORT=4180 PRINTER_MODE=mock PRINT_PROFILE_IMAGES=1 node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/test.html
```

Real printer mode:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
PORT=4180 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 PRINT_PROFILE_IMAGES=1 PRINT_COOLDOWN_MS=20000 node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/test.html
```

Do one physical print, then wait 20 seconds before trying another.

## Install Autostart

When mock mode and printer mode are both verified:

```sh
cd "/Users/Shared/SFDW VENDING MACHINE"
ops/install-mac-mini.sh
```

This installs:

```text
com.sfdw.vending-machine
com.sfdw.vending-machine.chrome
```

Verify:

```sh
launchctl print "gui/$(id -u)/com.sfdw.vending-machine"
launchctl print "gui/$(id -u)/com.sfdw.vending-machine.chrome"
curl http://127.0.0.1:4180/health
```

Preferred live URL:

```text
http://127.0.0.1:4180/?printer=service
```

Manual Chrome opener:

```sh
ops/open-kiosk-chrome.sh
```

## Mac Settings

Set these manually on the Mac mini:

- auto-login to the kiosk user
- disable computer sleep
- disable display sleep during the event
- prevent screen saver
- keep Chrome frontmost/fullscreen
- confirm keyboard focus before button testing

## Button

The QT Py/encoder should send Space.

Test order:

1. Open a text field.
2. Press arcade button.
3. Confirm one Space per press.
4. Open `http://127.0.0.1:4180/?printer=mock&input=keyboard&previewFacts=1`.
5. Press button.
6. Only after that, use `http://127.0.0.1:4180/?printer=service`.

## Final Event Check

- service starts after reboot
- Chrome opens production page after reboot
- printer queue is ready
- button sends one Space
- one press equals one animation and one receipt
- repeated rapid presses do not duplicate print jobs
- at least 20 receipts print successfully
