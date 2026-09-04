# Agentic Cinema — Test Plan & Quality Assurance

## 1. Quality Objectives
Every critical subsystem of Agentic Cinema must be validated by automated unit and integration tests.
No mock-only facades: all core parsing, diffing, propagation logic, continuity checks, breakdown extraction, and export routines must execute against real test fixtures.

---

## 2. Test Suites Overview

### 2.1 Unit Tests
1. **Screenplay Parser & AST (`screenplay-core`)**:
   - Parse standard Fountain screenplay blocks (Scene Headings, Action, Character cues, Dialogue, Parentheticals, Transitions).
   - Parse complex headers with `INT./EXT.`, `EST.`, and time suffixes (`DAY`, `NIGHT`, `MOMENTS LATER`).
   - Title page parsing and extraction.
   - Deterministic 54-line pagination with `(MORE)` and `(CONT'D)` split handling.

2. **Interchange Formats (`export-engine`)**:
   - Final Draft FDX XML parsing and generation round-tripping.
   - Subtitle cues generation (SRT & VTT timing calculation).
   - Monospace Courier 12pt PDF generation with proper byte header and stream formatting.

3. **The Dependency Propagation Engine (`continuity-engine`)**:
   - Calculate exact diff when text changes in Scene 2.
   - Verify character invalidation: Character A in Scene 2 is flagged as stale; Character B appearing only in Scene 5 is unaffected.
   - Verify shot list invalidation for Scene 2.
   - Verify downstream continuity re-triggering.

4. **Continuity Engine**:
   - Inconsistency detection: Teleportation across distant locations within continuous time.
   - Disappearing prop detection.
   - Character knowledge paradoxes (referencing secret before scene where learned).

5. **Production Breakdown Engine**:
   - Automatic classification of entities into 16 industry categories.
   - Preservation of user-locked manual edits across script updates.

6. **Actor Packet Generation**:
   - Filtering of script lines to character's scenes with preceding cue lines.
   - Detection of stale state against screenplay version.

7. **Scribe Meeting Agent & Heuristics**:
   - Extraction of structured sticky notes from transcript text.

---

## 3. Execution Commands
- Unit & Integration Tests: `npm test`
- TypeScript Verification: `npm run typecheck`
- Production Build: `npm run build`
