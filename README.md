# Agentic Cinema 🎬

> **The AI-Native Filmmaking Operating System**  
> Where the Screenplay is the Single Source of Truth for writing, character intelligence, continuity, actor packets, production breakdowns, director shot lists, table reads, and production documents.

---

## 🌟 What is Agentic Cinema?

Traditional filmmaking tools force creators to manually copy information between disconnected applications—exporting scripts from Final Draft, manually retyping breakdown sheets in StudioBinder, managing character notes in Notion, and pasting scenes into ChatGPT.

**Agentic Cinema replaces this fragmentation with an integrated, reactive desktop operating system.**

At its core is **The Dependency Propagation Engine**: Every approved change to the screenplay calculates an exact AST delta and invalidates only affected downstream production artifacts (Actor Packets, Shot Lists, Breakdown sheets, and Continuity rules) without blanket regeneration.

---

## 🚀 Key Features

### 1. Precision Screenplay Editor
- **Courier 12pt Monospace Layout**: Exact industry standard margins (Scene Heading, Action, Character, Parenthetical, Dialogue, Transition, Shot).
- **Intelligent Keyboard Transitions**: Contextual `Tab` and `Enter` flows (e.g. Character $\to$ Dialogue $\to$ Dialogue, Scene Heading $\to$ Action).
- **Real-Time Autocomplete**: Instant auto-suggestions for character names and locations.
- **54-Line Deterministic Pagination**: Exact industry page counts, reading time, and word metrics.
- **Scene & Character Navigators**: Quick jump navigation across scenes and character appearances.
- **Focus & Fullscreen Modes**: Distraction-free writing environment.

### 2. The Reactive Dependency Propagation Engine
- Calculates exact scene and character blast radii when screenplay mutations occur.
- Automatically marks affected **Actor Packets** as `STALE` with an inline diff summary.
- Flags corresponding **Shot Lists** and **Production Breakdown** scenes for review.
- Triggers targeted continuity checks without expensive whole-project re-evaluations.

### 3. Story Bible & Inviolable Canon Engine
- Structured world graph: Characters, Locations, Props, World Rules, Timeline Events, Secrets, and Story Arcs.
- Inviolability State: `proposed`, `approved`, `locked`, `superseded`.
- **Inviolability Guarantee**: Locked canon facts cannot be silently rewritten by AI agents.

### 4. Actor Packets & Sides Generator
- **Personalized Actor Packets**: Filtered script showing only scenes for that character, preceding cue lines, scene objectives, emotional states, and prop/wardrobe checkpoints.
- **Stale Tracking**: Instant side-by-side diff highlighting what changed for that actor since the packet was last generated.
- **Audition & Rehearsal Sides**: 1-click printable Sides PDF or plaintext export.

### 5. Continuity Supervisor Agent
- Automated detection of narrative inconsistencies:
  - **Impossible Travel**: Teleportation across distant locations in continuous time.
  - **Disappearing Objects**: Prop disappearance or invalid handoffs.
  - **Character Knowledge Paradoxes**: Speaking about secrets before the scene where they were discovered.
  - **Time of Day Conflicts**: Inverted day/night chronological transitions.
- Actions: `Accept Fix`, `Dismiss`, `Mark Intentional`.

### 6. 16-Category Production Breakdown Engine
- Automated tagging across industry categories: Cast, Extras, Props, Wardrobe, Vehicles, SFX, VFX, Stunts, Animals, Makeup, Sound, Equipment, Set Dressing, Music, Greenery, Special.
- Manual element locking that persists as ground truth across script revisions.
- Export to Production Breakdown CSV.

### 7. Director & Producer Agents
- **Director Agent**: Coverage shot lists (Framing, Lens, Angle, Movement, Visual Intent, Blocking notes).
- **Producer Agent**: Production logistics (shooting days, night shoot ratios, stunt and location counts).

### 8. Scribe Meeting Assistant & Visual Corkboard
- **Scribe Meeting Agent**: Converts audio recordings or table-read transcripts into structured corkboard sticky notes.
- **Visual Corkboard**: Drag-and-drop index cards grouped by Act (Act I, II, III).

### 9. Synchronized Table Read Studio
- Character-by-character voice assignment (using speech synthesis).
- Real-time line-by-line synchronized reading with visual highlighting.
- Differentiates dialogue from action narration; controls for speed, pause, and scene jumping.

### 10. Industry Revision Management
- Revision color sequence: `White` $\to$ `Blue` $\to$ `Pink` $\to$ `Yellow` $\to$ `Green` $\to$ `Goldenrod` $\to$ `Buff` $\to$ `Salmon` $\to$ `Cherry`.
- Visual side-by-side diff comparison and 1-click revision restore.

### 11. Multi-Format Interchange
- **Screenplay PDF**: Vector Courier 12pt layout with formatted title page, page numbers, and MORE/CONT'D split handling.
- **Final Draft FDX XML**: Lossless bidirectional FDX import and export.
- **Fountain**: Standard plaintext screenplay import and export.
- **Subtitles**: Automated `.srt` and `.vtt` cue generation.
- **Project Backup**: Full JSON snapshots.

### 12. Privacy & Offline Deterministic Intelligence
- **Local-First**: Works 100% offline without an account. All scripts and projects stay on your machine.
- **Deterministic Heuristic Engine**: Every workflow (continuity, breakdowns, actor packets, table reads, writer suggestions) works instantly out of the box with zero API keys required.
- **Multi-Provider BYOK**: Optional support for Google Gemini, OpenAI, Anthropic Claude, OpenRouter, and local Ollama.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.75+ for native desktop packaging)

### Installation
```bash
# Clone the repository
git clone https://github.com/kapasainitishreddy/agentic-cinema.git
cd agentic-cinema

# Install dependencies
npm install
```

### Running Locally (Development Mode)
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running as Desktop Application (Tauri 2)
```bash
npm run tauri dev
```

### Running the Test Suite
```bash
# Run all unit and integration tests
npm test

# Typecheck TypeScript
npm run typecheck
```

### Building for Production
```bash
# Production web/desktop frontend build
npm run build

# Native desktop installer build
npm run tauri build
```

---

## 📂 Project Architecture

```
agentic-cinema/
├── docs/                      # Architectural specs, data models, test plans
│   ├── ARCHITECTURE.md
│   ├── PRODUCT_SPEC.md
│   ├── DATA_MODEL.md
│   ├── IMPLEMENTATION_STATUS.md
│   └── TEST_PLAN.md
├── packages/
│   ├── screenplay-core/       # Parser, Formatter, 54-line Pagination, AST
│   ├── project-model/         # Zod schemas, domain entities, sample project
│   ├── continuity-engine/     # Propagation Engine, Consistency Rules
│   ├── production-engine/     # 16-Category Breakdown, Producer Logistics
│   ├── export-engine/         # Vector PDF, FDX XML, Sides, Subtitles
│   └── agent-runtime/         # Specialized Agents, Multi-Provider, Heuristics
├── src/
│   ├── components/            # UI Panels (Editor, Story Bible, Packets, etc.)
│   ├── domain/                # Reactive state store & local persistence
│   ├── App.tsx                # Master workspace layout
│   └── main.tsx               # Application entrypoint
├── src-tauri/                 # Tauri 2 Rust desktop backend
└── tests/                     # Automated Vitest test suites
```

---

## 🔒 Security & Privacy

1. **Context Minimization**: AI agent prompts only transmit the active scene slice and relevant character dossier notes—never the entire script blindly.
2. **Local Key Storage**: API keys are stored solely in your local browser/desktop storage and are sent directly to the respective API endpoint over HTTPS.
3. **Deterministic Local Fallback**: Never blocked by network outages or invalid API keys.

---

## 📜 License
MIT License. Built for the Screenwriting & AI Filmmaking Hackathon 2026.
