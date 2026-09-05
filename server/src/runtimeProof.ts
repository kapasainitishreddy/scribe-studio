export interface AdkProof {
  packageName: string;
  installedVersion: string;
  status: "VERIFIED" | "NOT_VERIFIED" | "ERROR";
  lastRunId?: string;
  lastSessionId?: string;
  lastEventCount?: number;
  lastWorkflowTimestamp?: string;
  lastLatencyMs?: number;
  activeAgents: string[];
}

export interface GeminiProof {
  packageName: string;
  installedVersion: string;
  modelIdentifier: string;
  status: "VERIFIED" | "NOT_VERIFIED" | "ERROR" | "NOT_CONFIGURED";
  lastSuccessfulCallTimestamp?: string;
  lastLatencyMs?: number;
  callCount: number;
  structuredOutputVerified: boolean;
}

export interface ParallelProof {
  sdkName: string;
  installedVersion: string;
  status: "VERIFIED" | "NOT_VERIFIED" | "ERROR" | "NOT_CONFIGURED";
  lastSearchId?: string;
  lastSuccessfulTimestamp?: string;
  lastLatencyMs?: number;
  lastQuery?: string;
  lastSourceCount?: number;
  isLiveApi: boolean;
}

export interface WorkflowProof {
  status: "IDLE" | "SUCCESS" | "ERROR";
  timestamp?: string;
  totalLatencyMs?: number;
  affectedNodeCount?: number;
  realityGateDecision?: string;
}

export interface RuntimeProofData {
  serverRevision: string;
  executionMode: "google-cloud-run" | "local-adk-service";
  serverStatus: "healthy" | "degraded";
  adk: AdkProof;
  gemini: GeminiProof;
  parallel: ParallelProof;
  lastWorkflow: WorkflowProof;
  timestamp: string;
}

export class RuntimeProofRegistry {
  private static instance: RuntimeProofRegistry;
  private proof: RuntimeProofData = {
    serverRevision: process.env.GIT_COMMIT || "dd20132",
    executionMode: process.env.K_SERVICE ? "google-cloud-run" : "local-adk-service",
    serverStatus: "healthy",
    adk: {
      packageName: "@google/adk",
      installedVersion: "2.0.0",
      status: "NOT_VERIFIED",
      activeAgents: [
        "RootProductionAgent",
        "ContinuityReasoningAgent",
        "ProductionImpactAgent",
        "RealityResearchAgent",
        "ConsolidationAgent"
      ]
    },
    gemini: {
      packageName: "@google/genai",
      installedVersion: "2.21.0",
      modelIdentifier: "gemini-2.5-flash",
      status: process.env.GEMINI_API_KEY ? "NOT_VERIFIED" : "NOT_CONFIGURED",
      callCount: 0,
      structuredOutputVerified: false
    },
    parallel: {
      sdkName: "parallel-web",
      installedVersion: "1.3.3",
      status: process.env.PARALLEL_API_KEY ? "NOT_VERIFIED" : "NOT_CONFIGURED",
      isLiveApi: false
    },
    lastWorkflow: {
      status: "IDLE"
    },
    timestamp: new Date().toISOString()
  };

  private constructor() {}

  public static get(): RuntimeProofRegistry {
    if (!RuntimeProofRegistry.instance) {
      RuntimeProofRegistry.instance = new RuntimeProofRegistry();
    }
    return RuntimeProofRegistry.instance;
  }

  public recordAdkRun(params: {
    runId: string;
    sessionId?: string;
    eventCount: number;
    latencyMs: number;
    agentsInvoked: string[];
  }): void {
    this.proof.adk.status = "VERIFIED";
    this.proof.adk.lastRunId = params.runId;
    this.proof.adk.lastSessionId = params.sessionId;
    this.proof.adk.lastEventCount = params.eventCount;
    this.proof.adk.lastLatencyMs = params.latencyMs;
    this.proof.adk.lastWorkflowTimestamp = new Date().toISOString();
    this.proof.adk.activeAgents = params.agentsInvoked;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordAdkError(latencyMs: number): void {
    this.proof.adk.status = "ERROR";
    this.proof.adk.lastLatencyMs = latencyMs;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordGeminiSuccess(latencyMs: number, model: string): void {
    this.proof.gemini.status = "VERIFIED";
    this.proof.gemini.modelIdentifier = model;
    this.proof.gemini.lastSuccessfulCallTimestamp = new Date().toISOString();
    this.proof.gemini.lastLatencyMs = latencyMs;
    this.proof.gemini.callCount += 1;
    this.proof.gemini.structuredOutputVerified = true;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordGeminiError(latencyMs: number): void {
    this.proof.gemini.status = "ERROR";
    this.proof.gemini.lastLatencyMs = latencyMs;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordParallelSuccess(latencyMs: number, searchId?: string, sourceCount: number = 0, query?: string): void {
    this.proof.parallel.status = sourceCount > 0 ? "VERIFIED" : "NOT_VERIFIED";
    this.proof.parallel.lastSearchId = searchId;
    this.proof.parallel.lastSuccessfulTimestamp = new Date().toISOString();
    this.proof.parallel.lastLatencyMs = latencyMs;
    this.proof.parallel.lastQuery = query;
    this.proof.parallel.lastSourceCount = sourceCount;
    this.proof.parallel.isLiveApi = true;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordParallelError(latencyMs: number): void {
    this.proof.parallel.status = "ERROR";
    this.proof.parallel.lastLatencyMs = latencyMs;
    this.proof.parallel.isLiveApi = false;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordWorkflowComplete(params: {
    status: "SUCCESS" | "ERROR";
    totalLatencyMs: number;
    affectedNodeCount: number;
    realityGateDecision: string;
  }): void {
    this.proof.lastWorkflow = {
      status: params.status,
      timestamp: new Date().toISOString(),
      totalLatencyMs: params.totalLatencyMs,
      affectedNodeCount: params.affectedNodeCount,
      realityGateDecision: params.realityGateDecision
    };
    this.proof.timestamp = new Date().toISOString();
  }

  public getProof(): RuntimeProofData {
    return { ...this.proof, timestamp: new Date().toISOString() };
  }
}

