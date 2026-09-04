export type ScreenplayLineKind =
  | "scene-heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "shot"
  | "section"
  | "synopsis"
  | "blank";

export interface ScreenplayLine {
  id: string;
  start: number;
  end: number;
  text: string;
  kind: ScreenplayLineKind;
  sceneId: string | null;
  speaker: string | null;
  dualDialogue?: boolean;
}

export interface ParsedScene {
  id: string;
  number: number;
  heading: string;
  intExt: "INT" | "EXT" | "INT/EXT" | "EST" | "OTHER";
  location: string;
  timeOfDay: string;
  start: number;
  end: number;
  lineIds: string[];
}

export interface ParsedScreenplay {
  lines: ScreenplayLine[];
  scenes: ParsedScene[];
}

export type EntityKind = "character" | "location" | "prop";

export interface ScreenplayEntity {
  id: string;
  name: string;
  normalizedName: string;
  kind: EntityKind;
  sourceLineIds: string[];
  confidence: number;
  status: "confirmed" | "proposed";
}

export interface ScreenplayEntities {
  characters: ScreenplayEntity[];
  locations: ScreenplayEntity[];
  props: ScreenplayEntity[];
}

export interface SceneHeadingParts {
  intExt: "INT" | "EXT" | "INT/EXT" | "EST" | "OTHER";
  location: string;
  timeOfDay: string;
}

export interface ScreenplayStats {
  scenes: number;
  dialogueBlocks: number;
  words: number;
  estimatedPages: number;
  characterCounts: Record<string, number>;
}
