import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const csvPath = resolve(projectRoot, "data", "ppl_facts.csv");
const outputPath = resolve(projectRoot, "webapp", "data", "people-facts.js");

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((nextRow) => nextRow.some((value) => value.trim()));
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cleanField(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
}

function toPersonId(value) {
  return cleanField(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getValue(record, exactHeaders, fuzzyHeader) {
  const exactKeys = exactHeaders.map(normalizeHeader);
  const exactKey = exactKeys.find((key) => key in record);
  if (exactKey) return record[exactKey];

  if (!fuzzyHeader) return "";
  const fuzzyKey = Object.keys(record).find(fuzzyHeader);
  return fuzzyKey ? record[fuzzyKey] : "";
}

function withNickname(nickname, sentence) {
  const text = cleanField(sentence);
  if (!text) return "";
  if (text.toLowerCase().startsWith(nickname.toLowerCase())) return text;

  const softened = text.replace(/^Will\b/, "will").replace(/^Is\b/, "is");
  return `${nickname} ${softened}`;
}

const csv = await readFile(csvPath, "utf8");
const [headers, ...bodyRows] = parseCsv(csv);
const normalizedHeaders = headers.map(normalizeHeader);

const people = bodyRows.map((row) => {
  const record = Object.fromEntries(normalizedHeaders.map((header, index) => [header, cleanField(row[index])]));
  const nickname = getValue(record, ["Nickname", "Name"]) || getValue(record, ["Full Name", "Full Mame"]).split(/\s+/)[0];
  const fullName = getValue(record, ["Full Name", "Full Mame"]) || nickname;
  const personId = toPersonId(nickname);
  const team = getValue(record, ["Team"]);
  const role = getValue(record, ["Role"]);
  const funFact = getValue(record, [], (key) => key.includes("funfact"));
  const whereToFind = getValue(record, ["Where to find"]);
  const roleWithTeam = team && personId !== "gadi" ? `${role} (${team})` : role || team;
  const whereToFindLine = withNickname(nickname, whereToFind);

  return {
    personId,
    displayName: fullName,
    fullName,
    nickname,
    firstName: nickname,
    profileImage: `./assets/receipt-profiles/${personId}.png`,
    team,
    role,
    roleWithTeam,
    funFact,
    whereToFind,
    whereToFindLine,
    callToAction: `Wanna know more? Go talk to ${nickname}!`,
    restaurant: getValue(record, [], (key) => key.includes("favoriterestaurant")),
    interest: getValue(record, [], (key) => key.includes("interestoutsideofwork")),
    cmykColor: getValue(record, [], (key) => key.includes("favoritecmykcolor")),
    hobby: getValue(record, [], (key) => key.includes("hobby")),
    vacationSpot: getValue(record, [], (key) => key.includes("favoritevacationspot")),
  };
});

const output = `export const PEOPLE_FACTS = ${JSON.stringify(people, null, 2)};\n\nexport const PEOPLE_FACTS_BY_ID = Object.fromEntries(\n  PEOPLE_FACTS.map((person) => [person.personId, person])\n);\n\nexport function getPersonFact(personId) {\n  return PEOPLE_FACTS_BY_ID[personId] ?? null;\n}\n`;

await writeFile(outputPath, output, "utf8");

console.log(`Synced ${people.length} people to ${outputPath}`);
