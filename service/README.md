# SFDW Local Printer Service

This service serves the static webapp and receives receipt print requests from
the browser. It is designed for the Mac mini target machine. Mock printing is
still the default when no environment variables are provided, while the current
installation handoff uses the macOS/CUPS queue on port `4180`.

## Start In Mock Mode

```sh
node service/server.mjs
```

Open:

```text
http://127.0.0.1:4174/?printer=service
```

When a person is selected, the browser posts the receipt payload to `POST /print`.
Mock mode prints the formatted receipt text in the terminal.

If the normal macOS Terminal cannot find `node`, use the bundled Codex runtime:

```sh
/Applications/Codex.app/Contents/Resources/node service/server.mjs
```

## Current Production Start Command

The final printer-tested service state uses:

```sh
env PORT=4180 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 PRINT_PROFILE_IMAGES=1 /Applications/Codex.app/Contents/Resources/node service/server.mjs
```

Open:

```text
http://127.0.0.1:4180/production.html
```

## Sync Updated CSV Data

When `data/ppl_facts.csv` changes, regenerate the browser data module:

```sh
/Applications/Codex.app/Contents/Resources/node service/syncPeopleFacts.mjs
```

The sync accepts either `Full Name` or the current `Full Mame` CSV header, and
keeps the full name separate from the nickname used in receipt sentences.

## Sync Figma Profile Images

Profile image PNGs live in:

```text
webapp/assets/receipt-profiles/
```

After replacing those PNGs, rebuild the ESC/POS image chunks used by the printer:

```sh
/Applications/Codex.app/Contents/Resources/node service/buildReceiptProfileImages.mjs
```

Receipt profile images print by default when a matching cache file exists in
`service/receipt-profile-cache/`. To temporarily return to text-only receipts:

```sh
PRINT_PROFILE_IMAGES=0 PRINTER_MODE=lp PRINTER_QUEUE=SFDW_POS58 /Applications/Codex.app/Contents/Resources/node service/server.mjs
```

## Monitor Preview Mode

Two bookmarkable local entrypoints are available when the service is running on
port 4180:

```text
http://127.0.0.1:4180/test.html
http://127.0.0.1:4180/production.html
```

`test.html` opens the current testing version with receipt preview and the
Random/people chooser. `production.html` opens the clean installation version:
no chooser, no receipt preview, randomized selection, and printer service
enabled.

To preview the CSV fun fact on the monitor instead of printing:

```text
http://127.0.0.1:4180/?previewFacts=1
```

To preview the full browser-to-service path while still avoiding the physical
printer:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1
```

The preview panel appears only with `previewFacts=1`. It mirrors the printed
receipt layout: centered full name, nickname intro, role/team, quoted fun fact,
where-to-find sentence, generated go-talk-to sentence, and address footer from
`webapp/data/people-facts.js`, which was derived from `data/ppl_facts.csv`.

To force a specific person for QA, add `forcePerson`:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1&forcePerson=gadi
```

To test all 15 people with clickable roster buttons:

```text
http://127.0.0.1:4180/?printer=service&previewFacts=1&qaRoster=1
```

Click a roster name, then click the vending machine once. The animation will run
and land on that forced person, while the monitor preview shows the corresponding
CSV receipt fields.

Supported person IDs:

```text
jan, henry, dennis, cecilia, kimberly,
gadi, michele, jeff, yoshi, kyu,
stan, yuri, felipe, aidan, anthony
```

Anthony now uses the exported Anthony rolling and selected-card assets.

## Useful Endpoints

```text
GET /health
GET /printer/status
POST /print
```

## Printer Modes

Default:

```sh
PRINTER_MODE=mock node service/server.mjs
```

Save text and ESC/POS bytes to files:

```sh
PRINTER_MODE=file node service/server.mjs
```

Write ESC/POS bytes to a raw device path:

```sh
PRINTER_MODE=raw PRINTER_DEVICE=/dev/cu.PRINTER_NAME node service/server.mjs
```

Send ESC/POS bytes through a macOS/CUPS print queue:

```sh
PRINTER_MODE=lp PRINTER_QUEUE=Printer_Queue_Name node service/server.mjs
```

## Hardware Notes

Printer target:

- Anself 58mm receipt printer.
- Walmart item `5324691970`.
- Listed model family: `POS-5890`.
- USB + Bluetooth.
- ESC/POS command support.
- 58mm paper, about 48mm print width.
- 384 dots per line.
- Font A is listed around 32 characters per line.

Recommended first hardware path:

1. Use USB, not Bluetooth.
2. Plug the printer into the Mac mini.
3. Check whether macOS creates a printer queue, serial device, or both.
4. Try `PRINTER_MODE=file` first to review receipt text.
5. Try `PRINTER_MODE=lp` if macOS has a printer queue.
6. Try `PRINTER_MODE=raw` if the printer exposes a writable serial/raw device.

Profile image printing is now supported through prebuilt ESC/POS image chunks.
When changing receipt image behavior, test with `PRINTER_MODE=mock` or
`PRINTER_MODE=file` before sending another physical print job.
