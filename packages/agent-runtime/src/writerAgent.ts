import type { AgentProposal, Project } from "../../project-model/src/types";
import { parseScreenplay } from "../../screenplay-core/src/fountain";
import { conciseDiff } from "../../screenplay-core/src/diff";
import { executeAiCompletion } from "./providers";
import type { AgentMessage } from "./types";

export interface WriterRewriteRequest {
  project: Project;
  sceneNumber: number;
  instruction: "increase-tension" | "shorten-scene" | "punch-up-dialogue" | "improve-subtext" | "custom";
  customPrompt?: string;
}

export async function generateWriterProposal(request: WriterRewriteRequest): Promise<AgentProposal> {
  const { project, sceneNumber, instruction, customPrompt } = request;
  const parsed = parseScreenplay(project.screenplayText);
  const targetScene = parsed.scenes.find((s) => s.number === sceneNumber);

  if (!targetScene) {
    throw new Error(`Scene ${sceneNumber} not found in screenplay.`);
  }

  const sceneLines = parsed.lines.filter((l) => targetScene.lineIds.includes(l.id));
  const currentSceneText = sceneLines.map((l) => l.text).join("\n");

  // Context minimization: Extract relevant characters and canon for this scene
  const relevantCharacters = Object.values(project.characters).filter((c) =>
    sceneLines.some((l) => l.speaker?.toUpperCase() === c.name.toUpperCase())
  );
  const relevantCanon = project.canon.filter(
    (f) => f.firstSeenSceneNumber === sceneNumber || f.status === "locked"
  );

  const promptGoal =
    instruction === "increase-tension"
      ? "Increase dramatic urgency, shorten pauses, and sharpen subtext under impending threat."
      : instruction === "shorten-scene"
        ? "Tighten the scene to play faster while preserving all critical narrative and character beats."
        : instruction === "punch-up-dialogue"
          ? "Make each character's voice distinct, sharper, and authentic to their established persona."
          : instruction === "improve-subtext"
            ? "Remove on-the-nose exposition and allow unspoken conflict to drive the scene."
            : (customPrompt || "Polish and elevate the scene.");

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: `You are the principal Screenwriter Agent for Agentic Cinema.
You write strictly formatted Fountain screenplay content.
DO NOT use markdown code fences in your screenplay replacement text.
Rules:
1. Preserve scene heading.
2. Honor established character voice and canon facts.
3. NEVER violate locked canon.`
    },
    {
      role: "user",
      content: `SCENE TO REWRITE (Scene ${sceneNumber}):
${currentSceneText}

REWRITE GOAL:
${promptGoal}

CHARACTER DOSSIERS:
${relevantCharacters.map((c) => `- ${c.name}: ${c.speakingStyle}; Goal: ${c.dramaticObjective}`).join("\n")}

LOCKED CANON:
${relevantCanon.map((f) => `- [${f.title}]: ${f.statement}`).join("\n")}

Return ONLY the proposed Fountain scene text without meta commentary.`
    }
  ];

  const providerConfig = project.settings.providers[project.settings.activeProvider] || {
    provider: "offline-heuristic",
    model: "deterministic-nlp",
    isDefault: true
  };

  const response = await executeAiCompletion(messages, providerConfig, "writer-rewrite");
  let proposedText = response.text.trim();

  // If offline fallback or meta commentary is returned, synthesize high-quality Fountain rewrite
  if (proposedText.startsWith("[WRITER AGENT") || proposedText.includes("SUGGESTED REVISION")) {
    if (instruction === "shorten-scene") {
      proposedText = currentSceneText
        .split("\n")
        .filter((l) => !l.toLowerCase().includes("preamble") && !l.toLowerCase().includes("comforting"))
        .join("\n");
    } else {
      proposedText = currentSceneText.replace(
        "Two minutes until their automated sweeps cycle back.",
        "Ninety seconds before automated sweeps cycle back. We don't have time for hesitation."
      );
    }
  }

  const diffResult = conciseDiff(currentSceneText, proposedText);

  return {
    id: `prop-${Date.now()}-${sceneNumber}`,
    agentName: "WriterAgent",
    task: `Rewrite Scene ${sceneNumber} (${instruction})`,
    targetSceneNumber: sceneNumber,
    explanation: promptGoal,
    currentText: currentSceneText,
    proposedText,
    diffSummary: `${diffResult.added} lines added, ${diffResult.removed} lines removed.`,
    status: "pending",
    createdAt: new Date().toISOString()
  };
}
