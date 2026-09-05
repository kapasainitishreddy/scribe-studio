import { BaseAgent, createEvent, type InvocationContext, type Event } from "@google/adk";
import { ContinuityReasoningAgent } from "./continuityReasoningAgent.js";
import { ProductionImpactAgent } from "./productionImpactAgent.js";
import { RealityResearchAgent } from "./realityResearchAgent.js";
import { ConsolidationAgent } from "./consolidationAgent.js";

export class RootProductionAgent extends BaseAgent {
  public readonly realityAgent: RealityResearchAgent;
  public readonly continuityAgent: ContinuityReasoningAgent;
  public readonly impactAgent: ProductionImpactAgent;
  public readonly consolidationAgent: ConsolidationAgent;

  constructor() {
    const realityAgent = new RealityResearchAgent();
    const continuityAgent = new ContinuityReasoningAgent();
    const impactAgent = new ProductionImpactAgent();
    const consolidationAgent = new ConsolidationAgent();

    super({
      name: "RootProductionAgent",
      description: "Executive multi-agent coordinator for screenplay change intelligence, dispatching continuity, reality research, departmental impact, and consolidation agents.",
      subAgents: [realityAgent, continuityAgent, impactAgent, consolidationAgent]
    });

    this.realityAgent = realityAgent;
    this.continuityAgent = continuityAgent;
    this.impactAgent = impactAgent;
    this.consolidationAgent = consolidationAgent;
  }

  protected async *runAsyncImpl(context: InvocationContext): AsyncGenerator<Event, void, void> {
    const invocationId = context.invocationId || `inv-adk-${Date.now()}`;

    // 1. Root Lifecycle: Start
    yield createEvent({
      id: `evt-root-start-${Date.now()}`,
      invocationId,
      author: this.name,
      timestamp: Date.now(),
      content: {
        parts: [{ text: "RootProductionAgent: Commencing orchestrated multi-agent evaluation." }]
      }
    });

    // 2. Step 1: Reality Gate & Parallel Research
    for await (const evt of this.realityAgent.runAsync(context)) {
      yield evt;
    }

    // 3. Step 2: Continuity Reasoning
    for await (const evt of this.continuityAgent.runAsync(context)) {
      yield evt;
    }

    // 4. Step 3: Production Impact
    for await (const evt of this.impactAgent.runAsync(context)) {
      yield evt;
    }

    // 5. Step 4: Consolidation & Blast Radius
    for await (const evt of this.consolidationAgent.runAsync(context)) {
      yield evt;
    }

    // 6. Root Lifecycle: Complete
    yield createEvent({
      id: `evt-root-complete-${Date.now()}`,
      invocationId,
      author: this.name,
      timestamp: Date.now(),
      content: {
        parts: [{ text: "RootProductionAgent: Multi-agent evaluation complete. Production Change Passport ready for human review." }]
      }
    });
  }

  protected async *runLiveImpl(): AsyncGenerator<Event, void, void> {}
}
