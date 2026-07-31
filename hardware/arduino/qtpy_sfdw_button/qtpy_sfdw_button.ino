#include "USB.h"
#include "USBHIDKeyboard.h"

USBHIDKeyboard Keyboard;

const int BUTTON_PIN = A0;
const unsigned long DEBOUNCE_MS = 50;

bool stablePressed = false;
bool lastRawPressed = false;
unsigned long lastChangeMs = 0;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Keyboard.begin();
  USB.begin();
}

void loop() {
  const bool rawPressed = digitalRead(BUTTON_PIN) == LOW;
  const unsigned long nowMs = millis();

  if (rawPressed != lastRawPressed) {
    lastRawPressed = rawPressed;
    lastChangeMs = nowMs;
  }

  if (rawPressed != stablePressed && nowMs - lastChangeMs >= DEBOUNCE_MS) {
    stablePressed = rawPressed;

    if (stablePressed) {
      Keyboard.write(' ');
    }
  }

  delay(5);
}
