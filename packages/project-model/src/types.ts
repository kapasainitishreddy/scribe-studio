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
  | "medium-wide"
  | "medium"
  | "medium-close-up"
  | "close-up"
  | "extreme-close-up"
  | "insert"
  | "over-shoulder"
  | "over-the-shoulder"
  | "pov"
  | "two-shot";

export type CameraAngle =
  | "eye-level"
  | "low-angle"
  | "high-angle"
  | "dutch-angle"
  | "birds-eye"
  | "worms-eye";

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

// -------------------------------------------------------------
// Scene Extraction & Beat Intelligence Models
// -------------------------------------------------------------
export interface SceneBeat {
  id: string;
  sceneNumber: number;
  beatNumber: number;
  description: string;
  characters: string[];
  action: string;
  dialogue?: string;
  speaker?: string;
  emotion: string;
  subLocation?: string;
  props: string[];
  continuityState?: string;
  storySignificance: "crucial" | "progression" | "flavor" | "transitional";
  estimatedDurationSec: number;
  visualPriority: "high" | "medium" | "low";
  cameraOpportunities: string[];
  sourceLineIds: string[];
}

export interface SceneExtraction {
  sceneId: string;
  sceneNumber: number;
  slugline: string;
  location: string;
  interiorExterior: "INT" | "EXT" | "INT/EXT";
  timeOfDay: string;
  estimatedDurationSec: number;
  charactersPresent: string[];
  charactersSpeaking: string[];
  characterEntrances: string[];
  characterExits: string[];
  dialogueBlocks: { speaker: string; text: string; parenthetical?: string; lineId: string }[];
  actionBeats: string[];
  storyBeats: SceneBeat[];
  emotionalBeats: string[];
  turningPoints: string[];
  conflict: string;
  sceneObjective: string;
  characterObjectives: Record<string, string>;
  reversal?: string;
  reveal?: string;
  setup?: string;
  payoff?: string;
  props: string[];
  wardrobe: string[];
  vehicles: string[];
  animals: string[];
  extras: string[];
  stunts: string[];
  vfx: string[];
  sfx: string[];
  soundCues: string[];
  musicCues: string[];
  importantObjects: string[];
  productionRequirements: string[];
  continuityState: string[];
  characterKnowledgeChanges: { characterId: string; fact: string }[];
  visualMotifs: string[];
  importantGestures: string[];
  possibleShots: string[];
  researchDependencies: string[];
  lastExtractedAt: string;
}

// -------------------------------------------------------------
// Scene Comic / Storyboard Visual Script Models
// -------------------------------------------------------------
export type StoryboardPanelStatus = "DRAFT" | "GENERATED" | "APPROVED" | "LOCKED" | "OUTDATED";
export type ComicBubbleType = "speech" | "thought" | "off-screen" | "voice-over" | "caption" | "sfx";

export interface StoryboardPanel {
  id: string;
  sequenceId: string;
  sceneNumber: number;
  beatId: string;
  panelNumber: number;
  shotType: ShotSize;
  cameraAngle: "eye-level" | "low-angle" | "high-angle" | "dutch-angle" | "birds-eye" | "worms-eye";
  lensSuggestion?: string;
  cameraMovement?: string;
  composition: string;
  charactersVisible: string[];
  characterPositions?: Record<string, { x: number; y: number }>;
  characterExpressions?: Record<string, string>;
  action: string;
  dialogue?: string;
  dialogueSpeaker?: string;
  caption?: string;
  bubbleType?: ComicBubbleType;
  location: string;
  propsVisible: string[];
  lightingIntent: string;
  mood: string;
  colorMood?: string;
  continuityReferences: string[];
  directorNotes: string;
  generationPrompt: string;
  imageAsset?: string; // Data URL, image path, or SVG schematic
  svgSchematic?: string; // Deterministic schematic visual
  version: number;
  status: StoryboardPanelStatus;
  outdatedReason?: string;
  invalidationReason?: string;
  sourceLineIds: string[];
}

export interface StoryboardSequence {
  id: string;
  sceneNumber: number;
  title: string;
  layout: "1-panel" | "2-panel" | "3-panel" | "4-panel" | "6-panel" | "contact-sheet" | "strip";
  panels: StoryboardPanel[];
  aspectRatio: "16:9" | "2.39:1" | "4:3" | "1:1";
  updatedAt: string;
}

// -------------------------------------------------------------
// Story Threads & Narrative Arcs
// -------------------------------------------------------------
export interface StoryThread {
  id: string;
  title: string;
  category: "plot" | "character-arc" | "mystery" | "prop" | "relationship";
  description: string;
  firstSeenSceneNumber: number;
  scenesInvolved: number[];
  charactersInvolved: string[];
  setups: { sceneNumber: number; description: string }[];
  payoffs: { sceneNumber: number; description: string; resolved: boolean }[];
  unresolvedPoints: string[];
  status: "active" | "resolved" | "abandoned";
}

// -------------------------------------------------------------
// Scene Health Overview
// -------------------------------------------------------------
export interface SceneHealthSummary {
  sceneNumber: number;
  characterCount: number;
  continuityDependenciesCount: number;
  unresolvedSetupsCount: number;
  propsCount: number;
  researchFindingsCount: number;
  storyboardPanelsCount: number;
  staleArtifactsCount: number;
  status: "healthy" | "needs-attention" | "stale-artifacts";
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
export type EvidenceState = "VERIFIED" | "SUPPORTED" | "POTENTIAL_CONFLICT" | "UNRESOLVED" | "INTENTIONAL_CHANGE" | "NOT_CHECKED" | "ERROR";

export interface ContinuityIssue {
  id: string;
  category: "teleportation" | "prop" | "wardrobe" | "injury" | "knowledge" | "time" | "setup-payoff";
  severity: ContinuitySeverity;
  affectedScenes: number[];
  affectedCharacters: string[];
  headline: string;
  reason: string;
  supportingEvidence: string;
  evidenceState?: EvidenceState;
  screenplayLineId?: string;
  textExcerpt?: string;
  suggestedResolution: string;
  status: "active" | "dismissed" | "intentional" | "resolved";
  createdAt: string;
}

export interface PassportCitation {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface ProductionChangePassport {
  id: string;
  timestamp: string;
  sceneNumber: number;
  beforeHash: string;
  afterHash: string;
  humanDiffSummary: string;
  changedAstNodes: string[];
  changedEntities: string[];
  affectedArtifactIds: string[];
  protectedArtifactIds: string[];
  continuityFindings: Array<{
    category: string;
    issue: string;
    evidenceState: EvidenceState;
    screenplayCitation: string;
    actionNeeded: string;
  }>;
  realityGate: {
    requiresExternalResearch: boolean;
    reason: string;
    topic?: string;
  };
  parallelCitations: PassportCitation[];
  aiProposals: Array<{
    target: string;
    proposal: string;
    isScribeProposal: true;
  }>;
  humanDecision: "pending" | "approved" | "rejected";
  decisionTimestamp?: string;
  regeneratedArtifactIds: string[];
  preservedArtifactIds: string[];
  beforeConsistencyStatus: string;
  afterConsistencyStatus: string;
  provenance: {
    adkVersion: string;
    model: string;
    toolCalls: string[];
    latencyMs: number;
    isLiveParallel: boolean;
  };
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
  topic?: string;
  summary: string;
  conclusion: string;
  confidence: number;
  sources: ParallelSource[];
  status: "APPROVED" | "REJECTED" | "NEEDS REVIEW" | "UNRESOLVED" | "NOT_CHECKED";
  evidenceState?: EvidenceState;
  retrievedAt: string;
  isParallelApiResult: boolean;
  claim?: string;
  evidence?: string;
  whyThisMatters?: string;
  proposedResponse?: string;
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
  staleStoryboardPanels: string[]; // panel IDs
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
  staleStoryboardCount: number;
  staleStoryboardPanels?: string[];
  adkExecution?: {
    runId: string;
    agentsInvoked: string[];
    eventCount: number;
  };
  executionTrace?: {
    totalMs: number;
    adkReasoningMs: number;
    parallelSearchMs: number;
    model: string;
    geminiStatus: string;
    adkStatus: string;
  };
  affectedInternalNodes?: string[];
  unaffectedProtectedNodes?: string[];
}

export interface VerificationMetrics {
  continuityIssues: number;
  staleActorPackets: number;
  staleStoryboardPanels: number;
  productionMismatches: number;
  unresolvedDependencies: number;
}

export interface VerificationReport {
  id: string;
  timestamp: string;
  sourceEvent: string;
  beforeMetrics: VerificationMetrics;
  afterMetrics: VerificationMetrics;
  unaffectedArtifactsRegenerated: number; // Strictly 0 in selective invalidation
  verifiedCanonCount: number;
  status: "PASS" | "FAIL";
  checkedEngines: string[];
  auditNotes: string[];
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
  extractions: Record<number, SceneExtraction>;
  storyboardSequences: Record<string | number, StoryboardSequence>;
  storyThreads: StoryThread[];
  latestImpactReport: ConsolidatedImpactReport | null;
  latestVerificationReport?: VerificationReport | null;
  propagationState: PropagationState;
  changePassports?: ProductionChangePassport[];
  activeChangePassport?: ProductionChangePassport | null;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Editorial Timeline Foundation & NLE Interoperability Models
// Compatible conceptually with OpenTimelineIO, EDL, and NLE pipelines
// -------------------------------------------------------------
export type EditorialTrackType = "video" | "audio" | "dialogue" | "subtitles" | "effects";

export interface EditorialClip {
  id: string;
  name: string;
  sceneNumber: number;
  beatId?: string;
  shotId?: string;
  storyboardPanelId?: string;
  startFrame: number;
  durationFrames: number;
  durationSeconds: number;
  mediaType: "canvas-schematic" | "video-render" | "audio-dialogue" | "text-subtitle";
  sourceReference?: string;
  status: "APPROVED" | "OUTDATED" | "LOCKED" | "DRAFT";
  metadata: {
    lens?: string;
    shotType?: string;
    cameraMovement?: string;
    dialogueText?: string;
    speaker?: string;
    charactersVisible?: string[];
    isStale?: boolean;
    hash?: string;
  };
}

export interface EditorialTrack {
  id: string;
  name: string;
  kind: EditorialTrackType;
  clips: EditorialClip[];
}

export interface EditorialTimeline {
  id: string;
  projectId: string;
  sceneNumber: number;
  revisionId: string;
  fps: number;
  timecodeStart: string;
  totalDurationFrames: number;
  totalDurationSeconds: number;
  tracks: EditorialTrack[];
  createdAt: string;
  updatedAt: string;
}

