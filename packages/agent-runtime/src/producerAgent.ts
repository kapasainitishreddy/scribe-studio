import type { Project } from "../../project-model/src/types";
import { calculateProductionLogistics } from "../../production-engine/src/producerLogistics";
import { executeAiCompletion } from "./providers";
import type { AgentMessage } from "./types";

export interface ProducerAssessment {
  logistics: ReturnType<typeof calculateProductionLogistics>;
  executiveSummary: string;
  budgetAssumptions: string[];
  scheduleRecommendations: string[];
}

export async function runProducerAgent(project: Project): Promise<ProducerAssessment> {
  const logistics = calculateProductionLogistics(project);

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: `You are the Producer Agent for Agentic Cinema.
Review the production logistics numbers and provide an executive summary, schedule recommendations, and budget considerations.
Do NOT pretend to know exact monetary amounts without user-supplied rates. Use configurable operational assumptions.`
    },
    {
      role: "user",
      content: `PRODUCTION LOGISTICS:
- Total Scenes: ${logistics.totalScenes}
- Estimated Pages: ${logistics.totalEstimatedPages}
- Unique Locations: ${logistics.uniqueLocationCount} (${logistics.locationsList.join(", ")})
- Night Shoots: ${logistics.nightShootCount}
- Stunt Sequences: ${logistics.stuntScenes.length} (Scenes ${logistics.stuntScenes.join(", ")})
- VFX Sequences: ${logistics.vfxSceneCount}
- Cast Days: ${JSON.stringify(logistics.castDayRequirements)}`
    }
  ];

  const providerConfig = project.settings.providers[project.settings.activeProvider] || {
    provider: "offline-heuristic",
    model: "deterministic-nlp",
    isDefault: true
  };

  const res = await executeAiCompletion(messages, providerConfig, "producer-summary");

  const executiveSummary = res.text.includes("Executive Summary")
    ? res.text
    : `Production Plan Overview:
The current draft comprises ${logistics.totalScenes} scenes across ${logistics.uniqueLocationCount} unique locations.
Target schedule requirement: ~${logistics.estimatedShootingDays} production days based on an average rate of 3.5 pages per day.
Primary logistical risk: ${logistics.nightShootCount} night shoots requiring dedicated night-rate crew turns and specialized generators.`;

  return {
    logistics,
    executiveSummary,
    budgetAssumptions: [
      "Standard 10-hour day base schedule; overtime premiums factored for night exteriors.",
      "Stunt coordination team required for flume drop and door breach sequences.",
      "Tokyo harbor filming requires municipal water runoff permits."
    ],
    scheduleRecommendations: [
      "Block-shoot all Vault 7 interior sequences sequentially before moving unit to location.",
      "Group helipad and rooftop scenes into a single night call."
    ]
  };
}
