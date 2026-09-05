import { z } from "zod";

export const ParallelResearchRequestSchema = z.object({
  query: z.string().min(1),
  objective: z.string().optional(),
  maxResults: z.number().int().positive().optional().default(4)
});

export const ChangeImpactRequestSchema = z.object({
  projectTitle: z.string().default("Untitled Screenplay"),
  sceneNumber: z.number().int().positive(),
  beforeText: z.string(),
  afterText: z.string(),
  changedEntities: z.array(z.string()).optional().default([]),
  contextNotes: z.string().optional()
});
