import type { Project, StickyNote } from "../../project-model/src/types";
import { executeAiCompletion } from "./providers";
import type { AgentMessage } from "./types";

export interface ScribeMeetingRequest {
  project: Project;
  transcriptText: string;
  meetingTitle?: string;
}

export async function processMeetingTranscript(request: ScribeMeetingRequest): Promise<StickyNote[]> {
  const { project, transcriptText, meetingTitle } = request;
  const now = new Date().toISOString();

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: `You are the Scribe Meeting Agent for Agentic Cinema.
Analyze the following meeting/table-read transcript and extract actionable structured notes.
Return ONLY a valid JSON array of objects with keys:
- type: "decision" | "suggestion" | "action-item" | "continuity" | "production" | "dialogue"
- title: string
- content: string
- sceneNumber?: number
- characterId?: string
- speaker?: string
- status: "proposed" | "accepted"

Example:
Someone says: "Maybe Maya shouldn't reveal the sister until scene 4."
Extract as:
{
  "type": "continuity",
  "title": "Delay Sister Reveal",
  "content": "Maya should not reveal her sister Elena's prototype until Scene 4.",
  "sceneNumber": 4,
  "characterId": "maya-lin",
  "status": "proposed"
}`
    },
    {
      role: "user",
      content: `TRANSCRIPT:\n${transcriptText}`
    }
  ];

  const providerConfig = project.settings.providers[project.settings.activeProvider] || {
    provider: "offline-heuristic",
    model: "deterministic-nlp",
    isDefault: true
  };

  const res = await executeAiCompletion(messages, providerConfig, "scribe-notes");
  let rawNotes: any[] = [];

  try {
    const raw = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    rawNotes = JSON.parse(raw);
  } catch {
    // Fallback heuristic extraction by line scanning
    const lines = transcriptText.split(/\r?\n/).filter((l) => l.trim().length > 10);
    rawNotes = lines.slice(0, 5).map((line, idx) => {
      const isDecision = line.toLowerCase().includes("agree") || line.toLowerCase().includes("decision");
      const isContinuity = line.toLowerCase().includes("scene") || line.toLowerCase().includes("know");
      return {
        type: isDecision ? "decision" : isContinuity ? "continuity" : "suggestion",
        title: line.slice(0, 40) + "...",
        content: line.trim(),
        status: "proposed"
      };
    });
  }

  return rawNotes.map((n, idx) => ({
    id: `scribe-note-${Date.now()}-${idx + 1}`,
    type: n.type || "suggestion",
    title: n.title || "Meeting Note",
    content: n.content || "",
    sceneNumber: n.sceneNumber,
    characterId: n.characterId,
    speaker: n.speaker,
    status: n.status || "proposed",
    createdAt: now
  }));
}
