# Open-Source Software & License Audit

**Project**: Scribe Studio (Agentic Cinema Operating System)  
**Track**: Google Cloud AI & Parallel Search API Partner Track  
**Audit Date**: October 2026  
**License**: MIT License  

---

## 1. Compliance Statement

In strict accordance with the **Agentic Cinema Hackathon Official Rules**:
- **0% Competing AI Vendors**: Scribe Studio contains **zero** dependencies or runtime connections to disallowed third-party AI APIs (OpenAI, Anthropic, OpenRouter, Ollama, Cohere, Groq, Whisper, Mistral).
- **Authorized AI**: All agentic capabilities interface strictly with **Google Cloud Vertex AI / Gemini API** (`gemini-1.5-pro`, `gemini-2.0-flash`), Google Cloud Agent ADK, and the authorized partner track **Parallel Search API**.
- **Permissive & Standard Open-Source Libraries**: All third-party open-source libraries incorporated into this project carry standard, reputable open-source licenses (**MIT**, **Apache-2.0**, **BSD-3-Clause**, or **MPL-2.0**). No viral copyleft (GPL / AGPL) libraries are utilized.

---

## 2. Dependency License Inventory

| Package | Version | License | Primary Purpose | Architectural Justification |
| :--- | :--- | :--- | :--- | :--- |
| `react` / `react-dom` | `^18.3.1` | **MIT** | Core UI Runtime | Industry standard for reactive workspace state |
| `three` / `@types/three` | `^0.170.0` | **MIT** | 3D Staging & GLTF Export | Real-time WebGL director camera frustum, actor meshes, and `.glb` export via `GLTFExporter` |
| `mediabunny` | `^1.2.1` | **MPL-2.0** | Client-Side Video Muxing | Pure TypeScript WebCodecs MP4/WebM container encoder via `CanvasSource` & `BufferTarget` (unmodified npm dependency) |
| `dexie` | `^4.0.11` | **Apache-2.0** | IndexedDB Storage Engine | Multi-table relational persistence, debounced autosave, snapshot backups, and legacy localStorage migration |
| `@dagrejs/dagre` | `^1.1.4` | **MIT** | Production Graph Layout | Directed acyclic graph (DAG) layout engine for interactive AST blast-radius visualization |
| `lucide-react` | `^0.468.0` | **ISC / MIT** | Filmmaking Tool Icons | Vector iconography for lenses, cameras, audio, clapperboards |
| `jspdf` | `^2.5.2` | **MIT** | Document Generation | Standard Hollywood 8.5"x11" PDF screenplay & actor sides export |
| `diff` | `^7.0.0` | **BSD-3-Clause** | Deterministic AST Diffing | Microsecond text comparison across screenplay revisions |
| `tailwindcss` | `^3.4.17` | **MIT** | UI Styling System | High-density dark mode design system for professional studio monitors |
| `vite` | `^6.0.3` | **MIT** | Development & Bundling | Instant HMR and optimized production bundle |
| `typescript` | `^5.6.3` | **Apache-2.0** | Static Type Safety | Complete end-to-end domain model validation |
| `vitest` | `^2.1.8` | **MIT** | Automated Testing | High-speed unit & integration test runner |
| `fake-indexeddb` | `^6.0.0` | **Apache-2.0** | In-Memory IndexedDB Mock | Complete deterministic Vitest testing for IndexedDB storage layer |
| `zod` | `^3.23.8` | **MIT** | Schema Validation | Runtime type boundary enforcement for Fountain & FDX payloads |

### 2.1 Note on Mediabunny (MPL-2.0)
Mediabunny is licensed under the Mozilla Public License 2.0 (MPL-2.0). Scribe Studio incorporates Mediabunny strictly as an external, unmodified package installed via npm (`npm install mediabunny`). No source files of Mediabunny itself were modified or redistributed as source. Under MPL-2.0 Section 3.3 ("Larger Works"), integrating an unmodified MPL-licensed library into a larger project does not infect or alter the licensing of the surrounding application files. Scribe Studio's application code remains cleanly licensed under the MIT License.

---

## 3. Native & In-House Engines (0 External Dependencies)

To ensure maximum performance, zero vendor lock-in, and offline reliability, several key subsystems were written completely from scratch with zero third-party dependencies:

1. **Fountain Screenplay AST Parser (`packages/screenplay-core/src/fountain.ts`)**:
   - Written in pure TypeScript with custom state-machine tokenization.
   - Parses scenes, action lines, character names, parentheticals, transitions, notes, and dual dialogue.

2. **Hollywood 54-Line Paginator (`packages/screenplay-core/src/screenplayFormat.ts`)**:
   - Implements standard industry page-break algorithms preventing orphan character cues and orphaned scene headers.

3. **Continuous Reactive Propagation Engine (`packages/continuity-engine/src/propagationEngine.ts`)**:
   - AST graph difference engine calculating transitive invalidation across Actor Packets, Shot Lists, Breakdown Elements, Continuity Rules, and Storyboard Panels.

4. **Deterministic Comic SVG Schematic Engine (`packages/production-engine/src/storyboardGenerator.ts`)**:
   - Procedural SVG generator rendering actor silhouettes, camera frustum cones, depth perspective grids, speech bubbles, and safe-area thirds without requiring external generative diffusion compute.

5. **FDX Final Draft Interchange Engine (`packages/export-engine/src/interchangeFdx.ts`)**:
   - In-house XML serializer and deserializer for bi-directional Final Draft 12/13 interchange.

---

## 4. Verification & Audit Trail

To verify license and dependency hygiene at any time:

```bash
# Verify no forbidden API packages are present
npm list | grep -iE "(openai|anthropic|ollama|whisper|openrouter)"

# Run full TypeScript typecheck
npm run typecheck

# Run full automated test suite
npm test
```
