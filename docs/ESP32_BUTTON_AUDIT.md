# ESP32 Button Audit

Date: 2026-06-10

## Summary

The project is already set up for a USB HID keyboard-style physical button. The
ESP32-S3 should send one Space keypress per arcade-button press. The browser app
already listens for Space/Enter, and the production URL already disables pointer
clicks so the installation is keyboard/button driven.

Live Mac check during this audit:

```text
/dev/cu.usbmodem1020BA0C80681
/Volumes/QTPYS3BOOT
Model: Adafruit QT Py ESP32-S3 (4M Flash, 2M PSRAM)
TinyUF2 Bootloader 0.35.0
```

That means the new board is visible to macOS and is currently in the UF2
bootloader. This is not a code-size problem. The project supports both the
CircuitPython copy-to-drive path and the Arduino IDE upload path.

The upload failure:

```text
Failed to connect to ESP32-S3: No serial data received
```

is not caused by program size. It happens before the sketch runs. In this
project context, the highest-probability causes are:

1. The new board is sitting in UF2 bootloader mode while Arduino/esptool is
   trying to talk to the ROM serial bootloader.
2. The new button wiring is connected to a boot/reset/strapping pin.
3. The button wiring is pulling the input or board power into a bad state during
   reset.
4. The new board is not in ROM bootloader mode during Arduino upload.
5. The new board is not the same flash/PSRAM variant selected in Arduino IDE.
6. The USB cable/adapter/port is charge-only or unstable.

## Current Project Inventory

- `hardware/README.md`
  - Declares the intended board as `QT Py ESP32-S3 (4MB Flash 2MB PSRAM)`.
  - Declares the trigger wiring: button `COM/C -> GND`, button `NO -> A0`,
    button `NC -> unused`.
  - Warns to keep the 12V LED circuit separate from ESP32 GPIO.
  - Recommends the CircuitPython firmware path using
    `hardware/qtpy-esp32s3-button-code.py` as `code.py`.

- `hardware/qtpy-esp32s3-button-code.py`
  - CircuitPython HID firmware.
  - Uses `board.A0` with `digitalio.Pull.UP`.
  - Treats pressed as low.
  - Debounces for 50 ms.
  - Sends `Keycode.SPACE` once on each debounced press.

- `hardware/arduino/qtpy_sfdw_button/qtpy_sfdw_button.ino`
  - Arduino equivalent firmware.
  - Uses `BUTTON_PIN = A0` with `INPUT_PULLUP`.
  - Treats pressed as low.
  - Debounces for 50 ms.
  - Sends `Keyboard.write(' ')` once on each debounced press.

- `webapp/production.html`
  - Redirects to `./?printer=service&input=keyboard`.
  - This means production expects a Space/Enter HID keyboard event.

- `webapp/app.js`
  - Enables keyboard trigger unless `input=pointer`.
  - Disables pointer trigger when `input=keyboard`.
  - Listens for `Space` and `Enter`.
  - Ignores repeated held-key events.
  - Starts a new selection only when the phase is `idle` or `complete`.

- `service/README.md` and `ops/start-event-service.sh`
  - Production service is expected on port `4180`.
  - Printer mode uses macOS/CUPS queue `SFDW_POS58`.
  - `production.html` sends selected receipt payloads to the local service.

## Best ESP32 Setup For This Project

The safest wiring for the current code is:

```text
Arcade microswitch COM/C  -> QT Py GND
Arcade microswitch NO     -> QT Py A0
Arcade microswitch NC     -> unused

Arcade LED + / -          -> separate 12V LED supply only
```

Do not connect the arcade button switch side to:

```text
3V3
5V
12V LED power
BOOT / GPIO0
GPIO46
EN / RST
```

The current firmware uses an internal pull-up. That means `A0` normally reads
high by itself. When the button is pressed, the switch should only short `A0` to
`GND`.

## Fixed Button-Wire Constraint

The arcade-button-side wires do not need to be removable. What matters is where
the other ends land on the ESP32-S3.

Safe fixed wiring for Arduino upload:

```text
Button COM/C -> QT Py GND
Button NO    -> QT Py A0
Button NC    -> unused
```

If the wires are fixed to the button but removable or movable at the QT Py side,
leave the button side alone and move only the QT Py side if needed.

If either switch wire is fixed to any of these QT Py pins, upload can be
unreliable until the ESP-side connection is changed:

```text
BOOT / GPIO0
GPIO46
EN / RST
3V3
5V
any 12V LED terminal
```

The button LED wires are a separate circuit and should not touch the QT Py input
pins.

## Exact Recovery Steps For The New Board: Arduino IDE Preferred

Use this when you want the faster Arduino IDE workflow:

1. Confirm the fixed button wiring lands on `GND` and `A0`, not on `BOOT`,
   `GPIO46`, `EN/RST`, `3V3`, `5V`, or LED power.
2. Do not press or hold the arcade button during upload.
3. In Arduino IDE, select:

```text
Board: Adafruit QT Py ESP32-S3 4M Flash 2M PSRAM
Port: /dev/cu.usbmodem1020BA0C80681
```

4. If the board is showing `QTPYS3BOOT`, press `RESET` once to try to leave UF2
   bootloader mode.
5. Start upload.
6. If upload stalls at `Connecting...`, manually enter ROM bootloader:
   - Hold the QT Py `BOOT` / `DFU` button.
   - Tap `RESET`.
   - Keep holding `BOOT` while Arduino IDE is connecting.
   - Release `BOOT` once writing begins.
   - After upload completes, press `RESET` once.

If this still fails while the button is wired to `A0/GND`, the next likely
causes are USB cable/adapter instability or an Arduino IDE board/port mismatch.

Pressing `RESET` while `QTPYS3BOOT` is mounted will eject the `QTPYS3BOOT` drive
from macOS. This is expected: the board is rebooting out of the UF2 bootloader.
After that, re-check Arduino IDE's Port menu because the serial port can change.
During this audit it changed from:

```text
/dev/cu.usbmodem1020BA0C80681
```

to:

```text
/dev/cu.usbmodem14601
```

Important: Arduino IDE can show the board as connected while the board is still
mounted as `QTPYS3BOOT`. That only proves USB enumeration. It does not prove
that esptool can talk to the ESP32-S3 ROM downloader. For Arduino upload, the
board must answer esptool during the `Connecting...` phase.

Known live state from this audit:

```text
/Volumes/QTPYS3BOOT is mounted
/dev/cu.usbmodem1020BA0C80681 exists
No other process is holding the serial port
```

So the exact next physical action is the manual `BOOT/DFU` + `RESET` timing
above.

## CircuitPython Alternative

Because this board is already showing `QTPYS3BOOT`, this route is still
available if Arduino upload keeps failing:

1. Confirm the fixed button wiring lands on safe pins, ideally `A0` and `GND`.
2. Leave the board mounted as `QTPYS3BOOT`.
3. Drag the correct CircuitPython UF2 for `Adafruit QT Py ESP32-S3 4M Flash /
   2M PSRAM` onto `QTPYS3BOOT`.
4. Wait for the board to reboot and mount as `CIRCUITPY`.
5. Copy `hardware/qtpy-esp32s3-button-code.py` to `CIRCUITPY/code.py`.
6. Copy the `adafruit_hid` library folder into `CIRCUITPY/lib/`.
7. Test in a plain text field before opening the production printer URL.

The project has already documented a known-good UF2:

```text
https://downloads.circuitpython.org/bin/adafruit_qtpy_esp32s3_4mbflash_2mbpsram/en_US/adafruit-circuitpython-adafruit_qtpy_esp32s3_4mbflash_2mbpsram-en_US-9.2.8.uf2
```

## Why The Old Board Worked

The old board likely already had one of these working states:

- Correct firmware already loaded.
- Correct board variant selected.
- Bootloader/USB state already healthy.
- Button wired to `A0` and `GND`, not to a boot/reset pin.

The new board can be the same model and still fail if it is fresh, blank,
holding the wrong boot pin state, connected through a different cable/adapter,
or wired before the first upload.

## Final Validation Order

1. Upload or copy firmware with no button connected.
2. Open a text field and confirm the board itself appears as a keyboard.
3. Momentarily connect `A0` to `GND` with a jumper. It should type one Space.
4. Wire arcade switch `COM -> GND` and `NO -> A0`.
5. Press the arcade button in a text field. It should type one Space.
6. Test with:

```text
http://127.0.0.1:4180/?printer=mock&input=keyboard
```

7. Only after that, test:

```text
http://127.0.0.1:4180/production.html
```

The production URL can send real print jobs.

## Reference Notes

- Espressif documents `GPIO0` as the bootloader select pin for ESP32-S3: low on
  reset enters serial bootloader; high runs the program.
- Espressif documents `GPIO46` as needing to be floating or low to enter the
  serial bootloader.
- Adafruit documents the QT Py ESP32-S3 boot button as ROM bootloader entry and
  notes it can also be read as GPIO0.
- Adafruit documents the correct Arduino board menu entry for this project as
  `Adafruit QT Py ESP32-S3 4M Flash 2M PSRAM`.
