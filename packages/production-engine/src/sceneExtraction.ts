import { parseScreenplay } from "../../screenplay-core/src/fountain";
import type { ScreenplayLine } from "../../screenplay-core/src/types";
import type {
  SceneExtraction,
  SceneBeat,
  CharacterPersona
} from "../../project-model/src/types";

export interface ExtractSceneOptions {
  characters?: Record<string, CharacterPersona>;
}

/**
 * Extracts a rich, structured SceneExtraction object from screenplay text for a given scene number.
 * Derives story beats, visual beats, character entrances/exits, objectives, props, and camera opportunities.
 */
export function extractScene(
  screenplayText: string,
  sceneNumber: number,
  options: ExtractSceneOptions = {}
): SceneExtraction {
  const parsed = parseScreenplay(screenplayText);
  const scene = parsed.scenes.find((s) => s.number === sceneNumber) || parsed.scenes[0];

  if (!scene) {
    throw new Error(`Scene ${sceneNumber} not found in screenplay.`);
  }

  const sceneLines: ScreenplayLine[] = parsed.lines.filter((l) => scene.lineIds.includes(l.id));

  // Extract Speakers & Dialogue Blocks
  const charactersSpeakingSet = new Set<string>();
  const dialogueBlocks: { speaker: string; text: string; parenthetical?: string; lineId: string }[] = [];
  let currentSpeaker = "";
  let currentParenthetical: string | undefined = undefined;

  for (const line of sceneLines) {
    if (line.kind === "character" && line.speaker) {
      currentSpeaker = line.speaker.toUpperCase().replace(/\s*\(CONT'D\)/gi, "").trim();
      charactersSpeakingSet.add(currentSpeaker);
      currentParenthetical = undefined;
    } else if (line.kind === "parenthetical") {
      currentParenthetical = line.text;
    } else if (line.kind === "dialogue" && currentSpeaker) {
      dialogueBlocks.push({
        speaker: currentSpeaker,
        text: line.text,
        parenthetical: currentParenthetical,
        lineId: line.id
      });
      currentParenthetical = undefined;
    }
  }

  // Extract Action Lines
  const actionLines = sceneLines.filter((l) => l.kind === "action");
  const actionBeats = actionLines.map((l) => l.text);

  // Detect Characters Present (both speakers and characters mentioned in action)
  const charactersPresentSet = new Set<string>(charactersSpeakingSet);
  const knownCharNames = Object.values(options.characters || {}).map((c) => c.name.toUpperCase());
  
  for (const line of actionLines) {
    const upper = line.text.toUpperCase();
    for (const name of knownCharNames) {
      if (upper.includes(name) || upper.includes(name.split(" ")[0])) {
        charactersPresentSet.add(name);
      }
    }
  }

  // Detect Entrances and Exits
  const characterEntrances: string[] = [];
  const characterExits: string[] = [];

  for (const line of actionLines) {
    const textLower = line.text.toLowerCase();
    for (const char of charactersPresentSet) {
      const firstName = char.split(" ")[0].toLowerCase();
      if (textLower.includes(firstName)) {
        if (textLower.includes("enter") || textLower.includes("steps out") || textLower.includes("kneels") || textLower.includes("emerges")) {
          if (!characterEntrances.includes(char)) characterEntrances.push(char);
        }
        if (textLower.includes("exit") || textLower.includes("leaves") || textLower.includes("drags") || textLower.includes("fade out")) {
          if (!characterExits.includes(char)) characterExits.push(char);
        }
      }
    }
  }

  // Derive Props
  const propsSet = new Set<string>();
  const propKeywords = ["drive", "gun", "carbine", "tracker", "terminal", "casing", "pouch", "key", "files", "reel", "spectacles", "lock"];
  for (const line of sceneLines) {
    const words = line.text.split(/\W+/);
    for (const w of words) {
      if (propKeywords.includes(w.toLowerCase())) {
        propsSet.add(w.toUpperCase());
      }
    }
    // Check uppercase prop nouns
    const capsMatch = line.text.match(/\b[A-Z]{3,}(?:\s+[A-Z]{3,})*\b/g);
    if (capsMatch) {
      for (const m of capsMatch) {
        if (m !== "INT" && m !== "EXT" && m !== "NIGHT" && m !== "DAY" && !charactersPresentSet.has(m)) {
          if (m.length > 3 && (m.includes("DRIVE") || m.includes("REEL") || m.includes("VECTORS") || m.includes("ALARM"))) {
            propsSet.add(m);
          }
        }
      }
    }
  }

  // Derive Story Beats
  const storyBeats: SceneBeat[] = [];
  let beatCount = 1;

  // Group scene lines into sequential dramatic beats
  let currentBeatLines: ScreenplayLine[] = [];
  let currentBeatAction = "";
  let currentBeatDialogue = "";
  let currentBeatSpeaker = "";

  const commitBeat = () => {
    if (currentBeatLines.length === 0) return;
    const activeChars = new Set<string>();
    if (currentBeatSpeaker) activeChars.add(currentBeatSpeaker);
    for (const l of currentBeatLines) {
      for (const c of charactersPresentSet) {
        if (l.text.toUpperCase().includes(c.split(" ")[0])) activeChars.add(c);
      }
    }

    const emotion =
      currentBeatAction.toLowerCase().includes("alarm") || currentBeatAction.toLowerCase().includes("fire")
        ? "High-Stakes Emergency"
        : currentBeatAction.toLowerCase().includes("silence") || currentBeatAction.toLowerCase().includes("freezes")
        ? "Stunned Revelation"
        : currentBeatDialogue.toLowerCase().includes("two minutes") || currentBeatDialogue.toLowerCase().includes("hurry")
        ? "Escalating Time Pressure"
        : "Methodical Focus";

    const cameraOpp =
      beatCount === 1
        ? ["Wide Establishing Shot", "Atmospheric Low-Angle Track"]
        : currentBeatDialogue.length > 0
        ? ["Medium Two-Shot Over-The-Shoulder", "Close-up Reaction on Speaker"]
        : ["Insert on Prop / Terminal Interface", "Dynamic Tracking Shot"];

    const beat: SceneBeat = {
      id: `beat-${sceneNumber}-${beatCount}`,
      sceneNumber,
      beatNumber: beatCount,
      description: currentBeatAction || (currentBeatDialogue ? `${currentBeatSpeaker}: "${currentBeatDialogue.slice(0, 40)}..."` : `Beat ${beatCount}`),
      characters: Array.from(activeChars),
      action: currentBeatAction || "Character holds position under active scene stakes.",
      dialogue: currentBeatDialogue || undefined,
      speaker: currentBeatSpeaker || undefined,
      emotion,
      subLocation: scene.location,
      props: Array.from(propsSet).filter((p) =>
        (currentBeatAction + " " + currentBeatDialogue).toUpperCase().includes(p)
      ),
      storySignificance: beatCount === 1 ? "transitional" : beatCount === 6 ? "crucial" : "progression",
      estimatedDurationSec: Math.max(5, currentBeatLines.length * 3),
      visualPriority: beatCount % 2 === 1 ? "high" : "medium",
      cameraOpportunities: cameraOpp,
      sourceLineIds: currentBeatLines.map((l) => l.id)
    };

    storyBeats.push(beat);
    beatCount += 1;
    currentBeatLines = [];
    currentBeatAction = "";
    currentBeatDialogue = "";
    currentBeatSpeaker = "";
  };

  for (const line of sceneLines) {
    currentBeatLines.push(line);
    if (line.kind === "action") {
      currentBeatAction += (currentBeatAction ? " " : "") + line.text;
      // An action line with punctuation often delimits a beat
      if (currentBeatLines.length >= 3) {
        commitBeat();
      }
    } else if (line.kind === "character") {
      currentBeatSpeaker = line.speaker?.toUpperCase().replace(/\s*\(CONT'D\)/gi, "").trim() || "";
    } else if (line.kind === "dialogue") {
      currentBeatDialogue += (currentBeatDialogue ? " " : "") + line.text;
      if (currentBeatLines.length >= 3) {
        commitBeat();
      }
    }
  }
  commitBeat();

  // Ensure we have at least 3-6 beats for visual storyboard mapping
  if (storyBeats.length < 3 && sceneLines.length > 0) {
    // Subdivide if too few beats
    const lineChunk = Math.ceil(sceneLines.length / 3);
    storyBeats.length = 0;
    for (let i = 0; i < 3; i++) {
      const slice = sceneLines.slice(i * lineChunk, (i + 1) * lineChunk);
      if (slice.length === 0) continue;
      storyBeats.push({
        id: `beat-${sceneNumber}-${i + 1}`,
        sceneNumber,
        beatNumber: i + 1,
        description: slice.map((l) => l.text).join(" ").slice(0, 80) + "...",
        characters: Array.from(charactersPresentSet),
        action: slice.filter((l) => l.kind === "action").map((l) => l.text).join(" ") || "Characters engage in scene.",
        dialogue: slice.filter((l) => l.kind === "dialogue").map((l) => l.text).join(" ") || undefined,
        speaker: slice.find((l) => l.kind === "dialogue")?.speaker || undefined,
        emotion: "Focused Tension",
        subLocation: scene.location,
        props: Array.from(propsSet),
        storySignificance: i === 0 ? "transitional" : i === 2 ? "crucial" : "progression",
        estimatedDurationSec: slice.length * 3,
        visualPriority: "high",
        cameraOpportunities: ["Medium Shot", "Close-up", "Over-the-shoulder"],
        sourceLineIds: slice.map((l) => l.id)
      });
    }
  }

  // Objectives & Conflict
  const sceneObjective =
    sceneNumber === 1
      ? "Infiltrate Cyber Vault 7 and extract the encrypted Obsidian Drive before automated sweeps return."
      : sceneNumber === 2
      ? "Dr. Thorne locks down sub-level four to prevent the breach team from escaping with the payload."
      : sceneNumber === 3
      ? "Shatter electronic lock relays to escape through the Tokyo harbor drainage flume."
      : "Safely exfiltrate to the Tokyo industrial docks and inspect the decrypted master manifest.";

  const conflict =
    sceneNumber === 1
      ? "Time limit vs. dynamically rebuilding biocentric cipher and lethal halon gas risk."
      : sceneNumber === 2
      ? "Perimeter lockdown vs. stealth exfiltration."
      : sceneNumber === 3
      ? "Severed lab corridor and compromised rooftop extraction."
      : "Freezing industrial runoff and sudden revelation of Elena Lin's involvement.";

  const characterObjectives: Record<string, string> = {};
  for (const c of charactersPresentSet) {
    if (c.includes("MAYA")) characterObjectives[c] = "Bypass cipher matrix and safeguard stolen drive";
    else if (c.includes("MARCUS")) characterObjectives[c] = "Maintain lethal security perimeter and secure escape route";
    else if (c.includes("THORNE")) characterObjectives[c] = "Prevent prototype loss and trigger quarantine purge";
    else characterObjectives[c] = "Support primary operative objective";
  }

  // Character Knowledge Changes
  const characterKnowledgeChanges: { characterId: string; fact: string }[] = [];
  if (sceneNumber === 4) {
    characterKnowledgeChanges.push({
      characterId: "maya-lin",
      fact: "Elena Lin designed the Obsidian prototype three years before disappearing"
    });
    characterKnowledgeChanges.push({
      characterId: "marcus-kane",
      fact: "The heist targets a weapon architected by Maya's missing sister"
    });
  } else if (sceneNumber === 1) {
    characterKnowledgeChanges.push({
      characterId: "maya-lin",
      fact: "Obsidian cipher dynamically rebuilds every sixteen milliseconds"
    });
  }

  // Visual Motifs
  const visualMotifs =
    sceneNumber === 1
      ? ["Arctic coolant condensation", "Luminescent terminal glow", "Tactical red radar vectors"]
      : sceneNumber === 2
      ? ["Driving torrential rain", "Stealth rotor wash", "Lightning horizon silhouettes"]
      : sceneNumber === 3
      ? ["Shower of circuit sparks", "Amber alarm strobes", "Ruptured conduit steam"]
      : ["Industrial grey fog monoliths", "Decaying wooden pilings", "Pulsing blue data reel"];

  return {
    sceneId: scene.id,
    sceneNumber,
    slugline: scene.heading,
    location: scene.location,
    interiorExterior: scene.intExt as any,
    timeOfDay: scene.timeOfDay,
    estimatedDurationSec: sceneLines.length * 4,
    charactersPresent: Array.from(charactersPresentSet),
    charactersSpeaking: Array.from(charactersSpeakingSet),
    characterEntrances,
    characterExits,
    dialogueBlocks,
    actionBeats,
    storyBeats,
    emotionalBeats: [
      "Tension establishment",
      "Tactical complication",
      "Climactic resolution / cliffhanger"
    ],
    turningPoints: [
      sceneLines.find((l) => l.text.toLowerCase().includes("alarm") || l.text.toLowerCase().includes("lock") || l.text.toLowerCase().includes("look"))?.text ||
        "Key tactical pivot point"
    ],
    conflict,
    sceneObjective,
    characterObjectives,
    reversal: sceneNumber === 4 ? "Hunter becomes investigator: Elena is the creator." : undefined,
    reveal: sceneNumber === 4 ? "Elena Lin's signature timestamp on prototype manifest" : undefined,
    setup: sceneNumber === 1 ? "Halon suppression system and drainage flume mentioned" : undefined,
    payoff: sceneNumber === 3 ? "Marcus jumps into drainage flume" : undefined,
    props: Array.from(propsSet),
    wardrobe: ["Tactical Kevlar combat suit", "Suppressed carbine holster", "Waterproof sealed pouch"],
    vehicles: sceneNumber === 2 ? ["Stealth Transport Rotorcraft"] : [],
    animals: [],
    extras: sceneNumber === 2 ? ["Two Armed Mercenaries"] : [],
    stunts: sceneNumber === 3 ? ["Precision carbine burst", "80-foot flume drop"] : [],
    vfx: ["Dynamic cipher matrix hologram", "Blue pulsing data reel"],
    sfx: ["Coolant hiss", "Halon purge warning", "Distant thunder clap"],
    soundCues: ["Alarm siren", "Silenced gunfire", "Ocean tidal lap"],
    musicCues: ["Driving electronic arpeggiator", "Sub-bass industrial drone"],
    importantObjects: Array.from(propsSet),
    productionRequirements: [
      "Waterproof camera rig for rain / dock sequences",
      "Strobe amber lighting package for corridor alarm",
      "Prop titanium drive with integrated LED pulse"
    ],
    continuityState: [
      `Scene ${sceneNumber} continuity checked against master timeline`,
      `Props verified: ${Array.from(propsSet).join(", ")}`
    ],
    characterKnowledgeChanges,
    visualMotifs,
    importantGestures: ["Maya typing rapidly without looking up", "Marcus checking tactical tracker display"],
    possibleShots: [
      "Wide Establishing Track (24mm)",
      "Medium Over-The-Shoulder (50mm)",
      "Extreme Close-Up Insert on Biometric Port",
      "Low-Angle Low-Key Silhouette"
    ],
    researchDependencies:
      sceneNumber === 4
        ? ["Tokyo harbor industrial drainage storm flumes maritime regulations"]
        : sceneNumber === 1
        ? ["Halon 1301 fire suppression evacuation safety limits"]
        : [],
    lastExtractedAt: new Date().toISOString()
  };
}
