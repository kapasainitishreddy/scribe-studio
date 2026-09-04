import type { ScreenplayLine, ParsedScene, ScreenplayStats } from "../../screenplay-core/src/types";

export type CanonFactCategory =
  | "character"
  | "location"
  | "prop"
  | "world-rule"
  | "relationship"
  | "secret"
  | "timeline"
  | "theme"
  | "real-world-fact";

export type CanonFactStatus = "proposed" | "approved" | "locked" | "superseded";

export interface CanonFact {
  id: string;
  category: CanonFactCategory;
  entityId?: string;
  title: string;
  statement: string;
  status: CanonFactStatus;
  firstSeenSceneNumber?: number;
  sourceLineIds: string[];
  supersededBy?: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRelationship {
  targetCharacterId: string;
  targetCharacterName: string;
  relationshipType: string;
  notes: string;
}

export interface CharacterPersona {
  id: string;
  name: string;
  normalizedName: string;
  role: "lead" | "supporting" | "minor" | "cameo";
  biography: string;
  traits: string[];
  speakingStyle: string;
  vocabularyNotes: string;
  dramaticObjective: string;
  fears: string[];
  secrets: string[];
  injuries: string[];
  wardrobeNotes: string;
  knowledgeByScene: Record<number, string[]>; // scene number -> facts known
  relationships: CharacterRelationship[];
}

export type BreakdownCategory =
  | "cast"
  | "extras"
  | "props"
  | "wardrobe"
  | "vehicles"
  | "sfx"
  | "vfx"
  | "stunts"
  | "animals"
  | "makeup"
  | "sound"
  | "equipment"
  | "set-dressing"
  | "music"
  | "greenery"
  | "special";

export interface BreakdownElement {
  id: string;
  sceneId: string;
  sceneNumber: number;
  category: BreakdownCategory;
  name: string;
  quantity?: number;
  notes?: string;
  isAiSuggested: boolean;
  isConfirmed: boolean;
  locked: boolean;
}

export interface ProjectBreakdown {
  elements: BreakdownElement[];
  lastUpdated: string;
}

export interface ActorCueBlock {
  cueSpeaker: string;
  cueLine: string;
  dialogueLines: string[];
  parenthetical?: string;
  lineId: string;
}

export interface ActorPacketScene {
  sceneId: string;
  sceneNumber: number;
  sceneHeading: string;
  dramaticObjective: string;
  emotionalState: string;
  wardrobeCheck: string;
  propsRequired: string[];
  secretsKnown: string[];
  cues: ActorCueBlock[];
}

export interface ActorPacket {
  id: string;
  characterId: string;
  characterName: string;
  lastGeneratedAt: string;
  screenplayVersion: number;
  isStale: boolean;
  staleReason?: string;
  staleDiffPreview?: string;
  scenes: ActorPacketScene[];
}

export type ShotSize =
  | "establishing"
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "insert"
  | "over-shoulder"
  | "pov"
  | "two-shot";

export interface ShotItem {
  id: string;
  sceneNumber: number;
  shotNumber: number;
  size: ShotSize;
  lens: string;
  angle: string;
  movement: string;
  description: string;
  visualIntent: string;
  blockingNotes: string;
  sourceLineIds: string[];
  status: "proposed" | "approved" | "completed";
}

export interface ShotList {
  sceneId: string;
  sceneNumber: number;
  shots: ShotItem[];
  isStale: boolean;
  staleReason?: string;
}

export type RevisionColor =
  | "White"
  | "Blue"
  | "Pink"
  | "Yellow"
  | "Green"
  | "Goldenrod"
  | "Buff"
  | "Salmon"
  | "Cherry";

export interface RevisionRecord {
  id: string;
  color: RevisionColor;
  label: string;
  screenplayText: string;
  createdAt: string;
  author: string;
  summaryOfChanges: string;
  changedSceneNumbers: number[];
  stats: ScreenplayStats;
}

export type ContinuitySeverity = "critical" | "warning" | "info";

export interface ContinuityIssue {
  id: string;
  category: "teleportation" | "prop" | "wardrobe" | "injury" | "knowledge" | "time" | "setup-payoff";
  severity: ContinuitySeverity;
  affectedScenes: number[];
  affectedCharacters: string[];
  headline: string;
  reason: string;
  supportingEvidence: string;
  suggestedResolution: string;
  status: "active" | "dismissed" | "intentional" | "resolved";
  createdAt: string;
}

export interface StickyNote {
  id: string;
  sceneNumber?: number;
  characterId?: string;
  type: "decision" | "suggestion" | "action-item" | "continuity" | "production" | "dialogue";
  title: string;
  content: string;
  status: "proposed" | "accepted" | "rejected" | "implemented";
  speaker?: string;
  createdAt: string;
}

export interface CorkboardCard {
  id: string;
  type: "scene" | "beat" | "character" | "plot-thread" | "idea" | "note";
  title: string;
  synopsis: string;
  sceneNumber?: number;
  act: number; // 1, 2, 3
  color: string;
  tags: string[];
  order: number;
}

// -------------------------------------------------------------
// Parallel Search Partner Integration Models
// -------------------------------------------------------------
export interface ParallelSource {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface ResearchFinding {
  id: string;
  sceneNumber: number;
  query: string;
  summary: string;
  conclusion: string;
  confidence: number;
  sources: ParallelSource[];
  status: "APPROVED" | "REJECTED" | "NEEDS REVIEW";
  retrievedAt: string;
  isParallelApiResult: boolean;
}

// -------------------------------------------------------------
// 3D Scene Blocking & Previsualization Models
// -------------------------------------------------------------
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Scene3DObject {
  id: string;
  sceneNumber: number;
  label: string;
  kind: "actor" | "camera" | "prop" | "light" | "vehicle";
  position: Vec3;
  color: string;
  notes?: string;
}

// -------------------------------------------------------------
// Project Dependency Graph Edge
// -------------------------------------------------------------
export interface DependencyEdge {
  id: string;
  source: string; // e.g. "scene-1"
  target: string; // e.g. "actor-maya-lin"
  type: "affects-character" | "requires-prop" | "invalidates-packet" | "grounded-by-research" | "continuity-link";
  label: string;
}

export interface PropagationEvent {
  id: string;
  timestamp: string;
  source: "user-edit" | "agent-proposal-applied" | "reversion";
  affectedScenes: number[];
  affectedCharacters: string[];
  invalidatedArtifacts: string[];
  details: string;
}

export interface PropagationState {
  lastEvaluatedVersion: number;
  staleActorPackets: string[]; // character IDs
  staleShotLists: number[]; // scene numbers
  staleBreakdownScenes: number[]; // scene numbers
  flaggedContinuityScenes: number[]; // scene numbers
  auditTrail: PropagationEvent[];
}

// Google Cloud AI & Parallel Partner Provider Configuration
export type AIProviderName = "google-gemini" | "google-adk" | "parallel-search" | "google-deterministic";

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  isDefault: boolean;
}

export interface ProjectSettings {
  defaultRevisionColor: RevisionColor;
  activeProvider: AIProviderName;
  geminiApiKey?: string;
  parallelApiKey?: string;
  providers: Record<AIProviderName, AIProviderConfig>;
  typography: {
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
  };
  editorMode: "standard" | "focus" | "dual";
  theme: "dark" | "light";
  autosaveIntervalMs: number;
}

export interface AgentProposal {
  id: string;
  agentName: string;
  task: string;
  targetSceneNumber: number;
  targetCharacterId?: string;
  explanation: string;
  currentText: string;
  proposedText: string;
  diffSummary: string;
  status: "pending" | "accepted" | "rejected" | "modified";
  createdAt: string;
}

export interface ConsolidatedImpactReport {
  timestamp: string;
  sceneNumber: number;
  changeSummary: string;
  affectedCanonCount: number;
  affectedCanonTitles: string[];
  continuityIssuesDetected: ContinuityIssue[];
  affectedActorIds: string[];
  staleActorPacketsCount: number;
  affectedBreakdownCount: number;
  affectedBreakdownCategories: string[];
  researchFindings: ResearchFinding[];
  diffPreview: string;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  screenplayText: string;
  version: number;
  characters: Record<string, CharacterPersona>;
  canon: CanonFact[];
  breakdown: ProjectBreakdown;
  actorPackets: Record<string, ActorPacket>;
  shotLists: Record<number, ShotList>;
  revisions: RevisionRecord[];
  continuityIssues: ContinuityIssue[];
  meetingNotes: StickyNote[];
  corkboardCards: CorkboardCard[];
  proposals: AgentProposal[];
  researchFindings: ResearchFinding[];
  scene3DObjects: Scene3DObject[];
  dependencyEdges: DependencyEdge[];
  latestImpactReport: ConsolidatedImpactReport | null;
  propagationState: PropagationState;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}
