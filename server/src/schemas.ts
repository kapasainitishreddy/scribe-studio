import { z } from "zod";

export const REQUEST_LIMITS = {
  researchQueryChars: 500,
  researchObjectiveChars: 1_000,
  researchMaxResults: 8,
  projectTitleChars: 200,
  revisionTextChars: 50_000,
  contextNotesChars: 10_000,
  screenplayTextChars: 250_000,
  sceneHeadingChars: 500,
  entityChars: 120,
  changedEntities: 200,
  sceneEntities: 100,
  allScenes: 500,
  existingArtifacts: 1_000,
  artifactFieldChars: 200
} as const;

export const EvidenceStateSchema = z.enum([
  "VERIFIED",
  "SUPPORTED",
  "POTENTIAL_CONFLICT",
  "UNRESOLVED",
  "INTENTIONAL_CHANGE",
  "NOT_CHECKED"
]);

export const ContinuityFindingSchema = z.object({
  category: z.string().min(1),
  issue: z.string().min(1),
  evidenceState: EvidenceStateSchema,
  screenplayCitation: z.string(),
  actionNeeded: z.string()
});

export const ProductionImplicationsSchema = z.object({
  props: z.array(z.string()).default([]),
  wardrobe: z.array(z.string()).default([]),
  cameraSetupNotes: z.array(z.string()).default([]),
  actorPreparation: z.array(z.string()).default([]),
  departmentAlerts: z.array(z.object({
    department: z.string(),
    alert: z.string(),
    severity: z.enum(["low", "medium", "high"])
  })).optional().default([])
});

export const GeminiStructuredOutputSchema = z.object({
  summary: z.string().min(1),
  continuityFindings: z.array(ContinuityFindingSchema),
  productionImplications: ProductionImplicationsSchema,
  uncertainty: z.string().optional().default("Low semantic uncertainty across physical set bounds."),
  artisticProposals: z.array(z.string()).optional().default([])
});

export const ParallelResearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(REQUEST_LIMITS.researchQueryChars),
  objective: z.string().trim().min(1).max(REQUEST_LIMITS.researchObjectiveChars).optional(),
  maxResults: z.number().int().positive().max(REQUEST_LIMITS.researchMaxResults).optional().default(4)
}).strict();

const BoundedEntitySchema = z.string().trim().min(1).max(REQUEST_LIMITS.entityChars);

export const SceneContextSchema = z.object({
  number: z.number().int().positive(),
  heading: z.string().trim().max(REQUEST_LIMITS.sceneHeadingChars),
  characters: z.array(BoundedEntitySchema).max(REQUEST_LIMITS.sceneEntities).optional().default([]),
  props: z.array(BoundedEntitySchema).max(REQUEST_LIMITS.sceneEntities).optional().default([])
}).strict();

export const ExistingArtifactSchema = z.object({
  id: z.string().trim().min(1).max(REQUEST_LIMITS.artifactFieldChars),
  sceneNumber: z.number().int().positive().optional(),
  type: z.string().trim().min(1).max(REQUEST_LIMITS.artifactFieldChars)
}).strict();

export const ChangeImpactRequestSchema = z.object({
  projectTitle: z.string().trim().min(1).max(REQUEST_LIMITS.projectTitleChars).default("Untitled Screenplay"),
  sceneNumber: z.number().int().positive(),
  beforeText: z.string().max(REQUEST_LIMITS.revisionTextChars),
  afterText: z.string().max(REQUEST_LIMITS.revisionTextChars),
  changedEntities: z.array(BoundedEntitySchema).max(REQUEST_LIMITS.changedEntities).optional().default([]),
  contextNotes: z.string().max(REQUEST_LIMITS.contextNotesChars).optional(),
  screenplayText: z.string().max(REQUEST_LIMITS.screenplayTextChars).optional(),
  allScenes: z.array(SceneContextSchema).max(REQUEST_LIMITS.allScenes).optional().default([]),
  existingArtifacts: z.array(ExistingArtifactSchema).max(REQUEST_LIMITS.existingArtifacts).optional().default([])
}).strict();

export type ChangeImpactRequest = z.infer<typeof ChangeImpactRequestSchema>;
export type GeminiStructuredOutput = z.infer<typeof GeminiStructuredOutputSchema>;
export type ContinuityFinding = z.infer<typeof ContinuityFindingSchema>;
export type ProductionImplications = z.infer<typeof ProductionImplicationsSchema>;
