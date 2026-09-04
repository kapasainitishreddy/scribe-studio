# Agentic Cinema — Data Model Specification

## 1. Normalized Core Entities

### 1.1 Project & Screenplay Schema
```typescript
export interface Project {
  id: string;                         // UUID
  title: string;                      // Project Title
  author: string;                     // Writer / Filmmaker
  synopsis: string;                   // High-level summary
  screenplay: Screenplay;             // Current active screenplay
  canon: CanonState;                  // Story bible and truth graph
  breakdown: ProjectBreakdown;        // Scene breakdowns across 16 categories
  actorPackets: Record<string, ActorPacket>; // Character-keyed actor packets
  shotLists: Record<string, ShotList>;       // Scene-keyed shot lists
  revisions: RevisionRecord[];        // Immutable historical snapshots
  continuityIssues: ContinuityIssue[];// Inferred and flagged continuity items
  meetingNotes: StickyNote[];         // Extracted table read / meeting notes
  corkboardCards: CorkboardCard[];    // Corkboard beats and cards
  propagationState: PropagationState; // Dependency tracking and stale flags
  settings: ProjectSettings;          // AI providers, typography, preferences
  createdAt: string;
  updatedAt: string;
}

export interface Screenplay {
  id: string;
  version: number;
  rawText: string;                    // Fountain-compatible source text
  lines: ScreenplayLine[];            // Typed line tokens
  scenes: ScreenplayScene[];          // Parsed scene boundaries
}

export interface ScreenplayLine {
  id: string;                         // Deterministic line hash id
  sceneId: string | null;
  kind: "scene-heading" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "shot" | "blank";
  text: string;
  speaker: string | null;             // Extracted speaker if dialogue/parenthetical
  lineNumber: number;
}

export interface ScreenplayScene {
  id: string;                         // Stable scene ID
  number: number;                     // 1-indexed scene number
  heading: string;                    // Full heading text (e.g. INT. SAFE HOUSE - NIGHT)
  intExt: "INT" | "EXT" | "INT/EXT" | "EST" | "OTHER";
  location: string;                   // Normalized location name
  timeOfDay: string;                  // DAY, NIGHT, DUSK, DAWN, CONTINUOUS, etc.
  startLine: number;
  endLine: number;
  characterIds: string[];             // Characters speaking or present
  propIds: string[];                  // Props referenced in this scene
  summary?: string;                   // Scene synopsis
}
```

---

### 1.2 Story Bible & Canon Schema
```typescript
export type CanonFactStatus = "proposed" | "approved" | "locked" | "superseded";

export interface CanonFact {
  id: string;
  category: "character" | "location" | "prop" | "world-rule" | "relationship" | "secret" | "timeline";
  entityId?: string;                  // Associated entity if applicable
  title: string;
  statement: string;                  // Factual assertion
  status: CanonFactStatus;
  firstSeenSceneNumber?: number;
  sourceLineIds: string[];
  supersededBy?: string;              // Fact ID that overrides this
  locked: boolean;                    // If true, AI agents cannot alter
}

export interface Character {
  id: string;                         // Stable slug ID
  name: string;
  normalizedName: string;
  role: "lead" | "supporting" | "minor" | "cameo";
  biography: string;
  traits: string[];
  voiceNotes: string;                 // Speaking style, dialect, vocabulary
  arcSummary: string;
  currentKnowledge: Record<number, string[]>; // Scene number -> known facts
  secrets: string[];
  wardrobeNotes: string;
  relationships: CharacterRelationship[];
}

export interface CharacterRelationship {
  targetCharacterId: string;
  relationshipType: string;           // Ally, Rival, Sibling, Secret Informant
  notes: string;
}
```

---

### 1.3 Production Breakdown Schema
```typescript
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
```

---

### 1.4 Actor Packet Schema
```typescript
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

export interface ActorPacketScene {
  sceneNumber: number;
  sceneHeading: string;
  dramaticObjective: string;
  emotionalState: string;
  wardrobeCheck: string;
  propsRequired: string[];
  cues: ActorCueBlock[];
}

export interface ActorCueBlock {
  cueLine: string;                    // Preceding line spoken by another character
  cueSpeaker: string;
  dialogueLines: string[];            // Spoken dialogue by this character
  parenthetical?: string;
}
```

---

### 1.5 The Propagation State Schema
```typescript
export interface PropagationState {
  lastEvaluatedVersion: number;
  staleActorPackets: string[];        // Character IDs needing regeneration
  staleShotLists: string[];           // Scene IDs needing review
  staleBreakdownScenes: string[];     // Scene IDs needing breakdown recheck
  flaggedContinuityScenes: string[];  // Scene IDs with new continuity checks
  auditTrail: PropagationEvent[];
}

export interface PropagationEvent {
  timestamp: string;
  source: "user-edit" | "agent-proposal-applied" | "reversion";
  affectedScenes: number[];
  affectedCharacters: string[];
  invalidations: string[];
}
```

---

### 1.6 Revisions Schema
```typescript
export type RevisionColor =
  | "White"      // Draft 1
  | "Blue"       // Rev 1
  | "Pink"       // Rev 2
  | "Yellow"     // Rev 3
  | "Green"      // Rev 4
  | "Goldenrod"  // Rev 5
  | "Buff"       // Rev 6
  | "Salmon"     // Rev 7
  | "Cherry";    // Rev 8

export interface RevisionRecord {
  id: string;
  color: RevisionColor;
  label: string;                      // e.g. "Production Polish Draft"
  screenplayText: string;
  createdAt: string;
  author: string;
  summaryOfChanges: string;
  changedSceneNumbers: number[];
}
```
