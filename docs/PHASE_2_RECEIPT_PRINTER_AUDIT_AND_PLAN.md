# Phase 2 Receipt Printer Audit And Plan

Last updated: 2026-06-08

## Purpose

This document audits the current project folder and the migration pack named
`sfdw-vending-machine-migration-2026-06-08.tar.gz`, then turns that context into
a practical Phase 2 plan for getting the receipt printer working after the HTML
prototype is fully accepted.

Phase 2 should preserve the core product invariant:

> One accepted trigger creates one selected result and exactly one receipt print job.

## Sources Audited

Current project folder:

- `PROJECT_SCOPE.md`
- `CHAT_HANDOFF.md`
- `agents/figma-to-webapp-plan.md`
- `agents/hardware-integration-plan.md`
- `agents/orchestration-plan.md`
- `data/ppl_facts.csv`
- `sfdw-vending-machine-migration-2026-06-08.tar.gz`

Migration archive contents:

- Root migration docs:
  - `PROJECT_SCOPE.md`
  - `PROJECT_MANIFEST.md`
  - `CHAT_HANDOFF.md`
  - `MIGRATION_GUIDE.md`
  - `MIGRATION_CONTEXT.md`
  - `MIGRATION_ARTIFACTS.md`
- Figma audits:
  - `FIGMA_03_SCREEN_CONTENT_AUDIT.md`
  - `FIGMA_PROTOTYPE_TIMING_AUDIT.md`
  - `FIGMA_VERTICAL_ROLL_CHASSIS_AUDIT.md`
  - `FIGMA_SELECTED_CARD_PRINT_AUDIT.md`
- Agent plans:
  - `agents/figma-to-webapp-plan.md`
  - `agents/hardware-integration-plan.md`
  - `agents/orchestration-plan.md`
- Static web prototype:
  - `webapp/index.html`
  - `webapp/styles.css`
  - `webapp/app.js`
  - `webapp/README.md`
  - `webapp/assets/`
  - `webapp/tools/clean-card-alpha.mjs`
- Verification screenshots from the Figma-to-webapp work.

Archive verification performed:

- Archive extracted successfully to a temporary audit folder.
- Extracted size: about `9.7M`.
- Extracted file count: `100` files.
- SHA-256: `d90ea091f151fe8b0e6f13bedc45f7a36599ebcbdc30ca51a6b721daf1b64378`.
- `node --check` passed for `webapp/app.js`.

## Current Folder Audit

The live project folder currently contains the planning docs, `data/ppl_facts.csv`,
and the migration archive. It does not currently contain the extracted `webapp/`
folder or the migration-specific docs at the root.

That means the working digital prototype is present in the archive, but not yet
expanded into the current folder. Before Phase 2 implementation begins, the
project should either:

1. Extract the migration archive into the current project folder and keep that as
   the active app source, or
2. Move/copy only the needed `webapp/` and migration docs out of the archive.

Do not start printer implementation against the temporary extraction path. Use a
real project path so scripts, docs, and hardware setup notes are preserved.

## Migration Pack Audit

The migration pack is self-contained for Phase A display work. It includes:

- A static HTML/CSS/JS prototype.
- All rolling card PNG assets.
- All selected-card reveal PNG assets.
- Figma audit notes with node IDs, timing, geometry, and selected-card behavior.
- Agent plans for webapp, orchestration, and hardware.
- Verification screenshots for visual QA.

Asset inventory matches the migration docs:

- `webapp/assets`: `61` files.
- `webapp/assets/cards`: `15` rolling card PNGs.
- `webapp/assets/people`: `15` people/reference PNGs.
- `webapp/assets/selected-cards`: `30` selected-card PNGs.
- Rolling card sample checked as `500 x 500` RGBA PNG.
- Selected-card sample checked as `500 x 500` RGBA PNG.

The prototype is intentionally static:

- No package install is required.
- It can be opened from disk or served with a local static server.
- The prior preview URL was `http://127.0.0.1:4174/?v=selected-card-shake-alpha`.

## Digital Prototype State

The archived webapp currently supports:

- Click trigger.
- Space trigger.
- Enter trigger.
- Equal random selection across 15 visual slots.
- Vertical roll for about `1333ms`.
- `500ms` pause before horizontal selector starts.
- Horizontal selector sweep.
- Selected card reveal at `250 x 250`.
- Two-state selected-card shake loop every `250ms`.
- Mock printer request/completion events.

Important emitted browser events:

- `sfdw:selection-completed`
- `sfdw:printer-print-requested`
- `sfdw:printer-print-completed`

Current receipt payload from `webapp/app.js` includes:

- `receiptId`
- `source`
- `selectedAt`
- `printRequestedAt`
- `personId`
- `displayName`
- `rowIndex`
- `columnIndex`

Current receipt payload does not yet include:

- Team/department.
- Fun fact text.
- Restaurant.
- Interest.
- CMYK answer.
- Hobby.
- Vacation spot.
- Receipt title/footer.
- Print format metadata.

This is the main software gap before real printing: the current bridge can tell
the printer who was selected, but it cannot yet print the fun fact receipt.

## Data Audit

The current folder has `data/ppl_facts.csv`; this file is not included in the
migration archive.

The CSV contains:

- One example row: `Ronald McDonald`.
- Fifteen real people:
  - `Gadi`
  - `Michele`
  - `Jeff`
  - `Yoshi`
  - `Kyu`
  - `Aidan`
  - `Kimberly`
  - `Jan`
  - `Henry`
  - `Dennis`
  - `Cecilia`
  - `Stan`
  - `Yuri`
  - `Anthony`
  - `Felipe`

The archived prototype visual slots are:

- `jan`
- `henry`
- `dennis`
- `cecilia`
- `kimberly`
- `gadi`
- `michele`
- `jeff`
- `yoshi`
- `kyu`
- `stan`
- `yuri`
- `felipe`
- `aidan`
- `mystery`

Mismatch:

- The CSV has `Anthony`.
- The prototype has `mystery`.
- The prototype does not have Anthony rolling-card or selected-card assets.

Decision needed before production printing:

- If Anthony should be one of the real 15 results, replace the `mystery` slot
  with Anthony in the webapp and export Anthony rolling/selected assets.
- If `mystery` should remain as a special wildcard slot, define what receipt
  content it prints.

Encoding note:

- `data/ppl_facts.csv` appears to contain at least one ISO-8859-1 byte, for
  example `Fierro Cafe` with byte `0xE9`.
- Before printing, normalize the CSV to UTF-8 or intentionally transliterate
  receipt output to printer-safe ASCII.
- This matters because low-cost ESC/POS printers often default to limited code
  pages, and accented characters can print incorrectly without explicit handling.

## Figma And Display Constraints Relevant To Printing

The Figma audit establishes that:

- Step 04 is the selected-card reveal.
- Step 05 is the print receipt moment.
- Step 04 and Step 05 are visually very similar.
- Printing should begin when the selected card pops out.
- The selected-card reveal should use the same canonical selected result as the
  receipt payload.

The archived webapp currently preserves the Figma frame size:

- Figma frame: `1440 x 1024`.
- Target TV from project scope: `1920 x 1080`.

Before installing hardware, do one explicit TV framing acceptance pass. The
prototype can remain Figma-faithful, but the event machine should be tested at
the actual `1920 x 1080` display size so the team knows whether side margins or
scaling are acceptable.

## Known Printer Context

Known product:

- Anself 58mm direct thermal receipt printer.
- Walmart item: `5324691970`.
- Product link: `https://www.walmart.com/ip/5324691970`.
- Listed model family: `POS-5890`.
- Listed as USB and Bluetooth.
- 58mm paper.
- Walmart listing says 48mm print width.
- 203 dpi.
- 90mm/s.
- Listed printing density: 384 dots/line.
- Listed Font A width: about 32 characters per line.
- Listed command support: ESC/POS.
- Supports text, images, 1D barcodes, and QR codes according to listing.

Target host:

- Mac mini.
- Use the Mac mini as both the fullscreen browser host and local print-service
  host.
- Start with USB on the Mac mini. Treat Bluetooth as fallback only.

Assumption to verify:

- Likely ESC/POS-compatible, but this must be confirmed with the actual unit.

Recommended first connection path:

- USB first.
- Bluetooth only if USB is impractical.

Why USB first:

- More reliable for an installation.
- No pairing state.
- Fewer reconnect surprises after reboot or printer power-cycle.
- Easier to document and reproduce.

Possible USB appearances:

- OS printer queue.
- USB printer class device such as `/dev/usb/lp*` on Linux.
- USB serial device such as `/dev/ttyUSB*`, `/dev/ttyACM*`, `/dev/cu.*`, or
  `/dev/tty.*`.
- Vendor-specific printer requiring a supplied driver.

## Phase 2 Goal

Build a local receipt-printer path that can:

1. Receive the exact selected result from the webapp.
2. Build a 58mm receipt payload from project data.
3. Print a basic text receipt.
4. Print a wrapped fun fact receipt.
5. Report print success/failure back to the app/service.
6. Preserve mock mode for demos and development.

Phase 2 should not require the physical button. Keep keyboard/click/debug
triggers until printing is stable.

## Recommended Architecture

Use a local control service between the webapp and the printer.

```text
webapp selected result
  -> local control service
  -> receipt formatter
  -> printer adapter
  -> physical receipt printer
```

The webapp should not talk directly to printer hardware. Browser APIs are not a
good fit for reliable kiosk printing, and they make error handling harder.

Recommended service responsibilities:

- Serve or coordinate the static webapp.
- Receive `selection.completed` or `printer.print.requested`.
- Load normalized people/fact data.
- Build `ReceiptPayload`.
- Apply busy lockout.
- Send exactly one print command per `receiptId`.
- Return printer status.
- Log jobs for debugging.
- Preserve a mock adapter.

Suggested adapter boundary:

```ts
type PrinterAdapter = {
  printReceipt(payload: ReceiptPayload): Promise<PrintResult>;
};
```

Start with:

- `MockPrinterAdapter`
- `TextFilePrinterAdapter` or console logger for formatting checks
- `EscPosUsbPrinterAdapter` once hardware details are known

Optional fallback:

- `OsPrintQueueAdapter` if raw ESC/POS is blocked or the printer only behaves
  reliably through the system print queue.

## Data Contract Upgrade

Before hardware work, make the selected result receipt-ready.

Suggested canonical data:

```ts
type PersonFact = {
  personId: string;
  displayName: string;
  team?: string;
  funFact: string;
  restaurant?: string;
  interest?: string;
  cmykColor?: string;
  hobby?: string;
  vacationSpot?: string;
};
```

Suggested receipt payload:

```ts
type ReceiptPayload = {
  receiptId: string;
  source: "sfdw-webapp";
  selectedAt: string;
  printRequestedAt: string;
  personId: string;
  displayName: string;
  team?: string;
  title: string;
  lines: string[];
  rawFact: PersonFact;
};
```

For the first real receipt, keep the print layout text-first:

```text
SFDW VENDING MACHINE

You got: Cecilia
Team: XD

Fun fact:
I'm a certified yoga teacher

--
San Francisco Design Week 2026
```

Add QR codes, logos, or image printing only after plain text is reliable.

## Receipt Formatting Plan

Assume a conservative line width until real paper tests:

- 58mm paper.
- About 48mm printable width.
- 203 dpi.
- Start with roughly 32 characters per line.

Formatter requirements:

- Normalize smart quotes, accents, and unsupported glyphs.
- Wrap long lines without splitting words when possible.
- Preserve intentional multiline fields from the CSV.
- Prevent printer-buffer abuse from unexpectedly long text.
- Create a short, readable header.
- Include selected person and one chosen fact first.
- Include optional extra answers only if the receipt remains readable.

Initial content recommendation:

- Header.
- Selected person.
- Team/department if confirmed.
- One fun fact.
- Optional tiny footer.

Do not print every CSV answer by default. The receipt will get long quickly on
58mm paper, especially for Stan and Anthony.

## Implementation Plan

### Step 0: Activate The Migrated Prototype

Goal:

- Put the archived `webapp/` and migration docs in the active project folder.

Tasks:

- Extract or copy the archive contents into the current folder.
- Keep `data/ppl_facts.csv`.
- Verify expected asset counts.
- Run `node --check webapp/app.js`.
- Preview the webapp locally.
- Confirm click/Space/Enter still run the full sequence.

Done when:

- The current folder has the webapp source.
- The prototype runs from the current folder, not a temp extraction.

### Step 1: Normalize Roster And Receipt Data

Goal:

- Make the selected visual slot map cleanly to receipt content.

Tasks:

- Convert `data/ppl_facts.csv` to UTF-8 or create a UTF-8 normalized generated
  JSON file.
- Remove or ignore the example row.
- Generate stable lowercase `personId` values.
- Decide `mystery` vs `anthony`.
- Add missing Anthony assets if Anthony replaces mystery.
- Add tests/checks that every selectable `personId` has receipt data.

Done when:

- Every selectable visual slot has one receipt data record.
- Every receipt data record intended for selection has card assets.

### Step 2: Upgrade The Webapp Print Event

Goal:

- Make the existing browser event suitable for a real print job.

Tasks:

- Add `funFact`, `team`, and receipt title/footer fields to the payload.
- Keep `receiptId`, `personId`, `selectedAt`, and `printRequestedAt`.
- Emit one print request per reveal.
- Keep mock completion behavior for development.
- Add debug logging for the emitted payload.

Done when:

- `sfdw:printer-print-requested` contains enough content to print the receipt.

### Step 3: Add Local Control Service

Goal:

- Create the software process that will own printer communication.

Tasks:

- Add a small local service in Node.js or Python.
- Serve static webapp or run alongside a static server.
- Add endpoint or WebSocket/SSE bridge for print requests.
- Implement a mock printer adapter.
- Implement job lockout by `receiptId`.
- Log print attempts and results.

Recommended first API:

```text
POST /print
POST /trigger
GET /health
GET /printer/status
```

Done when:

- The webapp can send a selected payload to the service.
- The service logs one mock print job and returns success.

### Step 4: Build Receipt Formatter

Goal:

- Produce printer-safe text for 58mm paper.

Tasks:

- Implement text wrapping at a configurable width.
- Normalize unsupported characters.
- Add sample receipts for shortest, typical, and longest facts.
- Test multiline CSV values.
- Save golden sample outputs for review.

Done when:

- We can generate readable plain-text receipts without the printer attached.

### Step 5: Printer Discovery

Goal:

- Learn how the actual printer appears on the chosen installation computer.

Tasks once printer details/hardware are available:

- Record computer OS and version.
- Connect via USB first.
- Identify device:
  - macOS: System Settings Printers, `system_profiler SPUSBDataType`,
    `/dev/tty.*`, `/dev/cu.*`.
  - Linux/Raspberry Pi: `lsusb`, `/dev/usb/lp*`, `/dev/ttyUSB*`,
    `/dev/ttyACM*`, CUPS printer list.
- Try OS print queue test if available.
- Try raw ESC/POS text test if device path supports it.
- Record exact device path, queue name, baud rate if serial, and driver needs.

Done when:

- We know which adapter path is viable: raw ESC/POS, serial ESC/POS, OS print
  queue, or driver-specific workaround.

### Step 6: Hardware Print Adapter

Goal:

- Replace mock print with actual printer output.

Tasks:

- Implement the chosen adapter behind `printReceipt(payload)`.
- Print basic smoke text.
- Print formatted fun fact receipt.
- Add cut/feed behavior if supported.
- Add command timeout.
- Return structured print status.

Done when:

- One selected result prints one readable receipt from the app flow.

### Step 7: Reliability Testing

Goal:

- Make the printer reliable enough for an installation.

Tasks:

- Print at least 20 receipts from software trigger.
- Test longest fact.
- Test power-cycle printer.
- Test service restart.
- Test app refresh.
- Test disconnected printer.
- Test no-paper behavior if detectable.
- Confirm no duplicate prints from rapid repeated triggers.

Done when:

- Failures are understood, logged, and either handled or documented.

## Acceptance Criteria For Phase 2

Phase 2 is complete when:

- The active project folder contains the webapp source and receipt data.
- The selected visual slot maps to exactly one receipt data record.
- The webapp emits a receipt-ready payload after selected-card reveal begins.
- The local service receives print requests.
- Mock print mode still works.
- Real printer mode prints a basic receipt.
- Real printer mode prints at least one wrapped fun fact receipt.
- Duplicate triggers cannot produce duplicate receipts during an active run.
- Printer setup is documented with exact connection path and commands.
- Known printer failure states have reasonable behavior or documented limits.

## Key Risks

- The printer may not be ESC/POS-compatible despite listing claims.
- USB behavior may differ between Mac, mini PC, and Raspberry Pi.
- Bluetooth may be unreliable after reboot or power-cycle.
- Printer status such as paper-out may not be available.
- CSV encoding may print broken characters unless normalized.
- Long fun facts may wrap poorly on 58mm paper.
- Anthony has replaced the old `mystery` slot in the live webapp; keep checking
  future Figma exports and CSV updates so the 15-person roster stays aligned.
- The prototype is built around a `1440 x 1024` Figma frame, while the event TV
  target is `1920 x 1080`.

## Decisions To Make With Printer Details

When printer details arrive, decide:

- Installation computer: Mac, mini PC, Raspberry Pi, or something else.
- Operating system and version.
- USB vs Bluetooth.
- Raw ESC/POS vs OS print queue.
- Whether receipts need only text or also QR/logo/image.
- Whether unsupported characters should be transliterated or printed through a
  specific code page.
- Whether Anthony replaces mystery.
- Final receipt content and order.
- Whether receipt prints immediately on pop-out or after a tiny reveal delay.

## Recommended Next Action

Before the printer arrives, do these software prep tasks:

1. Extract the migration archive into the active project folder. Done on
   2026-06-08 for `webapp/` and migration docs.
2. Merge `data/ppl_facts.csv` into the webapp data model. Started on
   2026-06-08 with `webapp/data/people-facts.js`.
3. Resolve `Anthony` vs `mystery`. Done on 2026-06-08: Anthony is the 15th
   data/person slot, and Anthony rolling/selected-card assets have replaced the
   old `mystery` visual fallback in the live webapp.
4. Upgrade `sfdw:printer-print-requested` to include receipt text. Started on
   2026-06-08; payload now includes `funFact`, `team`, `title`, `footer`, and
   `rawFact`.
5. Add a local service with a mock printer adapter. Started on 2026-06-08 in
   `service/server.mjs`.

Then, when the printer details arrive, Phase 2 can focus on the actual hardware
adapter instead of discovering basic app/data gaps under time pressure.
