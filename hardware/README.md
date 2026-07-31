# SFDW QT Py ESP32-S3 Button Firmware

The Mac currently identifies the board as:

```text
QT Py ESP32-S3 (4MB Flash 2MB PSRAM)
```

The arcade button wiring for the trigger side should be:

```text
Button COM / C  -> QT Py GND
Button NO       -> QT Py A0
Button NC       -> unused
```

The button LED is a separate circuit. Keep LED power separate from A0/GND. Do
not feed 12V LED power into the QT Py GPIO pins.

## Firmware

Use `qtpy-esp32s3-button-code.py` as the QT Py `code.py`.

The firmware uses an internal pull-up on `A0`, so the input is normally high and
goes low when the button connects `A0` to `GND`. Each debounced press sends one
USB HID Space key.

Required CircuitPython library:

```text
adafruit_hid
```

## Safe Test Order

1. Confirm the QT Py appears on USB.
2. Put CircuitPython on the board if needed.
3. Copy `qtpy-esp32s3-button-code.py` to the board as `code.py`.
4. Copy the `adafruit_hid` library folder into `CIRCUITPY/lib/`.
5. Open a plain text field and press the arcade button.
6. Confirm one Space keypress per physical press.
7. Open `http://127.0.0.1:4180/?printer=mock&input=keyboard` and test the
   button without printing.
8. Open `http://127.0.0.1:4180/production.html` only for the final
   end-to-end test, because that path sends to the physical printer.

## If CIRCUITPY Does Not Appear After Dragging UF2

If `QTPYS3BOOT` disappears after copying the CircuitPython UF2 but no
`CIRCUITPY` drive appears:

1. Unplug the QT Py from USB.
2. Wait five seconds.
3. Plug it back in directly, avoiding hubs/adapters if possible.
4. Check whether `CIRCUITPY` appears.
5. If it does not, double-tap reset to return to `QTPYS3BOOT`.
6. Open `INFO_UF2.TXT` on `QTPYS3BOOT` and check the TinyUF2 bootloader version.
7. For CircuitPython 10.x on this 4MB ESP32-S3 board, TinyUF2 must be `0.33.0`
   or later. If the bootloader is older, either install CircuitPython 9.x or
   update TinyUF2 before trying CircuitPython 10.x again.
8. If TinyUF2 is current but 10.x still does not boot to `CIRCUITPY`, use the
   known-good 9.2.8 UF2 for this exact board:
   `https://downloads.circuitpython.org/bin/adafruit_qtpy_esp32s3_4mbflash_2mbpsram/en_US/adafruit-circuitpython-adafruit_qtpy_esp32s3_4mbflash_2mbpsram-en_US-9.2.8.uf2`.
9. If the Mac does not see either `QTPYS3BOOT` or `CIRCUITPY`, try a known-good
   data USB cable and a direct USB port, then repeat the reset double-tap.
