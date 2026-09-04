import { z } from "zod";

export const CanonFactStatusSchema = z.enum(["proposed", "approved", "locked", "superseded"]);

export const CanonFactCategorySchema = z.enum([
  "character",
  "location",
  "prop",
  "world-rule",
  "relationship",
  "secret",
  "timeline",
  "theme"
]);

export const CanonFactSchema = z.object({
  id: z.string(),
  category: CanonFactCategorySchema,
  entityId: z.string().optional(),
  title: z.string(),
  statement: z.string(),
  status: CanonFactStatusSchema,
  firstSeenSceneNumber: z.number().optional(),
  sourceLineIds: z.array(z.string()),
  supersededBy: z.string().optional(),
  locked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CharacterRelationshipSchema = z.object({
  targetCharacterId: z.string(),
  targetCharacterName: z.string(),
  relationshipType: z.string(),
  notes: z.string()
});

export const CharacterPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  role: z.enum(["lead", "supporting", "minor", "cameo"]),
  biography: z.string(),
  traits: z.array(z.string()),
  speakingStyle: z.string(),
  vocabularyNotes: z.string(),
  dramaticObjective: z.string(),
  fears: z.array(z.string()),
  secrets: z.array(z.string()),
  injuries: z.array(z.string()),
  wardrobeNotes: z.string(),
  knowledgeByScene: z.record(z.string(), z.array(z.string())).or(z.record(z.number(), z.array(z.string()))),
  relationships: z.array(CharacterRelationshipSchema)
});

export const BreakdownCategorySchema = z.enum([
  "cast",
  "extras",
  "props",
  "wardrobe",
  "vehicles",
  "sfx",
  "vfx",
  "stunts",
  "animals",
  "makeup",
  "sound",
  "equipment",
  "set-dressing",
  "music",
  "greenery",
  "special"
]);

export const BreakdownElementSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  sceneNumber: z.number(),
  category: BreakdownCategorySchema,
  name: z.string(),
  quantity: z.number().optional(),
  notes: z.string().optional(),
  isAiSuggested: z.boolean(),
  isConfirmed: z.boolean(),
  locked: z.boolean()
});

export const ProjectBreakdownSchema = z.object({
  elements: z.array(BreakdownElementSchema),
  lastUpdated: z.string()
});

export const ActorCueBlockSchema = z.object({
  cueSpeaker: z.string(),
  cueLine: z.string(),
  dialogueLines: z.array(z.string()),
  parenthetical: z.string().optional(),
  lineId: z.string()
});

export const ActorPacketSceneSchema = z.object({
  sceneId: z.string(),
  sceneNumber: z.number(),
  sceneHeading: z.string(),
  dramaticObjective: z.string(),
  emotionalState: z.string(),
  wardrobeCheck: z.string(),
  propsRequired: z.array(z.string()),
  secretsKnown: z.array(z.string()),
  cues: z.array(ActorCueBlockSchema)
});

export const ActorPacketSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  characterName: z.string(),
  lastGeneratedAt: z.string(),
  screenplayVersion: z.number(),
  isStale: z.boolean(),
  staleReason: z.string().optional(),
  staleDiffPreview: z.string().optional(),
  scenes: z.array(ActorPacketSceneSchema)
});

export const RevisionColorSchema = z.enum([
  "White",
  "Blue",
  "Pink",
  "Yellow",
  "Green",
  "Goldenrod",
  "Buff",
  "Salmon",
  "Cherry"
]);

export const ContinuityIssueSchema = z.object({
  id: z.string(),
  category: z.enum(["teleportation", "prop", "wardrobe", "injury", "knowledge", "time", "setup-payoff"]),
  severity: z.enum(["critical", "warning", "info"]),
  affectedScenes: z.array(z.number()),
  affectedCharacters: z.array(z.string()),
  headline: z.string(),
  reason: z.string(),
  supportingEvidence: z.string(),
  suggestedResolution: z.string(),
  status: z.enum(["active", "dismissed", "intentional", "resolved"]),
  createdAt: z.string()
});

export const StickyNoteSchema = z.object({
  id: z.string(),
  sceneNumber: z.number().optional(),
  characterId: z.string().optional(),
  type: z.enum(["decision", "suggestion", "action-item", "continuity", "production", "dialogue"]),
  title: z.string(),
  content: z.string(),
  status: z.enum(["proposed", "accepted", "rejected", "implemented"]),
  speaker: z.string().optional(),
  createdAt: z.string()
});

export const CorkboardCardSchema = z.object({
  id: z.string(),
  type: z.enum(["scene", "beat", "character", "plot-thread", "idea", "note"]),
  title: z.string(),
  synopsis: z.string(),
  sceneNumber: z.number().optional(),
  act: z.number(),
  color: z.string(),
  tags: z.array(z.string()),
  order: z.number()
});
