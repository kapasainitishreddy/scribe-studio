import { hashText } from "./hash";
import type {
  EntityKind,
  ParsedScene,
  ParsedScreenplay,
  SceneHeadingParts,
  ScreenplayEntities,
  ScreenplayEntity,
  ScreenplayLine,
  ScreenplayLineKind,
  ScreenplayStats
} from "./types";

const scenePattern = /^(?:\.|INT\.?|EXT\.?|EST\.?|INT\.\/EXT\.?|I\/E\.?).+$/i;
const transitionPattern = /(?:TO:|^>)/;
const shotPattern = /^(?:ANGLE ON|CLOSE ON|INSERT|WIDE SHOT|POV|BACK TO SCENE|ESTABLISHING SHOT|AERIAL SHOT|SERIES OF SHOTS|MONTAGE)\b/i;
const locationPrefixPattern = /^(?:INT\.\/EXT\.?|I\/E\.?|INT\.?|EXT\.?|EST\.?)\s*/i;
const timeOfDaySuffixPattern = /\s+-\s+(?:LATER THAT NIGHT|MOMENTS LATER|LATE AFTERNOON|EARLY MORNING|MAGIC HOUR|GOLDEN HOUR|SAME TIME|PRE-DAWN|CONTINUOUS|AFTERNOON|MIDNIGHT|MORNING|EVENING|SUNRISE|SUNSET|LATER|NIGHT|DAWN|DUSK|DAY)\s*$/i;
const propStopWords = new Set([
  "a", "an", "and", "as", "at", "be", "but", "by", "down", "for", "from",
  "in", "into", "is", "it", "of", "on", "or", "put", "the", "to", "up", "with",
  "then", "their", "them", "they", "this", "that", "these", "those"
]);

export function cleanSceneHeading(text: string): string {
  return text.replace(/^\./, "").replace(/#\d+#\s*$/, "").trim();
}

export function parseSceneHeadingParts(heading: string): SceneHeadingParts {
  const trimmed = cleanSceneHeading(heading);
  const prefixMatch = trimmed.match(locationPrefixPattern);
  const prefix = (prefixMatch?.[0] ?? "").toUpperCase();
  const intExt: SceneHeadingParts["intExt"] =
    prefix.startsWith("INT./EXT") || prefix.startsWith("I/E")
      ? "INT/EXT"
      : prefix.startsWith("INT")
        ? "INT"
        : prefix.startsWith("EXT")
          ? "EXT"
          : prefix.startsWith("EST")
            ? "EST"
            : "OTHER";
  const timeMatch = trimmed.match(timeOfDaySuffixPattern);
  const timeOfDay = timeMatch ? timeMatch[0].replace(/^\s+-\s+/, "").trim().toUpperCase() : "DAY";
  const location = trimmed.replace(locationPrefixPattern, "").replace(timeOfDaySuffixPattern, "").trim();
  return { intExt, location: location || "UNKNOWN LOCATION", timeOfDay };
}

function isCharacterCue(text: string, nextNonblank: string | undefined): boolean {
  if (text.startsWith("@")) return true;
  return (
    text.length > 0 &&
    text.length <= 45 &&
    text === text.toUpperCase() &&
    !/[\p{P}]$/u.test(text.replace(/\^$/, "").replace(/\s*\(.*\)$/, "")) &&
    nextNonblank !== undefined &&
    !scenePattern.test(nextNonblank) &&
    !transitionPattern.test(nextNonblank)
  );
}

export function parseScreenplay(document: string): ParsedScreenplay {
  const rawLines = document.split(/\r?\n/);
  const lines: ScreenplayLine[] = [];
  const scenes: ParsedScene[] = [];
  let offset = 0;
  let currentScene: ParsedScene | null = null;
  let speaker: string | null = null;

  for (let index = 0; index < rawLines.length; index += 1) {
    const text = rawLines[index];
    const value = text.trim();
    const start = offset;
    const end = start + text.length;
    const newlineLength = index === rawLines.length - 1 ? 0 : document.startsWith("\r\n", end) ? 2 : 1;
    const nextNonblank = rawLines.slice(index + 1).map((l) => l.trim()).find(Boolean);
    let kind: ScreenplayLineKind;
    let dualDialogue = false;

    if (!value) {
      kind = "blank";
      speaker = null;
    } else if (scenePattern.test(value)) {
      kind = "scene-heading";
      speaker = null;
      const numMatch = value.match(/#(\d+)#\s*$/);
      const explicitNum = numMatch ? parseInt(numMatch[1], 10) : undefined;
      const heading = cleanSceneHeading(value);
      const parts = parseSceneHeadingParts(heading);
      const sceneNum = explicitNum ?? (scenes.length + 1);
      currentScene = {
        id: `scene-${sceneNum}-${hashText(heading)}`,
        number: sceneNum,
        heading,
        intExt: parts.intExt,
        location: parts.location,
        timeOfDay: parts.timeOfDay,
        start,
        end,
        lineIds: []
      };
      scenes.push(currentScene);
    } else if (value.startsWith("#")) {
      kind = "section";
      speaker = null;
    } else if (value.startsWith("=")) {
      kind = "synopsis";
      speaker = null;
    } else if (shotPattern.test(value)) {
      kind = "shot";
      speaker = null;
    } else if (transitionPattern.test(value)) {
      kind = "transition";
      speaker = null;
    } else if (/^\(.*\)$/.test(value)) {
      kind = "parenthetical";
    } else if (isCharacterCue(value, nextNonblank)) {
      kind = "character";
      dualDialogue = value.endsWith("^");
      speaker = value.replace(/^@/, "").replace(/\^$/, "").replace(/\s*\(.*\)$/, "").trim();
    } else if (speaker) {
      kind = "dialogue";
    } else {
      kind = "action";
    }

    const line: ScreenplayLine = {
      id: `line-${start}-${hashText(text)}`,
      start,
      end,
      text,
      kind,
      sceneId: currentScene?.id ?? null,
      speaker: kind === "dialogue" || kind === "parenthetical" || kind === "character" ? speaker : null,
      dualDialogue
    };

    lines.push(line);
    if (currentScene) {
      currentScene.lineIds.push(line.id);
      currentScene.end = end;
    }
    offset = end + newlineLength;
  }

  return { lines, scenes };
}

function normalizedName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function createEntity(
  name: string,
  kind: EntityKind,
  lineId: string,
  confidence: number,
  status: ScreenplayEntity["status"]
): ScreenplayEntity {
  const normalized = normalizedName(name);
  return {
    id: `${kind}-${hashText(normalized)}`,
    name,
    normalizedName: normalized,
    kind,
    sourceLineIds: [lineId],
    confidence,
    status
  };
}

function addEntity(
  entities: Map<string, ScreenplayEntity>,
  name: string,
  kind: EntityKind,
  lineId: string,
  confidence: number,
  status: ScreenplayEntity["status"]
) {
  const normalized = normalizedName(name);
  const existing = entities.get(normalized);
  if (existing) {
    if (!existing.sourceLineIds.includes(lineId)) {
      existing.sourceLineIds.push(lineId);
    }
  } else {
    entities.set(normalized, createEntity(name, kind, lineId, confidence, status));
  }
}

function extractPropCandidates(text: string): Set<string> {
  const words = (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) ?? []).filter(
    (w) => !propStopWords.has(w)
  );
  const phrases = new Set<string>();
  for (let start = 0; start < words.length; start += 1) {
    for (let length = 2; length <= 3 && start + length <= words.length; length += 1) {
      phrases.add(words.slice(start, start + length).join(" "));
    }
  }
  return phrases;
}

export function extractScreenplayEntities(parsed: ParsedScreenplay): ScreenplayEntities {
  const characters = new Map<string, ScreenplayEntity>();
  const locations = new Map<string, ScreenplayEntity>();
  const propLines = new Map<string, string[]>();

  for (const line of parsed.lines) {
    if (line.kind === "character" && line.speaker) {
      addEntity(characters, line.speaker, "character", line.id, 1, "confirmed");
    }
    if (line.kind === "scene-heading") {
      const parts = parseSceneHeadingParts(line.text);
      if (parts.location) {
        addEntity(locations, parts.location, "location", line.id, 1, "confirmed");
      }
    }
    if (line.kind === "action" || line.kind === "dialogue") {
      for (const phrase of extractPropCandidates(line.text)) {
        const linesList = propLines.get(phrase) ?? [];
        linesList.push(line.id);
        propLines.set(phrase, linesList);
      }
    }
  }

  const props = [...propLines]
    .filter(([, sourceLineIds]) => sourceLineIds.length >= 2)
    .map(([name, sourceLineIds]) => ({
      ...createEntity(name, "prop", sourceLineIds[0], 0.7, "proposed" as const),
      sourceLineIds
    }))
    .sort((a, b) => b.sourceLineIds.length - a.sourceLineIds.length)
    .slice(0, 25);

  return {
    characters: [...characters.values()],
    locations: [...locations.values()],
    props
  };
}

export function screenplayStats(document: string): ScreenplayStats {
  const parsed = parseScreenplay(document);
  const trimmed = document.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characterCounts: Record<string, number> = {};

  for (const line of parsed.lines) {
    if (line.kind === "character" && line.speaker) {
      const sp = line.speaker.toUpperCase();
      characterCounts[sp] = (characterCounts[sp] ?? 0) + 1;
    }
  }

  return {
    scenes: parsed.scenes.length,
    dialogueBlocks: parsed.lines.filter((l) => l.kind === "character").length,
    words,
    estimatedPages: Math.max(1, Math.ceil(words / 190)),
    characterCounts
  };
}
