import { z } from "zod";

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
  query: z.string().min(1),
  objective: z.string().optional(),
  maxResults: z.number().int().positive().optional().default(4)
});

export const SceneContextSchema = z.object({
  number: z.number().int().positive(),
  heading: z.string(),
  characters: z.array(z.string()).optional().default([]),
  props: z.array(z.string()).optional().default([])
});

export const ExistingArtifactSchema = z.object({
  id: z.string(),
  sceneNumber: z.number().optional(),
  type: z.string()
});

export const ChangeImpactRequestSchema = z.object({
  projectTitle: z.string().default("Untitled Screenplay"),
  sceneNumber: z.number().int().positive(),
  beforeText: z.string(),
  afterText: z.string(),
  changedEntities: z.array(z.string()).optional().default([]),
  contextNotes: z.string().optional(),
  screenplayText: z.string().optional(),
  allScenes: z.array(SceneContextSchema).optional().default([]),
  existingArtifacts: z.array(ExistingArtifactSchema).optional().default([])
});

export type ChangeImpactRequest = z.infer<typeof ChangeImpactRequestSchema>;
export type GeminiStructuredOutput = z.infer<typeof GeminiStructuredOutputSchema>;
export type ContinuityFinding = z.infer<typeof ContinuityFindingSchema>;
export type ProductionImplications = z.infer<typeof ProductionImplicationsSchema>;

