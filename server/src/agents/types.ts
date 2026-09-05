import type { Event } from "@google/adk";
import type { ParallelSourceResult } from "../tools/parallelSearchTool.js";
import type {
  ChangeImpactRequest,
  ContinuityFinding,
  ProductionImplications
} from "../schemas.js";

export interface RealityGateAnalysis {
  requiresExternalResearch: boolean;
  reason: string;
  topic?: string;
  suggestedQueries?: string[];
}

export interface ParallelResearchData {
  query: string;
  isLiveApi: boolean;
  latencyMs: number;
  sources: ParallelSourceResult[];
  searchId?: string;
  status: "VERIFIED" | "UNRESOLVED" | "NOT_CHECKED" | "ERROR";
}

export interface AdkExecutionEventSummary {
  id: string;
  invocationId: string;
  author: string;
  timestamp: number;
  summary: string;
}

export interface ChangeImpactAnalysisResult {
  summary: string;
  affectedInternalNodes: string[];
  unaffectedProtectedNodes: string[];
  continuityFindings: ContinuityFinding[];
  realityGate: RealityGateAnalysis;
  parallelResearch?: ParallelResearchData;
  productionImplications: ProductionImplications;
  suggestedAction: "APPROVE_SELECTIVE_PROPAGATION" | "REJECT_AND_ROLLBACK";
  adkExecution: {
    runId: string;
    sessionId?: string;
    agentsInvoked: string[];
    eventCount: number;
    events: AdkExecutionEventSummary[];
  };
  executionTrace: {
    deterministicDiffMs: number;
    adkReasoningMs: number;
    parallelSearchMs: number;
    totalMs: number;
    model: string;
    geminiStatus: "VERIFIED" | "NOT_CONFIGURED" | "ERROR";
    adkStatus: "VERIFIED" | "ERROR";
  };
}
