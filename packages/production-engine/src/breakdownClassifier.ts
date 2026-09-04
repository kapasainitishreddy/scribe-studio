import type { BreakdownElement, BreakdownCategory, Project } from "../../project-model/src/types";
import { parseScreenplay } from "../../screenplay-core/src/fountain";

const VEHICLE_KEYWORDS = ["car", "helicopter", "transport", "van", "truck", "motorcycle", "boat", "subway", "train", "ship", "aircraft", "jet"];
const STUNT_KEYWORDS = ["jump", "leap", "fall", "dives", "tackle", "punch", "fight", "blast", "shatter", "drop", "fire burst", "sliding", "crash"];
const VFX_KEYWORDS = ["hologram", "holographic", "matrix", "energy", "force field", "digital", "heads-up", "cyber", "glitch", "spectral"];
const SFX_KEYWORDS = ["rain", "wind machine", "sparks", "smoke", "halon", "mist", "steam", "explosion", "flame", "gunshot", "debris"];
const MAKEUP_KEYWORDS = ["scar", "wound", "blood", "bruised", "abrasion", "laceration", "sweat", "pallor", "prosthetic", "bandage"];
const WARDROBE_KEYWORDS = ["trench coat", "vest", "kevlar", "boots", "suit", "gloves", "jacket", "hood", "uniform", "soaked", "shivering"];
const SOUND_KEYWORDS = ["siren", "alarm", "hum", "whine", "drone", "screech", "thud", "click", "feedback", "howl", "thunder"];

export function classifySceneElements(
  sceneText: string,
  sceneNumber: number,
  sceneId: string,
  existingElements: BreakdownElement[] = []
): BreakdownElement[] {
  const parsed = parseScreenplay(sceneText);
  const elements: BreakdownElement[] = [];
  const sceneLines = parsed.lines;
  const fullText = sceneLines.map((l) => l.text).join("\n");
  const fullTextLower = fullText.toLowerCase();

  // Preserve user-locked elements from existing breakdown
  const lockedElements = existingElements.filter((e) => e.sceneNumber === sceneNumber && e.locked);
  elements.push(...lockedElements);

  const existingElementNames = new Set(elements.map((e) => e.name.toLowerCase()));

  // 1. Cast (speaking characters)
  for (const line of sceneLines) {
    if (line.kind === "character" && line.speaker) {
      const name = line.speaker.toUpperCase().trim();
      if (!existingElementNames.has(name.toLowerCase())) {
        elements.push({
          id: `bk-${sceneNumber}-cast-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "cast",
          name,
          isAiSuggested: false,
          isConfirmed: true,
          locked: false
        });
        existingElementNames.add(name.toLowerCase());
      }
    }
  }

  // 2. Extras detection
  const extrasMatches = fullText.match(/\b(?:\d+|two|three|four|several|a crowd of|patrons|guards|mercenaries|onlookers)\s+[a-z]+/gi);
  if (extrasMatches) {
    for (const match of extrasMatches) {
      if (
        (match.toLowerCase().includes("guard") ||
          match.toLowerCase().includes("mercenar") ||
          match.toLowerCase().includes("crowd") ||
          match.toLowerCase().includes("patron") ||
          match.toLowerCase().includes("soldier")) &&
        !existingElementNames.has(match.toLowerCase())
      ) {
        elements.push({
          id: `bk-${sceneNumber}-extras-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "extras",
          name: match.trim(),
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(match.toLowerCase());
      }
    }
  }

  // 3. Vehicles
  for (const keyword of VEHICLE_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      const sentence = sceneLines.find((l) => l.text.toLowerCase().includes(keyword));
      const label = sentence ? sentence.text.trim().slice(0, 50) : `Vehicle: ${keyword}`;
      if (!existingElementNames.has(keyword)) {
        elements.push({
          id: `bk-${sceneNumber}-veh-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "vehicles",
          name: label,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(keyword);
      }
    }
  }

  // 4. Stunts
  for (const keyword of STUNT_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      if (!existingElementNames.has(`stunt-${keyword}`)) {
        elements.push({
          id: `bk-${sceneNumber}-stunt-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "stunts",
          name: `Physical Action: ${keyword.toUpperCase()}`,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(`stunt-${keyword}`);
      }
    }
  }

  // 5. SFX
  for (const keyword of SFX_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      if (!existingElementNames.has(`sfx-${keyword}`)) {
        elements.push({
          id: `bk-${sceneNumber}-sfx-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "sfx",
          name: `Practical SFX: ${keyword.toUpperCase()}`,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(`sfx-${keyword}`);
      }
    }
  }

  // 6. VFX
  for (const keyword of VFX_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      if (!existingElementNames.has(`vfx-${keyword}`)) {
        elements.push({
          id: `bk-${sceneNumber}-vfx-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "vfx",
          name: `Visual Effects: ${keyword.toUpperCase()}`,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(`vfx-${keyword}`);
      }
    }
  }

  // 7. Makeup
  for (const keyword of MAKEUP_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      if (!existingElementNames.has(`mu-${keyword}`)) {
        elements.push({
          id: `bk-${sceneNumber}-mu-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "makeup",
          name: `Special Makeup: ${keyword.toUpperCase()}`,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(`mu-${keyword}`);
      }
    }
  }

  // 8. Wardrobe
  for (const keyword of WARDROBE_KEYWORDS) {
    if (fullTextLower.includes(keyword)) {
      if (!existingElementNames.has(`wardrobe-${keyword}`)) {
        elements.push({
          id: `bk-${sceneNumber}-ward-${elements.length + 1}`,
          sceneId,
          sceneNumber,
          category: "wardrobe",
          name: `Wardrobe: ${keyword.toUpperCase()}`,
          isAiSuggested: true,
          isConfirmed: false,
          locked: false
        });
        existingElementNames.add(`wardrobe-${keyword}`);
      }
    }
  }

  return elements;
}

export function generateFullBreakdown(project: Project): BreakdownElement[] {
  const parsed = parseScreenplay(project.screenplayText);
  const elements: BreakdownElement[] = [];

  for (const scene of parsed.scenes) {
    const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
    const sceneText = sceneLines.map((l) => l.text).join("\n");
    const sceneElements = classifySceneElements(
      sceneText,
      scene.number,
      scene.id,
      project.breakdown.elements
    );
    elements.push(...sceneElements);
  }

  return elements;
}
