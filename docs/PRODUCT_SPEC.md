# Agentic Cinema — Product Specification

## 1. Product Mission & Value Proposition
Agentic Cinema transforms the traditional disconnected screenwriting and filmmaking workflow into an integrated, reactive desktop operating system.
The screenplay is the single source of truth. Every approved script revision intelligently informs character development, actor preparation, continuity supervision, production planning, director shot lists, table reads, and production documents without manual copy-pasting.

---

## 2. Feature Specification by Module

### 2.1 Precision Screenplay Editor
- **Industry Standard Layout**: US Letter, 12pt Courier monospace typography, exact standard margins:
  - Scene Heading: 1.5" left margin, uppercase, 2 line spaces before.
  - Action: 1.5" left margin, 60-character width, sentence case.
  - Character: 3.7" left margin (col 22), uppercase.
  - Parenthetical: 3.1" left margin (col 16), lowercase in parentheses.
  - Dialogue: 2.5" left margin (col 10), 35-character width.
  - Transition: Right-aligned, uppercase.
  - Shot: 1.5" left margin, uppercase.
- **Smart Keyboard Interactions**:
  - `Enter` on Scene Heading $\to$ Action
  - `Enter` on Character $\to$ Dialogue
  - `Enter` on Dialogue $\to$ Dialogue (or on empty line $\to$ Character or Action)
  - `Tab` key cycles through element types intelligently
  - Hotkeys: `Ctrl+1` through `Ctrl+7` for direct element assignment
- **Real-Time Auto-Complete**:
  - Character cue autocomplete based on project cast and story bible.
  - Location autocomplete with standard prefixes (`INT.`, `EXT.`, `INT./EXT.`).
- **Live Statistics & Pagination**:
  - 54-line deterministic industry pagination calculator.
  - Page counts, scene numbers, word counts, dialogue vs. action ratios.
  - Scene and Character navigators with direct line jumping.
- **Writing Ergonomics**:
  - Distraction-free Focus Mode & Fullscreen.
  - Dark & Light Themes, zoom controls (80%–160%).
  - Full Undo / Redo history and Search & Replace with match navigation.

---

### 2.2 Formats & Interchange Engine
- **Fountain Support**: Lossless import and export of `.fountain` files, preserving title pages, dual dialogue, and boneyard comments.
- **Final Draft FDX**: Full XML import/export conforming to the Final Draft Document Type Specification.
- **Industry PDF Generator**: Monospace 12pt Courier vector PDF export with standard margins, formatted title pages, headers, footers, scene numbering, and automatic `(MORE)` / `(CONT'D)` split handling.
- **Plaintext & Subtitles**: Plaintext export, plus automated `.srt` and `.vtt` cue generation derived from character dialogue.

---

### 2.3 Story Bible & Canon Engine
- Structured entities: Characters, Locations, Props/Objects, Organizations, World Rules, Timeline Events, Story Arcs, Open Mysteries.
- Lifecycle State for every canon fact:
  - `proposed`: Inferred from draft or suggested by agent.
  - `approved`: Verified by writer/filmmaker.
  - `locked`: Inviolable ground truth that agents cannot alter.
  - `superseded`: Deprecated by later narrative developments.

---

### 2.4 Character Agents & Persona Intelligence
- Autonomous persistent agent for each primary character.
- Tracks: Biography, personality traits, motivations, fears, speaking cadence, vocabulary idiosyncrasies, scene-by-scene knowledge boundaries, injuries, and wardrobe state.
- Interactive Persona Q&A:
  - *"Would Maya realistically reveal the passcode here?"*
  - *"What does Nitish know at the start of Scene 12?"*
  - *"Where did Marcus last leave the briefcase?"*

---

### 2.5 Actor Packets & Sides Generator
- **Personalized Actor Packets**:
  - Filtered script showing only scenes where the character appears.
  - Automatic inclusion of preceding cue lines (the line right before each dialogue block).
  - Scene context, dramatic objective, emotional beats, and secret notes for the actor.
  - Wardrobe continuity notes and prop requirements for that scene.
- **Stale Detection & Diff**:
  - When the script changes, affected actor packets are immediately highlighted as `STALE`.
  - Detailed side-by-side diff showing what lines were added/modified for that character.
  - 1-Click Re-generation.
- **Audition & Rehearsal Sides**:
  - Filter by Character, Scene Number range, or Page range with clean printable PDF generation.

---

### 2.6 The Dependency Propagation Engine
The core differentiator of Agentic Cinema:
1. **Mutation Detection**: Every approved edit to the screenplay generates an AST delta.
2. **Blast Radius Computation**:
   - Identifies affected scenes ($S$).
   - Identifies affected characters ($C$).
   - Identifies affected props, locations, and continuity conditions.
3. **Targeted Invalidation**:
   - Marks Actor Packets for $C$ as `STALE`.
   - Marks Shot Lists for $S$ as `STALE`.
   - Flags Production Breakdown entries for $S$ as requiring review.
   - Reruns targeted continuity checks only on relevant downstream branches.
4. **Transparent Alert Hub**: Shows the filmmaker the exact cascading effects with quick-action remediation buttons.

---

### 2.7 Continuity Agent
Automated detection of narrative inconsistencies:
- **Teleportation**: Character in Scene 5 (New York) immediately appearing in Scene 6 (London) with no time jump.
- **Disappearing Objects**: Character picks up a prop in Scene 2, but leaves without it or another character has it without an explicit handoff.
- **Wardrobe / Physical State**: An injury occurring in Scene 4 disappearing in Scene 5.
- **Knowledge Paradoxes**: Character discussing information before the scene in which they discovered it.
- **Time of Day Violations**: Sequential scenes having conflicting day/night transitions.
- Each finding includes: Severity (`critical`, `warning`, `info`), Affected Scenes, Explanatory Evidence, and Suggested Fix. Actions: `Accept Fix`, `Dismiss`, `Mark Intentional`.

---

### 2.8 Production Breakdown Engine
- Automated scene-by-scene breakdown across 16 film industry standard categories:
  1. Cast (Speaking)
  2. Extras / Background
  3. Props
  4. Wardrobe / Costumes
  5. Vehicles
  6. SFX (Practical Effects)
  7. VFX (Visual Effects)
  8. Stunts & Safety
  9. Animals & Handlers
  10. Special Makeup / Prosthetics
  11. Sound & Foley
  12. Special Equipment (Cranes, Steadicam)
  13. Set Dressing
  14. Music / Source Cues
  15. Greenery
  16. Special Requirements
- Allows manual overrides and element locking that become inviolable project truth.
- Export to Industry Breakdown Sheets (PDF / CSV / JSON).

---

### 2.9 Director & Producer Agents
- **Director Agent**:
  - Generates shot lists: Framing, Size (`Wide`, `Medium`, `Close-Up`, `POV`, `Insert`), Lens, Camera Angle, Camera Movement, Dramatic Intent, and Blocking notes.
- **Producer Agent**:
  - Analyzes production complexity: Total filming locations, interior vs exterior balance, night shoot percentage, cast day totals, stunt complexity, VFX shot density.
  - Provides comparative impact analysis on script revisions: *"This revision adds 1 exterior night location and 3 extra stunt requirements."*

---

### 2.10 Scribe Meeting Agent & Visual Corkboard
- **Scribe Meeting Assistant**:
  - Ingests audio recordings or text transcripts from table reads and writers' room meetings.
  - Extracts structured sticky notes: Decisions, Dialogue Ideas, Continuity Concerns, Production Constraints.
  - Tags each note with Character, Scene, and Status (`Proposed`, `Accepted`, `Archived`).
- **Visual Corkboard**:
  - Interactive card canvas for Scenes, Beats, Storylines, and Sticky Notes.
  - Drag-and-drop ordering, color-coding, filtering by Act, Character, and Tag.

---

### 2.11 Table Read Studio
- Character-by-character voice assignment (distinct browser synthesis voices or neural TTS).
- Sequential playback with visual line-by-line highlighting.
- Clear audio distinction between dialogue and narration (action blocks).
- Controls: Play/Pause, Skip Scene, Playback Speed (0.75x–2.0x), Mute/Solo characters.

---

### 2.12 Revision Management
- Industry standard revision color sequence:
  `White` $\to$ `Blue` $\to$ `Pink` $\to$ `Yellow` $\to$ `Green` $\to$ `Goldenrod` $\to$ `Buff` $\to$ `Salmon` $\to$ `Cherry`.
- Full version snapshots with timestamps, notes, and side-by-side visual diffing.
- Character-specific change ledger: *"Show me everything that changed for Maya between Blue and Yellow revisions."*
