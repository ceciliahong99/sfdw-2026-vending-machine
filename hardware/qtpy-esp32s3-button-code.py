import time

import board
import digitalio
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode


DEBOUNCE_SECONDS = 0.05
KEY_TO_SEND = Keycode.SPACE


button = digitalio.DigitalInOut(board.A0)
button.direction = digitalio.Direction.INPUT
button.pull = digitalio.Pull.UP

keyboard = Keyboard(usb_hid.devices)

stable_pressed = False
last_raw_pressed = False
last_change = time.monotonic()


while True:
    raw_pressed = not button.value
    now = time.monotonic()

    if raw_pressed != last_raw_pressed:
        last_raw_pressed = raw_pressed
        last_change = now

    if raw_pressed != stable_pressed and now - last_change >= DEBOUNCE_SECONDS:
        stable_pressed = raw_pressed

        if stable_pressed:
            keyboard.press(KEY_TO_SEND)
            keyboard.release_all()

    time.sleep(0.005)
