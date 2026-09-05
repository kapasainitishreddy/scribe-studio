import { BaseAgent, createEvent, type InvocationContext, type Event } from "@google/adk";
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";
import { RuntimeProofRegistry } from "../runtimeProof.js";
import type { ChangeImpactRequest, ContinuityFinding } from "../schemas.js";
import { ContinuityFindingSchema } from "../schemas.js";
import { z } from "zod";

export class ContinuityReasoningAgent extends BaseAgent {
  constructor() {
    super({
      name: "ContinuityReasoningAgent",
      description: "Analyzes screenplay AST diffs for character presence, time-of-day progression, and physical prop state."
    });
  }

  public async analyzeContinuity(
    input: ChangeImpactRequest,
    parallelSources: any[] = []
  ): Promise<{ findings: ContinuityFinding[]; geminiStatus: "VERIFIED" | "NOT_CONFIGURED" | "ERROR"; latencyMs: number }> {
    const startTime = performance.now();
    const model = "gemini-2.5-flash";

    if (CONFIG.geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
        const prompt = `You are Scribe Studio's Senior Script Supervisor Agent.
Project: "${input.projectTitle}"
Scene: ${input.sceneNumber}
BEFORE:
${input.beforeText}

AFTER:
${input.afterText}

Entities Changed: ${input.changedEntities.join(", ") || "none specified"}
External Web Evidence: ${JSON.stringify(parallelSources)}

Evaluate continuity ripple effects. Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "category": "Character State | Prop Continuity | Time Discontinuity | Spatial Logic",
    "issue": "Specific explanation of what was modified or disrupted",
    "evidenceState": "VERIFIED | SUPPORTED | POTENTIAL_CONFLICT | UNRESOLVED | INTENTIONAL_CHANGE",
    "screenplayCitation": "Relevant quote from modified text",
    "actionNeeded": "Precise production action required to maintain continuity"
  }
]`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const latencyMs = Math.round(performance.now() - startTime);
        const text = response.text || "[]";
        const parsed = JSON.parse(text);
        const validated = z.array(ContinuityFindingSchema).safeParse(parsed);

        if (validated.success && validated.data.length > 0) {
          RuntimeProofRegistry.get().recordGeminiSuccess(latencyMs, model);
          return { findings: validated.data, geminiStatus: "VERIFIED", latencyMs };
        }
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime);
        console.warn("ContinuityReasoningAgent Gemini call failed:", err.message);
        RuntimeProofRegistry.get().recordGeminiError(latencyMs);
      }
    }

    // Grounded deterministic continuity evaluation
    const latencyMs = Math.round(performance.now() - startTime);
    const combined = (input.beforeText + " " + input.afterText).toLowerCase();
    const hasProps = input.changedEntities.length > 0 || combined.includes("drive") || combined.includes("weapon") || combined.includes("gun") || combined.includes("key");

    const deterministicFindings: ContinuityFinding[] = [
      {
        category: hasProps ? "Prop Continuity" : "Narrative Dialogue",
        issue: hasProps
          ? `Physical modification of [${input.changedEntities.join(", ") || "prop"}] alters possession state across Scene ${input.sceneNumber}.`
          : `Dialogue adjustment in Scene ${input.sceneNumber} maintains character emotional arc without physical prop disruption.`,
        evidenceState: hasProps ? "POTENTIAL_CONFLICT" : "INTENTIONAL_CHANGE",
        screenplayCitation: `Scene ${input.sceneNumber}: "${input.afterText.slice(0, 70).trim()}..."`,
        actionNeeded: hasProps
          ? `Re-verify downstream actor sides and prop dispatch for scenes referencing ${input.changedEntities.join(", ") || "modified props"}.`
          : "Archive revised dialogue cue in master continuity log."
      }
    ];

    return {
      findings: deterministicFindings,
      geminiStatus: CONFIG.geminiApiKey ? "ERROR" : "NOT_CONFIGURED",
      latencyMs
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
    const research = sessionState?.get?.("parallelResearch") as any;
    const sources = research?.sources || [];

    const result = await this.analyzeContinuity(input, sources);

    if (sessionState?.set) {
      sessionState.set("continuityFindings", result.findings);
      sessionState.set("geminiStatus", result.geminiStatus);
      sessionState.set("geminiLatencyMs", result.latencyMs);
    }

    yield createEvent({
      id: `evt-continuity-${Date.now()}`,
      invocationId: context.invocationId || `inv-adk-${Date.now()}`,
      author: this.name,
      timestamp: Date.now(),
      content: {
        parts: [
          {
            text: JSON.stringify({
              agent: this.name,
              findingCount: result.findings.length,
              geminiStatus: result.geminiStatus,
              latencyMs: result.latencyMs
            })
          }
        ]
      }
    });
  }

  protected async *runLiveImpl(): AsyncGenerator<Event, void, void> {}
}
