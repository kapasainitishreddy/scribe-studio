import { BaseAgent, createEvent, type InvocationContext, type Event } from "@google/adk";
import { CONFIG } from "../config.js";
import { executeServerParallelSearch } from "../tools/parallelSearchTool.js";
import type { RealityGateAnalysis, ParallelResearchData } from "./types.js";
import type { ChangeImpactRequest } from "../schemas.js";

const FACTUAL_REGULATORY_KEYWORDS = [
  "halon", "fire", "suppression", "maritime", "coast guard", "drone", "faa",
  "permit", "regulations", "port authority", "subway", "mta", "radioactive",
  "cesium", "encryption", "aes-256", "quantum", "brand", "trademark",
  "protocol", "admiralty", "high seas", "salvage law", "toxicology", "hazard"
];

export class RealityResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: "RealityResearchAgent",
      description: "Evaluates the Reality Gate and orchestrates server-side Parallel Web Search when real-world factual claims are present."
    });
  }

  public evaluateGate(input: ChangeImpactRequest): RealityGateAnalysis {
    const combined = (input.beforeText + " " + input.afterText + " " + input.changedEntities.join(" ")).toLowerCase();
    const matched = FACTUAL_REGULATORY_KEYWORDS.find((kw) => combined.includes(kw));

    if (matched) {
      return {
        requiresExternalResearch: true,
        reason: `Factual/regulatory claim detected regarding "${matched}". Live Parallel Web Search required.`,
        topic: `Filmmaking compliance: ${matched}`,
        suggestedQueries: [
          `filmmaking production ${matched} regulation standard`,
          `${matched} safety protocol film set`
        ]
      };
    }

    return {
      requiresExternalResearch: false,
      reason: "Purely dramatic dialogue and staging. Exempt from external web search to preserve zero-compute guarantee.",
      suggestedQueries: []
    };
  }

  public async executeResearch(gate: RealityGateAnalysis, input: ChangeImpactRequest): Promise<ParallelResearchData | undefined> {
    if (!gate.requiresExternalResearch) {
      return undefined;
    }

    const query = gate.suggestedQueries?.[0] || `filmmaking production safety ${input.changedEntities.join(" ") || "protocols"}`;
    const searchStart = performance.now();
    const searchResult = await executeServerParallelSearch(query, "Production factual verification");
    const latencyMs = Math.round(performance.now() - searchStart);

    const status: ParallelResearchData["status"] = searchResult.isLiveApi
      ? (searchResult.sources.length > 0 ? "VERIFIED" : "UNRESOLVED")
      : (CONFIG.parallelApiKey ? "ERROR" : "NOT_CHECKED");

    return {
      query,
      isLiveApi: searchResult.isLiveApi,
      latencyMs,
      sources: searchResult.sources,
      searchId: searchResult.searchId,
      status
    };
  }

  protected async *runAsyncImpl(context: InvocationContext): AsyncGenerator<Event, void, void> {
    const sessionState = (context.session as any)?.state;
    const input: ChangeImpactRequest = (sessionState?.get?.("changeInput") as ChangeImpactRequest) || {
      projectTitle: "Untitled Screenplay",
      sceneNumber: 1,
      beforeText: "",
      afterText: "",
      changedEntities: []
    };

    const gate = this.evaluateGate(input);
    const research = await this.executeResearch(gate, input);

    if (sessionState?.set) {
      sessionState.set("realityGate", gate);
      sessionState.set("parallelResearch", research);
    }

    yield createEvent({
      id: `evt-reality-${Date.now()}`,
      invocationId: context.invocationId || `inv-adk-${Date.now()}`,
      author: this.name,
      timestamp: Date.now(),
      content: {
        parts: [
          {
            text: JSON.stringify({
              agent: this.name,
              realityGate: gate,
              parallelExecuted: Boolean(research),
              liveApi: research?.isLiveApi || false,
              sourceCount: research?.sources.length || 0
            })
          }
        ]
      }
    });
  }

  protected async *runLiveImpl(): AsyncGenerator<Event, void, void> {}
}
