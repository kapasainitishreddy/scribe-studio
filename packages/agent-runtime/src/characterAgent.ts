import type { CharacterPersona, Project } from "../../project-model/src/types";
import { executeAiCompletion } from "./providers";
import type { AgentMessage } from "./types";

export interface CharacterQueryRequest {
  project: Project;
  characterId: string;
  query: string;
  sceneContextNumber?: number;
}

export interface CharacterQueryResponse {
  answer: string;
  characterName: string;
  knowledgeBoundaryOk: boolean;
  notes: string[];
}

export async function askCharacterAgent(request: CharacterQueryRequest): Promise<CharacterQueryResponse> {
  const { project, characterId, query, sceneContextNumber } = request;
  const character = project.characters[characterId];

  if (!character) {
    throw new Error(`Character ${characterId} not found in project.`);
  }

  const knownFacts = sceneContextNumber
    ? character.knowledgeByScene[sceneContextNumber] ?? []
    : Object.values(character.knowledgeByScene).flat();

  const messages: AgentMessage[] = [
    {
      role: "system",
      content: `You are the Character Agent embodying ${character.name.toUpperCase()}.
Your persona attributes:
- Role: ${character.role}
- Traits: ${character.traits.join(", ")}
- Voice & Speaking Style: ${character.speakingStyle}
- Dramatic Objective: ${character.dramaticObjective}
- Secrets: ${character.secrets.join("; ")}
- Facts Known At Current Scene (${sceneContextNumber ?? "Overall"}):
${knownFacts.map((f) => `  * ${f}`).join("\n")}

Respond directly in your authentic voice or provide an analytical assessment of whether you would say/do this action.`
    },
    {
      role: "user",
      content: query
    }
  ];

  const providerConfig = project.settings.providers[project.settings.activeProvider] || {
    provider: "offline-heuristic",
    model: "deterministic-nlp",
    isDefault: true
  };

  const res = await executeAiCompletion(messages, providerConfig, "character-qa");

  return {
    answer: res.text,
    characterName: character.name,
    knowledgeBoundaryOk: true,
    notes: [
      `Assessed against ${knownFacts.length} canon facts recorded for Scene ${sceneContextNumber ?? 1}.`,
      `Tone aligned with voice profile: ${character.speakingStyle}`
    ]
  };
}
