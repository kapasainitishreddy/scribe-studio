import type { AIProviderConfig, AIProviderName, AgentProposal, Project } from "../../project-model/src/types";

export interface AgentContext {
  project: Project;
  sceneNumber?: number;
  characterId?: string;
  userPrompt?: string;
  instruction?: string;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderResponse {
  text: string;
  model: string;
  provider: AIProviderName;
  usage?: { promptTokens?: number; completionTokens?: number };
}
