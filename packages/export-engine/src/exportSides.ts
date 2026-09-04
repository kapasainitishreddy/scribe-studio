import { parseScreenplay } from "../../screenplay-core/src/fountain";
import { buildScreenplayPdf } from "./exportPdf";

export interface SidesOptions {
  characterName: string;
  projectTitle: string;
  startSceneNumber?: number;
  endSceneNumber?: number;
  includePrecedingCues?: boolean;
}

export function generateCharacterSidesText(document: string, options: SidesOptions): string {
  const parsed = parseScreenplay(document);
  const targetName = options.characterName.toUpperCase().trim();
  const outputLines: string[] = [];

  outputLines.push(`Title: ${options.projectTitle.toUpperCase()} - AUDITION / REHEARSAL SIDES`);
  outputLines.push(`Character: ${targetName}`);
  outputLines.push(`Date: ${new Date().toLocaleDateString()}`);
  outputLines.push("");
  outputLines.push("================================================================");
  outputLines.push("");

  let hasContent = false;

  for (const scene of parsed.scenes) {
    if (options.startSceneNumber && scene.number < options.startSceneNumber) continue;
    if (options.endSceneNumber && scene.number > options.endSceneNumber) continue;

    const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
    const characterLines = sceneLines.filter(
      (l) => l.speaker && l.speaker.toUpperCase().trim() === targetName
    );

    if (characterLines.length === 0) continue;
    hasContent = true;

    outputLines.push(scene.heading);
    outputLines.push("");

    let lastSpeaker: string | null = null;
    let pendingCue: string | null = null;
    let pendingCueSpeaker: string | null = null;

    for (let i = 0; i < sceneLines.length; i += 1) {
      const line = sceneLines[i];

      if (line.kind === "character") {
        const sp = line.speaker ? line.speaker.toUpperCase().trim() : "";
        if (sp === targetName) {
          // Print preceding cue if exists
          if (options.includePrecedingCues !== false && pendingCue && pendingCueSpeaker) {
            outputLines.push(`(CUE - ${pendingCueSpeaker})`);
            outputLines.push(`"${pendingCue}"`);
            outputLines.push("");
            pendingCue = null;
            pendingCueSpeaker = null;
          }
          outputLines.push(targetName);
          lastSpeaker = targetName;
        } else {
          pendingCueSpeaker = sp;
          lastSpeaker = sp;
        }
      } else if (line.kind === "dialogue") {
        if (lastSpeaker === targetName) {
          outputLines.push(line.text);
          outputLines.push("");
        } else {
          pendingCue = line.text;
        }
      } else if (line.kind === "parenthetical") {
        if (lastSpeaker === targetName) {
          outputLines.push(line.text);
        }
      } else if (line.kind === "action") {
        // Only include action lines that explicitly name the character
        if (line.text.toUpperCase().includes(targetName)) {
          outputLines.push(`[${line.text.trim()}]`);
          outputLines.push("");
        }
      }
    }

    outputLines.push("");
  }

  if (!hasContent) {
    outputLines.push(`No speaking scenes found for ${targetName} within the specified range.`);
  }

  return outputLines.join("\n");
}

export function generateCharacterSidesPdf(document: string, options: SidesOptions): Uint8Array {
  const sidesText = generateCharacterSidesText(document, options);
  return buildScreenplayPdf(sidesText, {
    header: `${options.projectTitle} - SIDES: ${options.characterName.toUpperCase()}`,
    pageNumbers: true
  });
}
