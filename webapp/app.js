import { PEOPLE_FACTS, getPersonFact } from "./data/people-facts.js?v=20260609-where-to-find";

const PROTOTYPE_TIMING = {
  afterDelayMs: 50,
  transitionMs: 62.02129274606705,
  easing: "quick",
  navigation: "CHANGE_TO",
  transitionType: "SMART_ANIMATE",
};

const ROLLING_ASSET_VERSION = "20260605-hires-geometry-mask";
const SELECTED_ASSET_VERSION = "20260605-selected-card-shake-alpha";
const ROW_PITCH = 153;
const CENTER_ROW_OFFSET = 1;
const HORIZONTAL_POSITIONS = [0, 135, 270, 405, 540];
const HORIZONTAL_MIN_LOOPS = 2;
const VERTICAL_ROLL_DURATION_MS = 1333.3333333333333;
const IDLE_ROLL_SPEED_FACTOR = 10;
const IDLE_ROLL_AFTER_DELAY_MS = PROTOTYPE_TIMING.afterDelayMs * IDLE_ROLL_SPEED_FACTOR;
const IDLE_ROLL_TRANSITION_MS = PROTOTYPE_TIMING.transitionMs * IDLE_ROLL_SPEED_FACTOR;
const HORIZONTAL_START_DELAY_MS = 500;
const SELECTED_REVEAL_DELAY_MS = 180;
const SELECTED_CARD_SHAKE_STEP_MS = 250;
const MOCK_PRINT_DURATION_MS = 1400;
const MACHINE_LEFT = 349;
const MACHINE_TOP = 271;
const MACHINE_WIDTH = 742;
const MACHINE_HEIGHT = 481;
const SELECTED_CARD_BASE_SIZE = 250;
const SELECTED_CARD_BASE_LEFT = 595;
const SELECTED_CARD_BASE_TOP = 386;
const PAGE_BACKGROUND = "#e3e3e3";
const FIGMA_IDLE_NUDGE_BODY_SRC = "./assets/figma/nudge-body.svg?v=20260611-figma-idle";
const queryParams = new URLSearchParams(window.location.search);
const PRINT_MODE = queryParams.get("printer") ?? "mock";
const PRINT_ENDPOINT = queryParams.get("printEndpoint") ?? "/print";
const INPUT_MODE = (queryParams.get("input") ?? "keyboard").toLowerCase();
const KEYBOARD_TRIGGER_ENABLED = INPUT_MODE !== "pointer";
const POINTER_TRIGGER_ENABLED = INPUT_MODE === "pointer" || INPUT_MODE === "all";
const PRINT_REARM_DELAY_MS = Number(queryParams.get("printRearmMs") ?? (PRINT_MODE === "service" ? 20000 : 0));
const MACHINE_SCALE = Number(queryParams.get("machineScale") ?? 1.5);
const REQUESTED_IDLE_PROMPT_DELAY_MS = Number(queryParams.get("idlePromptDelayMs") ?? 30000);
const IDLE_PROMPT_DELAY_MS = Math.max(
  30000,
  Number.isFinite(REQUESTED_IDLE_PROMPT_DELAY_MS) ? REQUESTED_IDLE_PROMPT_DELAY_MS : 30000
);
const FACT_PREVIEW_ENABLED = ["1", "true", "yes"].includes(
  (queryParams.get("previewFacts") ?? queryParams.get("factPreview") ?? "").toLowerCase()
);
const ROSTER_QA_ENABLED =
  FACT_PREVIEW_ENABLED || ["1", "true", "yes"].includes((queryParams.get("qaRoster") ?? "").toLowerCase());
const FORCED_PERSON_ID = queryParams.get("forcePerson")?.toLowerCase() ?? "";

const people = {
  jan: {
    name: "Jan",
    cardImage: "./assets/cards/jan.png",
  },
  henry: {
    name: "Henry",
    cardImage: "./assets/cards/henry.png",
  },
  dennis: {
    name: "Dennis",
    cardImage: "./assets/cards/dennis.png",
  },
  cecilia: {
    name: "Cecilia",
    cardImage: "./assets/cards/cecilia.png",
  },
  kimberly: {
    name: "Kimberly",
    cardImage: "./assets/cards/kimberly.png",
  },
  gadi: {
    name: "Gadi",
    cardImage: "./assets/cards/gadi.png",
  },
  michele: {
    name: "Michele",
    cardImage: "./assets/cards/michele.png",
  },
  jeff: {
    name: "Jeff",
    cardImage: "./assets/cards/jeff.png",
  },
  yoshi: {
    name: "Yoshi",
    cardImage: "./assets/cards/yoshi.png",
  },
  kyu: {
    name: "Kyu",
    cardImage: "./assets/cards/kyu.png",
  },
  stan: {
    name: "Stan",
    cardImage: "./assets/cards/stan.png",
  },
  yuri: {
    name: "Yuri",
    cardImage: "./assets/cards/yuri.png",
  },
  felipe: {
    name: "Felipe",
    cardImage: "./assets/cards/felipe.png",
  },
  aidan: {
    name: "Aidan",
    cardImage: "./assets/cards/aidan.png",
  },
  anthony: {
    name: "Anthony",
    cardImage: "./assets/cards/anthony.png",
  },
};

const rowPattern = [
  ["jan", "henry", "dennis", "cecilia", "kimberly"],
  ["gadi", "michele", "jeff", "yoshi", "kyu"],
  ["stan", "yuri", "felipe", "aidan", "anthony"],
];
const selectionSlots = rowPattern.flatMap((rowIds, rowIndex) =>
  rowIds.map((personId, columnIndex) => ({ personId, rowIndex, columnIndex }))
);

const verticalRoll = document.querySelector("[data-reel]");
const strip = document.querySelector("[data-reel-strip]");
const horizontalSelector = document.querySelector("[data-horizontal-selector]");
const machineRevealShade = document.querySelector("[data-machine-reveal-shade]");
const selectedCardStage = document.querySelector("[data-selected-card-stage]");
const selectedCardImages = Array.from(document.querySelectorAll("[data-selected-card-image-state]"));
const factPreview = document.querySelector("[data-fact-preview]");
const factPreviewStatus = document.querySelector("[data-fact-preview-status]");
const factPreviewProfile = document.querySelector("[data-fact-preview-profile]");
const factPreviewName = document.querySelector("[data-fact-preview-name]");
const factPreviewIntro = document.querySelector("[data-fact-preview-intro]");
const factPreviewRole = document.querySelector("[data-fact-preview-role]");
const factPreviewFactTitle = document.querySelector("[data-fact-preview-fact-title]");
const factPreviewFact = document.querySelector("[data-fact-preview-fact]");
const factPreviewWhere = document.querySelector("[data-fact-preview-where]");
const factPreviewCallout = document.querySelector("[data-fact-preview-callout]");
const factPreviewMeta = document.querySelector("[data-fact-preview-meta]");
const rosterQa = document.querySelector("[data-roster-qa]");
const rosterQaCurrent = document.querySelector("[data-roster-qa-current]");
const rosterQaList = document.querySelector("[data-roster-qa-list]");
let reelStep = 0;
let timer = null;
let resetTimer = null;
let horizontalTimer = null;
let autoStopTimer = null;
let horizontalStartTimer = null;
let selectedRevealTimer = null;
let selectedCardShakeTimer = null;
let selectedCardShakeState = 1;
let mockPrintTimer = null;
let idlePromptTimer = null;
let idlePromptLayer = null;
let idleRollTimer = null;
let idleRollResetTimer = null;
let isIdleRollRunning = false;
let isRunning = false;
let phase = "idle";
let centeredRowIndex = CENTER_ROW_OFFSET;
let selectorIndex = 0;
let pendingSelectionTarget = null;
let currentSelection = null;
let currentPrintJob = null;
let nextTriggerAt = 0;
const triggerKeyCodes = new Set(["Space"]);
const activeTriggerKeys = new Set();

function getTriggerKeyId(event) {
  if (triggerKeyCodes.has(event.code)) return event.code;
  if (event.key === " " || event.key === "Spacebar") return "Space";
  if (event.keyCode === 32 || event.which === 32) return "Space";
  return null;
}

function getReceiptProfileImageSrc(personId) {
  return `./assets/receipt-profiles/${personId}.png?v=20260608-profile-roster`;
}

function createCard(personId) {
  const person = people[personId];

  const shell = document.createElement("article");
  shell.className = "person-card-shell";
  shell.dataset.personId = personId;

  const img = document.createElement("img");
  img.className = "card-image";
  img.src = withAssetVersion(person.cardImage, ROLLING_ASSET_VERSION);
  img.alt = person.name;

  shell.append(img);

  return shell;
}

function createRow(rowIds) {
  const row = document.createElement("div");
  row.className = "reel-row";
  rowIds.forEach((personId) => row.append(createCard(personId)));
  return row;
}

function withAssetVersion(src, version) {
  return `${src}?v=${version}`;
}

function scaleFromMachineCenter(value, center, scale) {
  return center + (value - center) * scale;
}

function getScaledMachineBounds() {
  const scale = getResolvedMachineScale();
  const machineCenterX = MACHINE_LEFT + MACHINE_WIDTH / 2;
  const machineCenterY = MACHINE_TOP + MACHINE_HEIGHT / 2;

  return {
    left: scaleFromMachineCenter(MACHINE_LEFT, machineCenterX, scale),
    top: scaleFromMachineCenter(MACHINE_TOP, machineCenterY, scale),
    width: MACHINE_WIDTH * scale,
    height: MACHINE_HEIGHT * scale,
    scale,
  };
}

function getResolvedMachineScale() {
  return Number.isFinite(MACHINE_SCALE) && MACHINE_SCALE > 0 ? MACHINE_SCALE : 1;
}

function applyMachineScale() {
  const scale = getResolvedMachineScale();
  const machineCenterX = MACHINE_LEFT + MACHINE_WIDTH / 2;
  const machineCenterY = MACHINE_TOP + MACHINE_HEIGHT / 2;
  const selectedLeft = scaleFromMachineCenter(SELECTED_CARD_BASE_LEFT, machineCenterX, scale);
  const selectedTop = scaleFromMachineCenter(SELECTED_CARD_BASE_TOP, machineCenterY, scale);

  [verticalRoll, machineRevealShade].forEach((element) => {
    if (!element) return;
    element.style.transform = `scale(${scale})`;
    element.style.transformOrigin = "center center";
  });

  document.documentElement.style.setProperty("--selected-card-size", `${SELECTED_CARD_BASE_SIZE * scale}px`);
  document.documentElement.style.setProperty("--selected-card-final-left", `${selectedLeft}px`);
  document.documentElement.style.setProperty("--selected-card-final-top", `${selectedTop}px`);
}

function applyPageBackground() {
  document.documentElement.style.setProperty("--page-bg", PAGE_BACKGROUND);
}

function ensureIdlePromptStyles() {
  if (document.querySelector("[data-sfdw-idle-prompt-style]")) return;

  const style = document.createElement("style");
  style.dataset.sfdwIdlePromptStyle = "true";
  style.textContent = `
    .sfdw-idle-prompt-layer {
      position: absolute;
      display: none;
      overflow: visible;
      opacity: 0;
      pointer-events: none;
      transition: opacity 240ms ease-out;
      z-index: 9;
    }

    .sfdw-idle-prompt-layer.is-visible {
      opacity: 1;
    }

    .sfdw-idle-prompt-mask {
      position: absolute;
      inset: 0;
      background: rgb(255 255 255 / 85%);
      border-radius: var(--idle-mask-radius, 11px);
    }

    .sfdw-idle-prompt-scene {
      position: absolute;
      width: 276.568px;
      height: 263.128px;
      transform-origin: top left;
    }

    .sfdw-figma-nudge {
      position: absolute;
      left: 47px;
      top: 0;
      width: 229.568px;
      height: 263.128px;
    }

    .sfdw-figma-nudge-body-box {
      position: absolute;
      left: 4.466px;
      top: 31.28px;
      width: 219.455px;
      height: 200.568px;
      display: grid;
      place-items: center;
    }

    .sfdw-figma-nudge-body-rotator {
      width: 200.568px;
      height: 219.455px;
      transform: rotate(90deg);
      flex: none;
    }

    .sfdw-figma-nudge-body {
      display: block;
      width: 100%;
      height: 100%;
    }

    .sfdw-figma-nudge-eye {
      position: absolute;
      left: 83.17px;
      top: 41.008px;
      width: 63.229px;
      height: 63.229px;
    }

    .sfdw-figma-nudge-eye-dot {
      position: absolute;
      left: 13.1px;
      top: 13.132px;
      width: 36.926px;
      height: 36.926px;
      background: #2a2a2a;
      border-radius: 175.731px;
      animation: sfdw-figma-eye-change 3s cubic-bezier(0.2, 0, 0, 1) infinite;
    }

    .sfdw-idle-button-base {
      position: absolute;
      left: 0;
      top: 201px;
      width: 66px;
      height: 30px;
      background: #6a6a6a;
      border-radius: 5px 5px 0 0;
    }

    .sfdw-idle-button-top {
      position: absolute;
      left: 9.24px;
      top: 182px;
      width: 47.52px;
      height: 18px;
      background: red;
      border-radius: 3px 3px 0 0;
    }

    @keyframes sfdw-figma-eye-change {
      0%,
      33.33%,
      100% {
        left: 13.1px;
        top: 13.132px;
        width: 36.926px;
        height: 36.926px;
      }

      58.13%,
      58.18% {
        left: 13.13px;
        top: 25.307px;
        width: 36.941px;
        height: 12.646px;
      }

      66.43%,
      91.67% {
        left: 13.13px;
        top: 13.641px;
        width: 36.941px;
        height: 35.996px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sfdw-figma-nudge-eye-dot {
        animation: none !important;
      }
    }
  `;
  document.head.append(style);
}

function ensureIdlePromptLayer() {
  if (idlePromptLayer) return idlePromptLayer;

  const frame = document.querySelector(".figma-frame");
  if (!frame) return null;

  ensureIdlePromptStyles();

  const layer = document.createElement("div");
  layer.className = "sfdw-idle-prompt-layer";
  layer.dataset.idlePromptLayer = "true";
  layer.setAttribute("aria-hidden", "true");

  const mask = document.createElement("div");
  mask.className = "sfdw-idle-prompt-mask";

  const scene = document.createElement("div");
  scene.className = "sfdw-idle-prompt-scene";

  const nudge = document.createElement("div");
  nudge.className = "sfdw-figma-nudge";

  const bodyBox = document.createElement("div");
  bodyBox.className = "sfdw-figma-nudge-body-box";

  const bodyRotator = document.createElement("div");
  bodyRotator.className = "sfdw-figma-nudge-body-rotator";

  const bodyImage = document.createElement("img");
  bodyImage.className = "sfdw-figma-nudge-body";
  bodyImage.src = FIGMA_IDLE_NUDGE_BODY_SRC;
  bodyImage.alt = "";
  bodyImage.decoding = "async";
  bodyImage.draggable = false;

  const eye = document.createElement("div");
  eye.className = "sfdw-figma-nudge-eye";

  const eyeDot = document.createElement("div");
  eyeDot.className = "sfdw-figma-nudge-eye-dot";

  const buttonBase = document.createElement("div");
  buttonBase.className = "sfdw-idle-button-base";

  const buttonTop = document.createElement("div");
  buttonTop.className = "sfdw-idle-button-top";

  bodyRotator.append(bodyImage);
  bodyBox.append(bodyRotator);
  eye.append(eyeDot);
  nudge.append(bodyBox, eye);
  scene.append(nudge, buttonBase, buttonTop);
  layer.append(mask, scene);
  frame.append(layer);
  idlePromptLayer = layer;
  layoutIdlePromptLayer();

  return idlePromptLayer;
}

function layoutIdlePromptLayer() {
  const layer = ensureIdlePromptLayer();
  if (!layer) return;

  const { left, top, width, height, scale } = getScaledMachineBounds();
  const scene = layer.querySelector(".sfdw-idle-prompt-scene");

  layer.style.left = `${left}px`;
  layer.style.top = `${top}px`;
  layer.style.width = `${width}px`;
  layer.style.height = `${height}px`;
  layer.style.setProperty("--idle-mask-radius", `${11 * scale}px`);

  if (scene) {
    scene.style.left = `${38 * scale}px`;
    scene.style.top = `${228 * scale}px`;
    scene.style.transform = `scale(${scale})`;
  }
}

function restartIdlePromptAnimation(layer) {
  const eyeDot = layer.querySelector(".sfdw-figma-nudge-eye-dot");
  if (!eyeDot) return;

  eyeDot.style.animation = "none";
  eyeDot.offsetHeight;
  eyeDot.style.animation = "";
}

function clearIdlePromptTimer() {
  if (idlePromptTimer) window.clearTimeout(idlePromptTimer);
  idlePromptTimer = null;
}

function concealSelectedCardForIdle() {
  stopSelectedCardShake();
  hideHorizontalSelector();
  machineRevealShade.classList.remove("is-visible");
  machineRevealShade.setAttribute("aria-hidden", "true");
  selectedCardStage.classList.remove("is-visible");
  selectedCardStage.setAttribute("aria-hidden", "true");
}

function showIdlePrompt() {
  clearIdlePromptTimer();

  if (phase === "verticalRolling" || phase === "horizontalSelecting" || phase === "chosen" || phase === "rowStopped") {
    return;
  }

  const layer = ensureIdlePromptLayer();
  if (!layer) return;

  concealSelectedCardForIdle();
  layoutIdlePromptLayer();
  layer.style.display = "block";
  restartIdlePromptAnimation(layer);
  layer.setAttribute("aria-hidden", "false");
  layer.offsetHeight;
  layer.classList.add("is-visible");
  startIdleBackgroundRoll();
  phase = "idlePrompt";
}

function hideIdlePrompt() {
  stopIdleBackgroundRoll();
  if (!idlePromptLayer) return;

  idlePromptLayer.classList.remove("is-visible");
  idlePromptLayer.setAttribute("aria-hidden", "true");
  idlePromptLayer.style.display = "none";
}

function scheduleIdlePrompt() {
  clearIdlePromptTimer();
  if (!Number.isFinite(IDLE_PROMPT_DELAY_MS) || IDLE_PROMPT_DELAY_MS <= 0) return;

  idlePromptTimer = window.setTimeout(showIdlePrompt, IDLE_PROMPT_DELAY_MS);
}

function getSelectedCardImageSrc(personId, state) {
  const assetId = people[personId]?.assetId ?? personId;
  return withAssetVersion(`./assets/selected-cards/${assetId}-state-${state}.png`, SELECTED_ASSET_VERSION);
}

function preloadSelectedCardAssets() {
  Object.keys(people).forEach((personId) => {
    [1, 2].forEach((state) => {
      const img = new Image();
      img.src = getSelectedCardImageSrc(personId, state);
    });
  });
}

function renderReel() {
  const rows = [...rowPattern, ...rowPattern];
  rows.forEach((rowIds) => strip.append(createRow(rowIds)));
}

function setReelTransform(step, animated = true, transitionMs = PROTOTYPE_TIMING.transitionMs) {
  strip.style.transition = animated
    ? `transform ${transitionMs}ms cubic-bezier(0.2, 0, 0, 1)`
    : "none";
  strip.style.transform = `translate3d(0, ${step * -ROW_PITCH}px, 0)`;
}

function getCurrentReelStep() {
  const matrix = new DOMMatrixReadOnly(window.getComputedStyle(strip).transform);
  const rawStep = Math.round(Math.abs(matrix.m42) / ROW_PITCH);
  return rawStep % rowPattern.length;
}

function getCenteredRowIndex(step = reelStep) {
  return (step + CENTER_ROW_OFFSET) % rowPattern.length;
}

function getReelStepForCenteredRow(rowIndex) {
  return (rowIndex - CENTER_ROW_OFFSET + rowPattern.length) % rowPattern.length;
}

function clearIdleRollTimers() {
  if (idleRollTimer) window.clearTimeout(idleRollTimer);
  if (idleRollResetTimer) window.clearTimeout(idleRollResetTimer);
  idleRollTimer = null;
  idleRollResetTimer = null;
}

function advanceIdleReel() {
  reelStep += 1;
  setReelTransform(reelStep, true, IDLE_ROLL_TRANSITION_MS);

  if (reelStep === rowPattern.length) {
    if (idleRollResetTimer) window.clearTimeout(idleRollResetTimer);
    idleRollResetTimer = window.setTimeout(() => {
      idleRollResetTimer = null;
      if (!isIdleRollRunning) return;
      reelStep = 0;
      setReelTransform(0, false);
      strip.offsetHeight;
      strip.style.transition = "";
    }, IDLE_ROLL_TRANSITION_MS + 1);
  }
}

function scheduleIdleRollTick() {
  if (!isIdleRollRunning) return;

  idleRollTimer = window.setTimeout(() => {
    idleRollTimer = null;
    if (!isIdleRollRunning) return;

    advanceIdleReel();
    idleRollTimer = window.setTimeout(scheduleIdleRollTick, IDLE_ROLL_TRANSITION_MS);
  }, IDLE_ROLL_AFTER_DELAY_MS);
}

function startIdleBackgroundRoll() {
  if (isIdleRollRunning) return;

  isIdleRollRunning = true;
  scheduleIdleRollTick();
}

function stopIdleBackgroundRoll() {
  if (!isIdleRollRunning && !idleRollTimer && !idleRollResetTimer) return;

  isIdleRollRunning = false;
  clearIdleRollTimers();
  reelStep = getCurrentReelStep();
  centeredRowIndex = getCenteredRowIndex(reelStep);
  setReelTransform(reelStep, false);
}

function createRandomSelectionTarget() {
  const forcedTarget = getSelectionTargetByPersonId(FORCED_PERSON_ID);
  if (forcedTarget) return forcedTarget;

  return { ...selectionSlots[Math.floor(Math.random() * selectionSlots.length)] };
}

function getSelectionTargetByPersonId(personId) {
  if (!personId) return null;

  for (let rowIndex = 0; rowIndex < rowPattern.length; rowIndex += 1) {
    const columnIndex = rowPattern[rowIndex].indexOf(personId);
    if (columnIndex >= 0) {
      return {
        personId,
        rowIndex,
        columnIndex,
      };
    }
  }

  return null;
}

function advanceReel() {
  reelStep += 1;
  setReelTransform(reelStep, true);

  if (reelStep === rowPattern.length) {
    if (resetTimer) window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      resetTimer = null;
      if (!isRunning) return;
      reelStep = 0;
      setReelTransform(0, false);
      strip.offsetHeight;
      strip.style.transition = "";
    }, PROTOTYPE_TIMING.transitionMs + 1);
  }
}

function scheduleNextTick() {
  if (!isRunning) return;

  timer = window.setTimeout(() => {
    advanceReel();

    timer = window.setTimeout(() => {
      scheduleNextTick();
    }, PROTOTYPE_TIMING.transitionMs);
  }, PROTOTYPE_TIMING.afterDelayMs);
}

function startVerticalRoll() {
  if (isRunning) return;
  isRunning = true;
  scheduleNextTick();
}

function stopVerticalRoll(targetRowIndex = null) {
  isRunning = false;
  if (timer) window.clearTimeout(timer);
  if (resetTimer) window.clearTimeout(resetTimer);
  if (autoStopTimer) window.clearTimeout(autoStopTimer);
  if (horizontalStartTimer) window.clearTimeout(horizontalStartTimer);
  timer = null;
  resetTimer = null;
  autoStopTimer = null;
  horizontalStartTimer = null;
  reelStep = Number.isInteger(targetRowIndex) ? getReelStepForCenteredRow(targetRowIndex) : getCurrentReelStep();
  centeredRowIndex = getCenteredRowIndex(reelStep);
  setReelTransform(reelStep, false);
  phase = "rowStopped";
}

function setSelectorPosition(index, animated = true) {
  selectorIndex = index % HORIZONTAL_POSITIONS.length;
  horizontalSelector.style.transition = animated
    ? `transform ${PROTOTYPE_TIMING.transitionMs}ms cubic-bezier(0.2, 0, 0, 1), opacity 90ms ease-out`
    : "opacity 90ms ease-out";
  horizontalSelector.style.transform = `translate3d(${HORIZONTAL_POSITIONS[selectorIndex]}px, 0, 0)`;
}

function hideHorizontalSelector() {
  horizontalSelector.classList.remove("is-visible", "is-chosen");
  if (horizontalTimer) window.clearTimeout(horizontalTimer);
  horizontalTimer = null;
}

function hideSelectedCard() {
  clearIdlePromptTimer();
  hideIdlePrompt();
  stopSelectedCardShake();
  machineRevealShade.classList.remove("is-visible");
  machineRevealShade.setAttribute("aria-hidden", "true");
  selectedCardStage.classList.remove("is-visible");
  selectedCardStage.setAttribute("aria-hidden", "true");
  delete selectedCardStage.dataset.personId;
  delete selectedCardStage.dataset.receiptId;
  delete selectedCardStage.dataset.printStatus;
  delete selectedCardStage.dataset.shakeState;
  selectedCardImages.forEach((image) => {
    image.classList.remove("is-active");
    image.removeAttribute("src");
    image.alt = "";
  });
  if (selectedRevealTimer) window.clearTimeout(selectedRevealTimer);
  if (mockPrintTimer) window.clearTimeout(mockPrintTimer);
  selectedRevealTimer = null;
  mockPrintTimer = null;
  currentPrintJob = null;
  resetFactPreview();
}

function setSelectedCardShakeState(state) {
  selectedCardShakeState = state;
  selectedCardStage.dataset.shakeState = String(state);
  selectedCardImages.forEach((image) => {
    image.classList.toggle("is-active", image.dataset.selectedCardImageState === String(state));
  });
}

function stopSelectedCardShake() {
  if (selectedCardShakeTimer) window.clearInterval(selectedCardShakeTimer);
  selectedCardShakeTimer = null;
}

function startSelectedCardShake(personId) {
  const person = people[personId];
  stopSelectedCardShake();

  selectedCardImages.forEach((image) => {
    const state = Number(image.dataset.selectedCardImageState);
    image.src = getSelectedCardImageSrc(personId, state);
    image.alt = person.name;
  });

  setSelectedCardShakeState(1);
  selectedCardShakeTimer = window.setInterval(() => {
    setSelectedCardShakeState(selectedCardShakeState === 1 ? 2 : 1);
  }, SELECTED_CARD_SHAKE_STEP_MS);
}

function getSelectedCardOrigin(selection) {
  const centeredDomRowIndex = reelStep + CENTER_ROW_OFFSET;
  const centeredRow = strip.children[centeredDomRowIndex];
  const selectedShell = centeredRow?.children[selection.columnIndex];
  const frame = document.querySelector(".figma-frame");

  if (!selectedShell || !frame) {
    return { x: 595, y: 386 };
  }

  const frameRect = frame.getBoundingClientRect();
  const shellRect = selectedShell.getBoundingClientRect();
  const scale = frameRect.width / 1440;

  return {
    x: (shellRect.left - frameRect.left) / scale,
    y: (shellRect.top - frameRect.top) / scale,
  };
}

function sentenceWithNickname(nickname, sentence) {
  const name = String(nickname ?? "").trim();
  const text = String(sentence ?? "").trim();
  if (!name || !text) return text;
  if (text.toLowerCase().startsWith(name.toLowerCase())) return text;

  const softened = text.replace(/^Will\b/, "will").replace(/^Is\b/, "is");
  return `${name} ${softened}`;
}

function createReceiptPayload(selection) {
  const person = people[selection.personId];
  const fact = getPersonFact(selection.personId);
  const timestamp = new Date().toISOString();
  const nickname = fact?.nickname ?? person.name;
  const fullName = fact?.fullName ?? fact?.displayName ?? person.name;
  const displayName = fullName;
  const team = fact?.team ?? "";
  const role = fact?.role ?? "";
  const roleWithTeam = fact?.roleWithTeam ?? (team && selection.personId !== "gadi" ? `${role} (${team})` : role);
  const funFact = fact?.funFact ?? "";
  const whereToFind = fact?.whereToFind ?? "";
  const whereToFindLine = fact?.whereToFindLine ?? sentenceWithNickname(nickname, whereToFind);
  const firstName = fact?.firstName ?? nickname;
  const callToAction = fact?.callToAction ?? `Wanna know more? Go talk to ${firstName}!`;

  return {
    receiptId: `receipt-${timestamp}-${selection.personId}`,
    source: "sfdw-webapp",
    selectedAt: selection.selectedAt,
    printRequestedAt: timestamp,
    personId: selection.personId,
    displayName,
    fullName,
    nickname,
    profileImage: getReceiptProfileImageSrc(selection.personId),
    team,
    role,
    roleWithTeam,
    funFact,
    whereToFind,
    whereToFindLine,
    firstName,
    introLine: `${nickname} is...`,
    callToAction,
    title: "New Deal Design",
    address: "333 Bryant St #190",
    footer: "<3",
    rawFact: fact,
    rowIndex: selection.rowIndex,
    columnIndex: selection.columnIndex,
  };
}

function initializeFactPreview() {
  if (!factPreview || !FACT_PREVIEW_ENABLED) return;

  factPreview.classList.add("is-enabled");
  factPreview.setAttribute("aria-hidden", "false");
  resetFactPreview();
}

function resetFactPreview() {
  if (!factPreview || !FACT_PREVIEW_ENABLED) return;

  factPreviewStatus.textContent = FORCED_PERSON_ID
    ? `Waiting for ${FORCED_PERSON_ID}`
    : "Waiting for selection";
  factPreviewProfile.hidden = true;
  factPreviewProfile.removeAttribute("src");
  factPreviewProfile.alt = "";
  factPreviewName.textContent = "--";
  factPreviewIntro.textContent = "";
  factPreviewRole.textContent = "";
  factPreviewFactTitle.textContent = "Fun fact...";
  factPreviewFact.textContent = "Select a card to preview its receipt data.";
  factPreviewWhere.textContent = "";
  factPreviewCallout.textContent = "";
  factPreviewMeta.textContent = PRINT_MODE === "service" ? "Service mode: /print mock preview" : "Monitor preview only";
}

function updateFactPreview(receiptPayload, status = "Selected") {
  if (!factPreview || !FACT_PREVIEW_ENABLED) return;

  factPreviewStatus.textContent = status;
  if (receiptPayload.profileImage) {
    factPreviewProfile.hidden = false;
    factPreviewProfile.src = receiptPayload.profileImage;
    factPreviewProfile.alt = `${receiptPayload.nickname || receiptPayload.displayName} profile`;
  } else {
    factPreviewProfile.hidden = true;
    factPreviewProfile.removeAttribute("src");
    factPreviewProfile.alt = "";
  }
  factPreviewName.textContent = receiptPayload.fullName || receiptPayload.displayName;
  factPreviewIntro.textContent = receiptPayload.introLine || `${receiptPayload.nickname || receiptPayload.firstName} is...`;
  factPreviewRole.textContent = receiptPayload.roleWithTeam || receiptPayload.role || receiptPayload.team || "";
  factPreviewFactTitle.textContent = `Fun fact about ${receiptPayload.nickname || receiptPayload.firstName || receiptPayload.displayName}...`;
  factPreviewFact.textContent = receiptPayload.funFact || "No CSV fun fact found for this selection.";
  factPreviewWhere.textContent = receiptPayload.whereToFindLine || "";
  factPreviewCallout.textContent = receiptPayload.callToAction || "";
  factPreviewMeta.textContent = `${receiptPayload.personId} / ${receiptPayload.receiptId}`;
}

function initializeRosterQa() {
  if (!rosterQa || !rosterQaList || !ROSTER_QA_ENABLED) return;

  rosterQa.classList.add("is-enabled");
  rosterQa.setAttribute("aria-hidden", "false");
  rosterQaCurrent.textContent = FORCED_PERSON_ID ? `Forced: ${FORCED_PERSON_ID}` : "Random mode";
  rosterQaList.replaceChildren();

  const randomParams = new URLSearchParams(window.location.search);
  randomParams.set("previewFacts", "1");
  randomParams.delete("forcePerson");

  const randomLink = document.createElement("a");
  randomLink.className = "roster-qa-link";
  randomLink.classList.toggle("is-active", !FORCED_PERSON_ID);
  randomLink.href = `${window.location.pathname}?${randomParams.toString()}`;
  randomLink.textContent = "Random";
  rosterQaList.append(randomLink);

  PEOPLE_FACTS.forEach((person) => {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set("previewFacts", "1");
    nextParams.set("qaRoster", "1");
    nextParams.set("forcePerson", person.personId);

    const link = document.createElement("a");
    link.className = "roster-qa-link";
    link.classList.toggle("is-active", person.personId === FORCED_PERSON_ID);
    link.href = `${window.location.pathname}?${nextParams.toString()}`;
    link.textContent = person.nickname || person.displayName;
    rosterQaList.append(link);
  });
}

async function sendReceiptToLocalService(receiptPayload) {
  if (PRINT_MODE !== "service") return null;

  const response = await fetch(PRINT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(receiptPayload),
  });

  if (!response.ok) {
    throw new Error(`Print service returned ${response.status}`);
  }

  return response.json();
}

function showSelectedCard(selection) {
  const origin = getSelectedCardOrigin(selection);
  const receiptPayload = createReceiptPayload(selection);

  selectedCardStage.style.setProperty("--selected-card-origin-x", `${origin.x}px`);
  selectedCardStage.style.setProperty("--selected-card-origin-y", `${origin.y}px`);
  startSelectedCardShake(selection.personId);
  machineRevealShade.setAttribute("aria-hidden", "false");
  machineRevealShade.classList.add("is-visible");
  selectedCardStage.dataset.personId = selection.personId;
  selectedCardStage.dataset.receiptId = receiptPayload.receiptId;
  selectedCardStage.dataset.printStatus = "printing";
  selectedCardStage.setAttribute("aria-hidden", "false");
  selectedCardStage.classList.remove("is-visible");
  selectedCardStage.offsetHeight;
  selectedCardStage.classList.add("is-visible");

  phase = "selectedReveal";
  updateFactPreview(receiptPayload, "Fun fact retrieved");
  currentPrintJob = {
    status: "printing",
    payload: receiptPayload,
  };
  scheduleIdlePrompt();
  holdTriggerRearm(PRINT_REARM_DELAY_MS);
  window.dispatchEvent(new CustomEvent("sfdw:printer-print-requested", { detail: receiptPayload }));
  sendReceiptToLocalService(receiptPayload)
    .then((serviceResult) => {
      if (!serviceResult) return;
      currentPrintJob = {
        status: serviceResult.status ?? "printed",
        payload: receiptPayload,
        printedAt: serviceResult.printedAt ?? new Date().toISOString(),
        serviceResult,
      };
      selectedCardStage.dataset.printStatus = currentPrintJob.status;
      if (phase !== "idlePrompt") {
        phase = currentPrintJob.status === "printed" ? "complete" : "printServiceComplete";
      }
      updateFactPreview(receiptPayload, `Service ${currentPrintJob.status}`);
      window.dispatchEvent(new CustomEvent("sfdw:printer-print-completed", { detail: currentPrintJob }));
    })
    .catch((error) => {
      currentPrintJob = {
        status: "failed",
        payload: receiptPayload,
        error: error.message,
        failedAt: new Date().toISOString(),
      };
      selectedCardStage.dataset.printStatus = "failed";
      updateFactPreview(receiptPayload, "Service print failed");
      window.dispatchEvent(new CustomEvent("sfdw:printer-print-failed", { detail: currentPrintJob }));
    });

  if (PRINT_MODE === "service") return;

  mockPrintTimer = window.setTimeout(() => {
    mockPrintTimer = null;
    currentPrintJob = {
      status: "printed",
      payload: receiptPayload,
      printedAt: new Date().toISOString(),
    };
    selectedCardStage.dataset.printStatus = "printed";
    if (phase !== "idlePrompt") phase = "complete";
    updateFactPreview(receiptPayload, "Mock print complete");
    window.dispatchEvent(new CustomEvent("sfdw:printer-print-completed", { detail: currentPrintJob }));
  }, MOCK_PRINT_DURATION_MS);
}

function scheduleSelectedReveal(selection) {
  if (selectedRevealTimer) window.clearTimeout(selectedRevealTimer);

  selectedRevealTimer = window.setTimeout(() => {
    selectedRevealTimer = null;
    if (phase !== "chosen") return;

    showSelectedCard(selection);
  }, SELECTED_REVEAL_DELAY_MS);
}

function startHorizontalSelection(targetColumnIndex = null) {
  if (phase !== "rowStopped") return;

  const visibleRow = rowPattern[centeredRowIndex];
  const targetIndex = Number.isInteger(targetColumnIndex)
    ? targetColumnIndex
    : Math.floor(Math.random() * visibleRow.length);
  const totalMoves = HORIZONTAL_MIN_LOOPS * HORIZONTAL_POSITIONS.length + targetIndex;
  let movesComplete = 0;

  phase = "horizontalSelecting";
  currentSelection = null;
  horizontalSelector.classList.remove("is-chosen");
  horizontalSelector.classList.add("is-visible");
  setSelectorPosition(0, false);
  horizontalSelector.offsetHeight;

  function advanceSelector() {
    horizontalTimer = window.setTimeout(() => {
      movesComplete += 1;
      setSelectorPosition(movesComplete % HORIZONTAL_POSITIONS.length, true);

      if (movesComplete >= totalMoves) {
        horizontalTimer = window.setTimeout(() => {
          horizontalTimer = null;
          horizontalSelector.classList.add("is-chosen");
          phase = "chosen";
          currentSelection = {
            personId: visibleRow[targetIndex],
            rowIndex: centeredRowIndex,
            columnIndex: targetIndex,
            selectedAt: new Date().toISOString(),
          };
          pendingSelectionTarget = null;
          window.dispatchEvent(new CustomEvent("sfdw:selection-completed", { detail: currentSelection }));
          scheduleSelectedReveal(currentSelection);
        }, PROTOTYPE_TIMING.transitionMs);
        return;
      }

      horizontalTimer = window.setTimeout(advanceSelector, PROTOTYPE_TIMING.transitionMs);
    }, PROTOTYPE_TIMING.afterDelayMs);
  }

  advanceSelector();
}

function resetAndStartVerticalRoll() {
  hideHorizontalSelector();
  hideSelectedCard();
  pendingSelectionTarget = null;
  currentSelection = null;
  phase = "verticalRolling";
  startVerticalRoll();
}

function startSelectionSequence() {
  if (phase === "verticalRolling" || phase === "horizontalSelecting") return;

  if (horizontalStartTimer) window.clearTimeout(horizontalStartTimer);
  hideHorizontalSelector();
  hideSelectedCard();
  pendingSelectionTarget = createRandomSelectionTarget();
  currentSelection = null;
  phase = "verticalRolling";
  startVerticalRoll();

  if (autoStopTimer) window.clearTimeout(autoStopTimer);
  autoStopTimer = window.setTimeout(() => {
    autoStopTimer = null;
    if (phase !== "verticalRolling") return;

    stopVerticalRoll(pendingSelectionTarget.rowIndex);
    horizontalStartTimer = window.setTimeout(() => {
      horizontalStartTimer = null;
      if (phase !== "rowStopped") return;

      startHorizontalSelection(pendingSelectionTarget.columnIndex);
    }, HORIZONTAL_START_DELAY_MS);
  }, VERTICAL_ROLL_DURATION_MS);
}

function holdTriggerRearm(delayMs) {
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;

  nextTriggerAt = Math.max(nextTriggerAt, Date.now() + delayMs);
}

function handleTrigger() {
  if (Date.now() < nextTriggerAt) return;

  if (phase === "idle" || phase === "complete" || phase === "idlePrompt") startSelectionSequence();
}

function updateFrameScale() {
  const scale = Math.min(window.innerWidth / 1440, window.innerHeight / 1024);
  document.documentElement.style.setProperty("--frame-scale", String(scale));
}

renderReel();
preloadSelectedCardAssets();
applyPageBackground();
applyMachineScale();
updateFrameScale();
initializeFactPreview();
initializeRosterQa();
setReelTransform(0, false);

window.addEventListener("resize", updateFrameScale);

document.body.tabIndex = -1;
document.body.focus({ preventScroll: true });

window.addEventListener("focus", () => {
  document.body.focus({ preventScroll: true });
});

window.addEventListener(
  "keydown",
  (event) => {
    const triggerKeyId = getTriggerKeyId(event);
    if (!KEYBOARD_TRIGGER_ENABLED || !triggerKeyId) return;

    event.preventDefault();
    if (event.repeat || activeTriggerKeys.has(triggerKeyId)) return;

    activeTriggerKeys.add(triggerKeyId);
    handleTrigger();
  },
  { capture: true }
);

window.addEventListener(
  "keyup",
  (event) => {
    const triggerKeyId = getTriggerKeyId(event);
    if (!triggerKeyId) return;

    activeTriggerKeys.delete(triggerKeyId);
  },
  { capture: true }
);

document.addEventListener("pointerdown", () => {
  if (!POINTER_TRIGGER_ENABLED) return;
  handleTrigger();
});

window.sfdwVending = {
  prototypeTiming: PROTOTYPE_TIMING,
  verticalRollDurationMs: VERTICAL_ROLL_DURATION_MS,
  idleRollSpeedFactor: IDLE_ROLL_SPEED_FACTOR,
  horizontalStartDelayMs: HORIZONTAL_START_DELAY_MS,
  selectedRevealDelayMs: SELECTED_REVEAL_DELAY_MS,
  selectedCardShakeStepMs: SELECTED_CARD_SHAKE_STEP_MS,
  mockPrintDurationMs: MOCK_PRINT_DURATION_MS,
  printRearmDelayMs: PRINT_REARM_DELAY_MS,
  idlePromptDelayMs: IDLE_PROMPT_DELAY_MS,
  inputMode: INPUT_MODE,
  machineScale: getResolvedMachineScale(),
  selectionSlots: selectionSlots.map((slot) => ({ ...slot })),
  pointerTriggerEnabled: POINTER_TRIGGER_ENABLED,
  startVerticalRoll,
  stopVerticalRoll,
  startHorizontalSelection,
  showIdlePrompt,
  hideIdlePrompt,
  resetAndStartVerticalRoll,
  startSelectionSequence,
  get phase() {
    return phase;
  },
  get currentSelection() {
    return currentSelection;
  },
  get pendingSelectionTarget() {
    return pendingSelectionTarget;
  },
  get currentPrintJob() {
    return currentPrintJob;
  },
  get isIdleRollRunning() {
    return isIdleRollRunning;
  },
  get forcedPersonId() {
    return FORCED_PERSON_ID;
  },
  getPersonFact,
};
