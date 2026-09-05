export interface RuntimeProofData {
  adkPackage: string;
  genAiPackage: string;
  parallelSdk: string;
  modelIdentifier: string;
  executionMode: string;
  lastParallelStatus: "success" | "error" | "none";
  lastParallelLatencyMs?: number;
  lastParallelSearchId?: string;
  timestamp: string;
  serverStatus: "healthy" | "degraded";
}

export class RuntimeProofRegistry {
  private static instance: RuntimeProofRegistry;
  private proof: RuntimeProofData = {
    adkPackage: "@google/adk@2.0.0",
    genAiPackage: "@google/genai@2.21.0",
    parallelSdk: "parallel-web@1.3.3",
    modelIdentifier: "gemini-1.5-pro",
    executionMode: process.env.K_SERVICE ? "google-cloud-run" : "local-google-adk-service",
    lastParallelStatus: "none",
    timestamp: new Date().toISOString(),
    serverStatus: "healthy"
  };

  private constructor() {}

  public static get(): RuntimeProofRegistry {
    if (!RuntimeProofRegistry.instance) {
      RuntimeProofRegistry.instance = new RuntimeProofRegistry();
    }
    return RuntimeProofRegistry.instance;
  }

  public recordParallelSuccess(latencyMs: number, searchId?: string): void {
    this.proof.lastParallelStatus = "success";
    this.proof.lastParallelLatencyMs = latencyMs;
    this.proof.lastParallelSearchId = searchId;
    this.proof.timestamp = new Date().toISOString();
  }

  public recordParallelError(latencyMs: number): void {
    this.proof.lastParallelStatus = "error";
    this.proof.lastParallelLatencyMs = latencyMs;
    this.proof.timestamp = new Date().toISOString();
  }

  public getProof(): RuntimeProofData {
    return { ...this.proof, timestamp: new Date().toISOString() };
  }
}
