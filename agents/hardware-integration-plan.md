# Hardware Integration Plan

Owner scope: receipt printer and physical button integration for the SFDW vending machine.

## Integration Goal

One physical button press should trigger exactly one app selection and exactly one printed receipt. The display app should stay browser-based, while a local control service handles hardware I/O:

- Button input -> local service -> app trigger event.
- App selected result -> local service -> receipt print command.
- Local service owns debounce, lockout, retry/error handling, and setup diagnostics.

## Receipt Printer Plan

Known device: Anself 58mm direct thermal receipt printer, listed with USB and Bluetooth, 58mm paper, 48mm print width, 203 dpi, and support for text/images/barcodes/QR.

### Protocol Assumptions To Verify

- Likely protocol: ESC/POS-compatible commands.
- USB may appear as one of:
  - USB printer class device, usable through an OS print queue or raw device write.
  - USB serial device, often requiring a serial driver and direct ESC/POS writes.
  - Vendor-specific USB device requiring a supplied driver.
- Bluetooth may appear as:
  - Bluetooth SPP/serial port, usable for ESC/POS writes.
  - Bluetooth printer profile exposed through the OS print system.
- Character encoding may default to a limited code page. Verify UTF-8, accented characters, and any special glyphs needed for receipts.
- Image and QR support may require ESC/POS raster/image commands, not plain text.
- Cash-drawer/status commands may not be supported even if common ESC/POS libraries expose them.

### Recommended First Path

Start with USB. It is usually more reliable for an installation than Bluetooth and avoids pairing, reconnect, and interference issues.

1. Plug printer into the installation computer.
2. Identify how the OS sees it:
   - macOS: System Settings printer list, `system_profiler SPUSBDataType`, and `/dev/tty.*` or `/dev/cu.*`.
   - Linux/Raspberry Pi: `lsusb`, `/dev/usb/lp*`, `/dev/ttyUSB*`, `/dev/ttyACM*`, and CUPS printer list.
3. Try a basic OS print queue test.
4. Try a raw ESC/POS text test.
5. Choose the simpler stable path:
   - OS print queue if formatting is reliable and deployment is straightforward.
   - Direct ESC/POS if raw control, QR/image support, or queue behavior matters.

### Bluetooth Option

Use Bluetooth only as a fallback or if USB cabling is impractical.

- Pair once on the installation computer and document the exact paired device name.
- Verify whether pairing creates a serial port or an OS printer.
- Run a 20-print reliability test after reboot and after printer power-cycle.
- Avoid Bluetooth if reconnect requires manual user interaction.

### Receipt Format

Keep the first production receipt text-first:

- Header: `SFDW Vending Machine`
- Selected person/name
- Fun fact
- Optional timestamp or short event label
- Optional QR code only after plain-text printing is stable

Target line width should be tested on real paper. For 58mm paper / 48mm print width, assume roughly 32 characters per line at common thermal-printer font size until verified.

## Physical Button Plan

Known device: EG STARTS 4 inch / 100mm illuminated arcade button. The button likely includes a microswitch plus a separate 12V LED circuit.

### Wiring Assumptions To Verify

- Microswitch terminals are likely `COM`, `NO`, and `NC`.
- Use `COM` + `NO` so a press closes the circuit.
- LED terminals are likely separate from the switch and require 12V DC.
- The switch side should connect only to the chosen input interface voltage, commonly 3.3V or 5V depending on the controller.
- Do not put 12V LED power into Raspberry Pi GPIO, microcontroller GPIO, or USB encoder switch inputs.

### Interface Options

Recommended simplest option: USB arcade encoder.

- Pros: presents as a USB keyboard/gamepad, no GPIO code, works on Mac/mini PC/Raspberry Pi, easy replacement.
- Cons: may need key mapping; app/service must ignore repeated/held key events.
- Setup: wire microswitch `COM` and `NO` to one encoder input; configure/listen for that key or button code.

Alternative: microcontroller as USB HID.

- Examples: Arduino Leonardo/Micro, Raspberry Pi Pico, Adafruit QT Py.
- Pros: reliable debouncing, custom HID key, can also drive LED patterns with extra circuitry.
- Cons: requires firmware and one more component to maintain.
- Setup: microswitch input with pull-up/pull-down; firmware sends one HID keypress per debounced press.

Alternative: Raspberry Pi GPIO.

- Pros: direct integration if the kiosk computer is a Raspberry Pi.
- Cons: not portable to Mac/mini PC; must protect GPIO and handle pull-ups/debounce carefully.
- Setup: switch to GPIO input and ground using internal pull-up; LED powered from separate 12V supply.

Not recommended: direct browser access to the physical button. Keep hardware input in the local service, then notify the app over WebSocket/SSE or a local HTTP trigger.

### Debounce And Lockout

- Debounce button input for 50-100 ms.
- Treat a held button as one press.
- Add a state lockout so presses are ignored while app state is `selecting`, `selected`, `printing`, or `complete`.
- Only re-arm once the app has returned to `idle`.
- Log ignored presses during testing to confirm lockout behavior.

## Test Sequence

1. Printer discovery
   - Confirm USB and/or Bluetooth device identity.
   - Record OS, connection type, device path or printer queue name.
2. Printer smoke test
   - Print plain text: `SFDW printer test`.
   - Print wrapped multi-line text matching a sample fun fact.
   - Power-cycle printer and repeat.
3. Receipt formatting test
   - Print longest expected name/fun fact.
   - Verify line width, margins, cut/tear behavior, and readable font size.
   - Add QR/image only if required and verify separately.
4. Button electrical test
   - Identify switch and LED terminals with a multimeter.
   - Confirm switch closes only on press.
   - Confirm LED lights from a separate 12V supply.
5. Button input test
   - Connect chosen interface.
   - Confirm one software event per press.
   - Confirm no repeat event while held.
6. Service integration test
   - Press button -> service emits trigger -> display starts animation.
   - Display returns selected result -> service prints receipt.
   - Confirm duplicate presses during animation do not print duplicate receipts.
7. End-to-end soak test
   - Run at least 50 button presses.
   - Include printer power-cycle, app refresh, and service restart.
   - Record failures, missed presses, duplicate prints, and reconnect behavior.

## Risks

- Printer is not actually ESC/POS compatible or requires a vendor driver.
- USB mode differs by operating system, especially between Mac, Linux, and Raspberry Pi.
- Bluetooth pairing may be unreliable after reboot or power loss.
- Thermal paper width/margins may make long facts wrap poorly.
- Printer status/no-paper detection may be unavailable through the chosen protocol.
- Button LED uses 12V while input interface uses 3.3V/5V; accidental cross-wiring can damage hardware.
- Mechanical switch bounce or held presses can create duplicate triggers without debounce and lockout.
- Installation computer choice affects the best hardware path.

## Purchase And Setup Checklist

- Anself 58mm receipt printer.
- Compatible 58mm thermal paper rolls.
- Correct printer power adapter.
- USB cable long enough for final enclosure layout.
- Optional Bluetooth test only if USB is not viable.
- EG STARTS 100mm illuminated arcade button.
- 12V DC power supply for button LED.
- Chosen input interface:
  - Preferred: USB arcade encoder.
  - Alternative: USB HID microcontroller.
  - Alternative: Raspberry Pi GPIO wiring parts if the kiosk computer is a Pi.
- Jumper wires, spade connectors, heat-shrink/electrical tape, and strain relief.
- Multimeter for terminal verification.
- Mounting hardware for button and printer.
- Local service runtime installed on the kiosk computer.
- Printer test script and button listener script checked into the project once implementation begins.

## Open Decisions

- Final kiosk computer: Mac, mini PC, or Raspberry Pi.
- Printer path: OS print queue vs direct ESC/POS.
- Button path: USB arcade encoder vs microcontroller vs GPIO.
- LED behavior: always on, idle-only, pulsing idle, or controlled by app state.
- Receipt content: text-only vs including QR/image/branding.
