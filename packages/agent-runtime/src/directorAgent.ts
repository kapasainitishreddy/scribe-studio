import type { Project, ShotItem, ShotList } from "../../project-model/src/types";
import { parseScreenplay } from "../../screenplay-core/src/fountain";
import { executeAiCompletion } from "./providers";
import type { AgentMessage } from "./types";

export async function generateDirectorShotList(project: Project, sceneNumber: number): Promise<ShotList> {
  const parsed = parseScreenplay(project.screenplayText);
  const targetScene = parsed.scenes.find((s) => s.number === sceneNumber);

  if (!targetScene) {
    throw new Error(`Scene ${sceneNumber} not found.`);
  }

  const sceneLines = parsed.lines.filter((l) => targetScene.lineIds.includes(l.id));
  const sceneText = sceneLines.map((l) => l.text).join("\n");

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: `You are the Director Agent for Agentic Cinema.
Generate an industry-standard coverage shot list for the provided scene.
Return a valid JSON array of objects with keys:
- shotNumber: number
- size: "establishing" | "wide" | "medium" | "close-up" | "extreme-close-up" | "insert" | "over-shoulder" | "pov" | "two-shot"
- lens: string (e.g. "24mm", "50mm", "85mm")
- angle: string (e.g. "Low Angle", "Eye Level", "Dutch Angle")
- movement: string (e.g. "Dolly in", "Handheld", "Static")
- description: string
- visualIntent: string
- blockingNotes: string`
    },
    {
      role: "user",
      content: `SCENE ${sceneNumber} (${targetScene.heading}):\n${sceneText}`
    }
  ];

  const providerConfig = project.settings.providers[project.settings.activeProvider] || {
    provider: "offline-heuristic",
    model: "deterministic-nlp",
    isDefault: true
  };

  const res = await executeAiCompletion(messages, providerConfig, "director-shots");
  let shotData: any[] = [];

  try {
    const raw = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    shotData = JSON.parse(raw);
  } catch {
    // Fallback coverage shots
    shotData = [
      {
        shotNumber: 1,
        size: "wide",
        lens: "28mm",
        angle: "Low Angle Slow Push",
        movement: "Slow dolly push",
        description: `Wide master of ${targetScene.location}. Establishes geography and spatial atmosphere.`,
        visualIntent: "Establish environment, tone, and tension.",
        blockingNotes: "Actors enter frame right and establish defensive positions."
      },
      {
        shotNumber: 2,
        size: "medium",
        lens: "40mm",
        angle: "Over Shoulder",
        movement: "Subtle handheld float",
        description: "Over-the-shoulder coverage on principal dialogue exchange.",
        visualIntent: "Draw focus to tactical urgency.",
        blockingNotes: "Actors maintain eye-line contact while checking exits."
      },
      {
        shotNumber: 3,
        size: "close-up",
        lens: "65mm Prime",
        angle: "Eye Level",
        movement: "Locked off",
        description: "Tight close-up on key dramatic reaction.",
        visualIntent: "Highlight personal stakes and internal calculation.",
        blockingNotes: "Subtle facial micro-expressions."
      }
    ];
  }

  const shots: ShotItem[] = shotData.map((s, idx) => ({
    id: `shot-${sceneNumber}-${idx + 1}`,
    sceneNumber,
    shotNumber: s.shotNumber || idx + 1,
    size: s.size || "medium",
    lens: s.lens || "35mm",
    angle: s.angle || "Eye Level",
    movement: s.movement || "Static",
    description: s.description || "Scene coverage",
    visualIntent: s.visualIntent || "Cinematic storytelling",
    blockingNotes: s.blockingNotes || "Standard blocking",
    sourceLineIds: [],
    status: "proposed"
  }));

  return {
    sceneId: targetScene.id,
    sceneNumber,
    shots,
    isStale: false
  };
}
