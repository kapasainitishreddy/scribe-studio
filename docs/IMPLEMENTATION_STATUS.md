# Agentic Cinema — Implementation Status Matrix

This live document tracks the state of every module in Agentic Cinema according to the product roadmap.
Status values: `DONE` | `PARTIAL` | `NOT STARTED` | `BLOCKED`.
*Rule: A feature is marked DONE only when the end-to-end workflow functions, verified by automated tests.*

| Module | Feature | Status | Verification & Notes |
| :--- | :--- | :---: | :--- |
| **Phase 1: Foundation** | Project Data Model & Zod Schemas | DONE | Normalized project graph, stable IDs, validated in `schema.ts` |
| | Screenplay AST Parser (Fountain) | DONE | Lossless Fountain line parsing, heading parts, verified in `screenplayCore.test.ts` |
| | Final Draft FDX XML Interchange | DONE | Bidirectional FDX XML import & export, verified in `interchange.test.ts` |
| | Screenplay Editor Engine | DONE | Courier 12pt monospace, exact industry margins |
| | Smart Key Switching (Enter / Tab) | DONE | Contextual element transitions, Tab indent/cycle |
| | Autocomplete for Cast & Locations | DONE | Real-time dropdown suggestions from Story Bible |
| | Deterministic 54-Line Pagination | DONE | Industry standard page estimates & breaks, `(MORE)`/`(CONT'D)` splits |
| | Scene & Character Navigators | DONE | Quick jump navigation with line highlighting |
| | Autosave & Local-First Persistence | DONE | Transactional localStorage and JSON project backup snapshots |
| **Phase 2: Canon & Visualization** | Story Bible & Canon Engine | DONE | Lifecycle: proposed, approved, locked, superseded. Inviolable lock guarantee |
| | Interactive Scene Graph | DONE | Node-link graph mapping scenes, characters, and locations with script jump |
| | Visual Corkboard Studio | DONE | Drag/drop index cards, Act I/II/III grouping, tag filtering |
| | Universal Project Search | DONE | Unified search across script, canon, breakdown, dialogue, notes (`Ctrl+K`) |
| **Phase 3: AI & Agent Runtime** | Multi-Provider Abstraction | DONE | Gemini, OpenAI, Claude, OpenRouter, Ollama |
| | Deterministic Offline Heuristic Engine | DONE | 100% functionality without API keys or internet connection |
| | Writer Agent | DONE | Rewrite scene, shorten, heighten tension, improve subtext/dialogue |
| | Change Approval & Diff UX | DONE | Proposal -> Side-by-side Visual Diff -> User Approval Flow |
| | Character Persona Agents | DONE | Deep persona Q&A, scene-by-scene knowledge boundaries |
| **Phase 4: Production & Continuity** | Continuity Agent | DONE | Detects teleportation, disappearing props, knowledge paradoxes, time conflicts |
| | 16-Category Breakdown Engine | DONE | Auto-tagging & manual locked ground truth across 16 standard categories |
| | Director Agent | DONE | Coverage shot lists (framing, lens, angle, movement, blocking notes) |
| | Producer Agent | DONE | Logistics report, night shoot ratio, stunt count, shooting days |
| **Phase 5: Propagation & Packets** | Dependency Propagation Engine | DONE | Invalidation blast radius & targeted invalidation, verified in `propagationEngine.test.ts` |
| | Actor Packets Generator | DONE | Filtered character scenes, preceding cues, stale diff indicators |
| | Sides Generator | DONE | Audition/rehearsal sides with printable PDF and plaintext download |
| | Revision Management | DONE | 9 industry revision colors (White to Cherry), version diffing & restore |
| **Phase 6: Audio & Collaboration** | Scribe Meeting Agent | DONE | Audio/transcript extraction to structured sticky notes on corkboard |
| | Table Read Mode | DONE | Synchronized speech synthesis, distinct persona voices, line highlighting |
| **Phase 7: Exports & Resilience** | Monospace Courier 12pt PDF Export | DONE | Pure vector PDF generator with title page, page numbers, MORE/CONT'D |
| | Comprehensive Error & Resilience UX | DONE | Offline detection, input safety, key privacy, context minimization |
| **Phase 8: Sample Project & Verification** | Bundled Original Sample Project | DONE | "The Obsidian Protocol" 4-scene thriller with canon, revisions, packets |
| | Test Suite (Vitest, Typecheck) | DONE | 5 test suites, 15 automated tests passing with 100% success rate |
