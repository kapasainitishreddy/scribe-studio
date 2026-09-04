# Agentic Cinema — Architecture Specification

## 1. System Overview

Agentic Cinema is an AI-native desktop filmmaking workspace. Unlike traditional screenwriting software with appended chat sidebars, Agentic Cinema operates on the foundational principle: **The Screenplay is the Single Source of Truth**.

Every screenplay change is parsed into an abstract syntax tree (AST) and converted into an entity graph. Autonomous specialized agents operate against this structured graph. Crucially, the **Propagation Engine** acts as the central reactive nervous system: any approved mutation to the screenplay calculates an exact blast radius and invalidates only downstream artifacts that depend on the changed scenes or characters.

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|  [Screenplay Editor] [Story Bible] [Corkboard] [Table Read] [Breakdown] [Packets] |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                 STATE REPOSITORY                                  |
|            Zustand Store / Reactive Actions / Local-First Storage Backing         |
+-----------------------------------------------------------------------------------+
       |                                                         ^
       v                                                         |
+------------------------------+             +--------------------------------------+
|       SCREENPLAY ENGINE      |             |          PROPAGATION ENGINE          |
|  - Fountain / FDX / AST      |             |  - Dependency Graph Traversal        |
|  - 54-Line Page Pagination   | ----------> |  - Stale Artifact Invalidation       |
|  - Line & Scene Indexing     |             |  - Targeted Re-analysis Dispatch     |
+------------------------------+             +--------------------------------------+
                                                                 |
       +---------------------------------------------------------+
       |                         |                       |
       v                         v                       v
+---------------+       +------------------+    +------------------+
| ACTOR PACKETS |       | CONTINUITY CHECK |    | BREAKDOWN ENGINE |
| - Filtered    |       | - Teleportation  |    | - 16 Categories  |
| - Stale Diffs |       | - Knowledge      |    | - Auto & Manual  |
| - Sides PDF   |       | - Prop Handoffs  |    | - Schedule Risk  |
+---------------+       +------------------+    +------------------+
                                 ^
                                 |
+-----------------------------------------------------------------------------------+
|                               AGENT RUNTIME & AI LAYER                            |
|  - Multi-Provider: Gemini, OpenAI, Claude, OpenRouter, Local Ollama               |
|  - Deterministic Offline Fallback Engine (Runs without API keys)                  |
|  - Specialized Agents: Writer, Character, Director, Producer, Continuity, Scribe  |
|  - Change Proposal -> Diff Preview -> Safe User Approval Flow                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### 2.1 Screenplay as the Source of Truth
Screenplays are parsed into discrete typed nodes:
- `scene-heading`: Location, Interior/Exterior, Time of Day, Scene Number.
- `action`: Narrative description, physical movement, sound effects.
- `character`: Speaking entity cue.
- `parenthetical`: Delivery instruction or subtext qualifier.
- `dialogue`: Spoken text bound to the preceding character.
- `transition`: Cut, fade, dissolve commands.
- `shot`: Visual framing directives.

Every node possesses a deterministic content hash and stable identifier. Edits update the node graph without destroying unrelated entity references.

### 2.2 The Dependency Propagation Engine
The system maintains an in-memory directed acyclic dependency graph:

$$\text{Scene}_i \longrightarrow \{\text{Characters}, \text{Props}, \text{Locations}, \text{Continuity Facts}\}$$
$$\text{Character}_j \longrightarrow \{\text{Actor Packet}_j, \text{Character Memories}, \text{Character Sides}\}$$
$$\text{Scene}_i \longrightarrow \{\text{Production Breakdown}_i, \text{Shot List}_i, \text{Producer Schedule Metrics}\}$$

When an approved modification occurs in Scene $i$:
1. The **Change Detector** computes an AST diff identifying altered lines.
2. The **Invalidator** flags:
   - `ActorPacket` for any character appearing in Scene $i$ as `STALE (Scene i modified)`.
   - `ShotList` for Scene $i$ as `STALE`.
   - `ProductionBreakdown` for Scene $i$ as `STALE`.
3. The **Targeted Re-analyzer** executes continuity passes specifically for Scene $i$ and any chronological downstream scenes sharing the same props or character knowledge.
4. The UI displays an actionable notification banner detailing the exact ripple effect.

### 2.3 Local-First & Zero Account Friction
- Persistence is completely client-side: structured JSON documents with local backup snapshots and IndexedDB / SQLite architecture.
- Projects can be imported, exported, and worked on fully offline.
- Secrets (API keys) are kept in secure local storage and are never transmitted to third parties except directly to the configured provider API endpoint.

### 2.4 Multi-Provider & Offline Fallback AI Runtime
The application supports:
1. **Cloud Providers**: Google Gemini, OpenAI, Anthropic Claude, OpenRouter.
2. **Local Providers**: Ollama, local OpenAI-compatible endpoints (`localhost:11434`, `localhost:1234`).
3. **Deterministic Offline Heuristic Engine**: Built-in rule-based NLP engine using regex, lexical analysis, and pattern matching. Every feature (continuity checking, breakdown generation, dialogue punch-up suggestions, actor packet generation, and meeting note extraction) functions instantly even without an Internet connection or API keys.

---

## 3. Package & Directory Structure

```
agentic-cinema/
├── docs/                      # Architecture, Specs, Data Model, Test Plan, Status
├── packages/
│   ├── screenplay-core/       # Parser, Formatter, Pagination, Line Types, AST
│   ├── project-model/         # Normalized Zod Schemas, Domain Entities
│   ├── continuity-engine/     # Consistency Rules, Knowledge Graph, Invalidation
│   ├── production-engine/     # 16-Category Breakdown, Producer Logistics
│   ├── agent-runtime/         # Specialized Agents, Multi-Provider, Tool Calling
│   └── export-engine/         # PDF (Courier 12pt), FDX XML, Fountain, Sides
├── src/
│   ├── components/            # UI Components (Editor, Corkboard, Table Read, etc.)
│   ├── domain/                # Stores, Persistence, Event Dispatchers
│   └── test/                  # Test fixtures & mocks
├── tests/                     # Unit, Integration, and E2E Tests
└── public/                    # Assets, Sample Projects, Icons
```

---

## 4. Security & Privacy Guarantees
- **Context Minimization**: Prompts only include the active scene slice, relevant character profiles, and required canon facts. Full script text is never sent blindly.
- **Untrusted AI Handling**: All agent proposals are treated as untrusted draft mutations. They require visual diff approval before touching the project state.
- **No Remote Telemetry**: Zero tracking scripts, zero external dependencies required for core execution.
