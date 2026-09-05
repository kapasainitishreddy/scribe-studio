import { BaseAgent, createEvent, type InvocationContext, type Event } from "@google/adk";
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";
import type { ChangeImpactRequest, ProductionImplications } from "../schemas.js";
import { ProductionImplicationsSchema } from "../schemas.js";

export class ProductionImpactAgent extends BaseAgent {
  constructor() {
    super({
      name: "ProductionImpactAgent",
      description: "Determines cross-departmental impact on Props, Wardrobe, Camera blocking, Sound, and Logistics."
    });
  }

  public async evaluateImpact(input: ChangeImpactRequest): Promise<ProductionImplications> {
    const model = "gemini-2.5-flash";

    if (CONFIG.geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
        const prompt = `You are Scribe Studio's Production Coordinator Agent.
Scene: ${input.sceneNumber}
Changed: ${input.beforeText} -> ${input.afterText}
Entities: ${input.changedEntities.join(", ")}

Provide departmental production implications in valid JSON with schema:
{
  "props": ["array of specific prop actions"],
  "wardrobe": ["array of wardrobe continuity notes"],
  "cameraSetupNotes": ["array of camera/lighting adjustments"],
  "actorPreparation": ["array of actor sides or rehearsal adjustments"],
  "departmentAlerts": [
    { "department": "string", "alert": "string", "severity": "low|medium|high" }
  ]
}`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        const validated = ProductionImplicationsSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch (e: any) {
        console.warn("ProductionImpactAgent Gemini call fallback:", e.message);
      }
    }

    // Dynamic deterministic departmental derivation
    const entities = input.changedEntities;

    return {
      props: entities.length > 0 ? entities : ["Check physical set dressing for match continuity"],
      wardrobe: [
        `Maintain costume weathering and continuity markers from Scene ${Math.max(1, input.sceneNumber - 1)}.`
      ],
      cameraSetupNotes: [
        `Reframe coverage in Scene ${input.sceneNumber} to emphasize focal interaction.`,
        "Verify lighting package color balance for modified staging."
      ],
      actorPreparation: [
        `Issue updated actor sides for Scene ${input.sceneNumber}.`,
        "Brief talent on altered physical blocking and line pacing."
      ],
      departmentAlerts: entities.length > 0
        ? [{ department: "Props", alert: `Active asset change: ${entities.join(", ")}`, severity: "medium" }]
        : []
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

    const implications = await this.evaluateImpact(input);

    if (sessionState?.set) {
      sessionState.set("productionImplications", implications);
    }

    yield createEvent({
      id: `evt-prod-${Date.now()}`,
      invocationId: context.invocationId || `inv-adk-${Date.now()}`,
      author: this.name,
      timestamp: Date.now(),
      content: {
        parts: [
          {
            text: JSON.stringify({
              agent: this.name,
              propsCount: implications.props.length,
              alertsCount: implications.departmentAlerts?.length || 0
            })
          }
        ]
      }
    });
  }

  protected async *runLiveImpl(): AsyncGenerator<Event, void, void> {}
}
