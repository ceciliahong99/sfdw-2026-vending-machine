const DEFAULT_LINE_WIDTH = 32;

export function normalizeForReceipt(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function wrapText(value, width = DEFAULT_LINE_WIDTH) {
  const normalized = normalizeForReceipt(value);
  if (!normalized) return [];

  return normalized.split(/\r?\n/).flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = "";
        }

        for (let index = 0; index < word.length; index += width) {
          lines.push(word.slice(index, index + width));
        }
        return;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length > width) {
        lines.push(current);
        current = word;
        return;
      }

      current = next;
    });

    if (current) lines.push(current);
    return lines.length ? lines : [""];
  });
}

export function centerText(value, width = DEFAULT_LINE_WIDTH) {
  const text = normalizeForReceipt(value);
  if (text.length >= width) return text;

  const left = Math.floor((width - text.length) / 2);
  return `${" ".repeat(left)}${text}`;
}

export function centerWrappedText(value, width = DEFAULT_LINE_WIDTH) {
  return wrapText(value, width).map((line) => centerText(line, width));
}

function sentenceWithNickname(nickname, value) {
  const name = normalizeForReceipt(nickname);
  const text = normalizeForReceipt(value);
  if (!name || !text) return text;
  if (text.toLowerCase().startsWith(name.toLowerCase())) return text;

  const softened = text.replace(/^Will\b/, "will").replace(/^Is\b/, "is");
  return `${name} ${softened}`;
}

export function buildReceiptLines(payload, options = {}) {
  const width = options.width ?? DEFAULT_LINE_WIDTH;
  const title = payload.title || "New Deal Design";
  const address = payload.address || "333 Bryant St #190";
  const footer = payload.footer || "<3";
  const fullName = normalizeForReceipt(payload.fullName || payload.displayName || payload.personId);
  const personId = payload.personId || payload.rawFact?.personId || "";
  const nickname = payload.nickname || payload.firstName || payload.rawFact?.nickname || payload.rawFact?.firstName || fullName.split(/\s+/)[0] || fullName;
  const role = payload.role || payload.rawFact?.role || "";
  const team = payload.team || payload.rawFact?.team || "";
  const roleWithTeam =
    payload.roleWithTeam || payload.rawFact?.roleWithTeam || (team && personId !== "gadi" ? `${role} (${team})` : role || team);
  const fact = payload.funFact || payload.rawFact?.funFact || "";
  const whereToFind = payload.whereToFind || payload.rawFact?.whereToFind || "";
  const introLine = payload.introLine || `${nickname} is...`;
  const whereToFindLine = payload.whereToFindLine || payload.rawFact?.whereToFindLine || sentenceWithNickname(nickname, whereToFind);
  const callToAction = payload.callToAction || payload.rawFact?.callToAction || `Wanna know more? Go talk to ${nickname}!`;
  const divider = ".".repeat(width);

  const lines = [
    "",
    centerText(title.toUpperCase(), width),
    centerText(address.toUpperCase(), width),
    "",
    "",
    centerText(fullName, width),
    "",
    "",
    ...wrapText(introLine, width),
    "",
    ...wrapText(roleWithTeam, width),
    "",
    divider,
    "",
    "",
  ];

  if (whereToFindLine) {
    lines.push(...wrapText("Where to find...", width), "", ...wrapText(whereToFindLine, width), "", divider, "", "");
  }

  lines.push(...wrapText(`Fun fact about ${nickname}...`, width), "", ...wrapText(fact, width), "", divider, "", "");

  lines.push(...centerWrappedText(callToAction, width), "", "", divider, "", "");

  lines.push(centerText(footer, width), "", "", "", "");

  return lines;
}

export function buildReceiptText(payload, options = {}) {
  return `${buildReceiptLines(payload, options).join("\n")}\n`;
}

export function buildEscPosTextBuffer(payload, options = {}) {
  const lines = buildReceiptLines(payload, options);
  const topLineCount = 5;
  const topLines = lines.slice(0, topLineCount);
  const bodyLines = lines.slice(topLineCount);
  const init = Buffer.from([0x1b, 0x40]);
  const alignLeft = Buffer.from([0x1b, 0x61, 0x00]);
  const alignCenter = Buffer.from([0x1b, 0x61, 0x01]);
  const feed = Buffer.from([0x0a, 0x0a, 0x0a]);
  const partialCut = Buffer.from([0x1d, 0x56, 0x42, 0x00]);
  const profileImage = options.profileImage ?? null;

  const chunks = [init, alignLeft];

  chunks.push(Buffer.from(`${topLines.join("\n")}\n`, "ascii"));

  if (profileImage) {
    chunks.push(alignCenter, profileImage, Buffer.from("\n\n", "ascii"), alignLeft);
  }

  chunks.push(Buffer.from(`${bodyLines.join("\n")}\n`, "ascii"), feed, partialCut);

  return Buffer.concat(chunks);
}
