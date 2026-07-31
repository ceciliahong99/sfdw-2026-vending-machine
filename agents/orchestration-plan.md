# Orchestration Plan

Last updated: 2026-06-05

## Goal

Connect one trigger input to one visible selection, one receipt payload, one printer command, and one reset cycle. Start with simulated trigger events so the display app and receipt contract can stabilize before physical button and printer hardware are connected.

## Event Flow

1. Trigger arrives from a simulated source: keyboard shortcut, debug button, or `POST /trigger`.
2. Control service validates lockout state and emits `trigger.accepted`.
3. Display app enters `selecting` and runs the card animation.
4. Display app chooses the final result and emits `selection.completed`.
5. Control service builds a receipt payload from the selected result.
6. Control service sends a printer command and emits print status.
7. Display app shows `complete` or `error`.
8. Reset timer returns display and control service to `idle`.

Important rule: duplicate trigger events are ignored from `selecting` through `resetting`.

## Event Interfaces

TypeScript-shaped contracts:

```ts
type TriggerSource = "debug_button" | "keyboard" | "http" | "gpio" | "serial" | "hid";

interface TriggerRequested {
  type: "trigger.requested";
  triggerId: string;
  source: TriggerSource;
  receivedAt: string;
}

interface TriggerAccepted {
  type: "trigger.accepted";
  triggerId: string;
  animationSeed: string;
  acceptedAt: string;
}

interface TriggerRejected {
  type: "trigger.rejected";
  triggerId: string;
  reason: "busy" | "disabled" | "invalid";
  rejectedAt: string;
}

interface SelectionCompleted {
  type: "selection.completed";
  triggerId: string;
  result: SelectedResult;
  completedAt: string;
}

interface SelectedResult {
  resultId: string;
  personId: string;
  displayName: string;
  subtitle?: string;
  funFact: string;
  assetId?: string;
}

interface ReceiptPayload {
  receiptId: string;
  triggerId: string;
  resultId: string;
  printedAt?: string;
  title: string;
  displayName: string;
  subtitle?: string;
  funFact: string;
  footer?: string;
}

interface PrintCommand {
  type: "printer.print";
  receiptId: string;
  payload: ReceiptPayload;
  format: "escpos_text" | "escpos_raster" | "os_print";
}

interface PrintStatus {
  type: "printer.status";
  receiptId: string;
  status: "queued" | "printing" | "printed" | "failed";
  reason?: "printer_offline" | "paper_out" | "command_failed" | "timeout" | "unknown";
  updatedAt: string;
}

interface ResetRequested {
  type: "reset.requested";
  triggerId: string;
  reason: "printed" | "print_failed" | "timeout" | "admin";
  resetAfterMs: number;
}
```

## State Machine

| State | Owner | Entered by | Exits to | Notes |
| --- | --- | --- | --- | --- |
| `idle` | display + control | app boot or reset complete | `selecting` | Simulated and hardware triggers are accepted only here. |
| `selecting` | display | `trigger.accepted` | `selected` | Animation runs with `animationSeed`; trigger lockout is active. |
| `selected` | display | animation lands on result | `printing` | Display emits `selection.completed`; result becomes canonical. |
| `printing` | control | receipt payload is built | `complete` or `error` | Printer command runs once per `receiptId`. |
| `complete` | display + control | `printer.status: printed` | `resetting` | Keep result visible for a configured reveal delay. |
| `error` | display + control | print failure or timeout | `resetting` | Public screen may stay calm; debug/admin view shows details. |
| `resetting` | display + control | `reset.requested` | `idle` | Clear selected result, receipt state, and trigger lockout. |

## Service Boundaries

### Display App

- Renders idle, selecting, selected, printing, complete, and error states.
- Owns animation timing and visual selection.
- Emits `selection.completed` after the final card/fact is known.
- Does not talk directly to printer or hardware button.
- Includes simulated trigger UI in development/admin mode.

### Control Service

- Owns trigger intake, lockout, event fanout, receipt creation, printer command execution, and reset coordination.
- Exposes `POST /trigger` for simulated trigger first.
- Maintains current run context: `triggerId`, `animationSeed`, `resultId`, `receiptId`, status, timestamps.
- Sends events to display over WebSocket or Server-Sent Events.
- Receives `selection.completed` from display over WebSocket or HTTP.

### Printer Adapter

- Starts as a mock adapter that logs `PrintCommand` and returns `printed`.
- Later swaps to ESC/POS over USB/Bluetooth or OS print queue.
- Should be isolated behind one method: `printReceipt(payload): Promise<PrintStatus>`.

### Button Adapter

- Starts unused while simulated trigger is active.
- Later converts GPIO, serial, HID, or USB encoder input into `trigger.requested`.
- Applies hardware debounce before handing events to the control service.

## Simulated Trigger First

Phase A should ship with these trigger paths:

- `POST /trigger` for automated tests and local service checks.
- Keyboard shortcut in the display app, such as Space or Enter.
- Debug button visible only in local/admin mode.

All simulated paths must create the same `TriggerRequested` event used by the future physical button. This keeps hardware integration from changing the display animation, selected result contract, receipt payload, or reset behavior.

## Failure Handling

- Busy trigger: return `409` for `POST /trigger`, emit `trigger.rejected` with `reason: "busy"`, and leave the current run untouched.
- Animation timeout: if no `selection.completed` arrives before the configured deadline, enter `error`, skip printing, and reset after the error delay.
- Missing result data: reject selection, enter `error`, and log the bad `resultId` or payload fields.
- Printer offline or paper out: emit `printer.status: failed`, show debug/admin error state, and reset after a longer delay.
- Printer command timeout: mark the receipt failed and do not retry automatically unless an admin action requests it.
- Service restart: boot into `idle`; do not attempt to recover or reprint an incomplete previous run until persistence is intentionally added.

## Reset Behavior

- After successful print, wait `completeDelayMs` so the visitor can read the selected card.
- After print failure, wait `errorDelayMs`; public display can show a neutral reset state while admin logs preserve details.
- Reset clears current run context, selected result, receipt payload, printer status, and trigger lockout.
- Reset does not clear the people/facts data set or printer configuration.

## Minimal Build Order

1. Implement display state machine with mock event data and local keyboard/debug triggers.
2. Add control service with `POST /trigger`, event fanout, and busy lockout.
3. Have display emit `selection.completed` with a stable `SelectedResult`.
4. Build `ReceiptPayload` from `SelectedResult` and send it to a mock printer adapter.
5. Add reset timing and end-to-end automated checks for trigger to selection to mock print to idle.
6. Replace mock printer with hardware adapter.
7. Replace simulated trigger with button adapter while keeping simulated trigger available for admin testing.
