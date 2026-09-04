# Hackathon Judging Matrix & Evaluation Mapping

**Project Title:** **Scribe Studio — The Screenplay That Understands What It Changes**  
**Hackathon Target:** Google Cloud *Agentic Cinema: The Blockbuster Hackathon*  

This document provides direct mapping to the four official hackathon evaluation dimensions.

---

## 1. Technical Execution & Google Cloud Architecture (30%)

| Criterion | Implementation in Scribe Studio | Evidence & Reference |
| :--- | :--- | :--- |
| **Google Cloud AI Utilization** | Powered exclusively by Google Cloud Gemini 1.5 Pro and Gemini 2.0 Flash via Vertex AI / Google Gen AI SDK. Multi-agent coordination designed with Google ADK patterns. | `packages/agent-runtime/src/providers.ts`, `docs/HACKATHON_COMPLIANCE.md` |
| **Zero Disallowed APIs** | 100% compliant with hackathon rules: 0% OpenAI, 0% Anthropic, 0% Ollama, 0% Whisper, 0% AWS, 0% Azure. | Automated static scan in `docs/HACKATHON_COMPLIANCE.md` |
| **Partner Track: Parallel Search API** | Runtime integration of Parallel Search API to fact-check geography, technical jargon, weapons, and safety guidelines with live URLs and snippets. | `packages/agent-runtime/src/productionResearchAgent.ts`, `parallelSearch.ts` |
| **Robust Architectural Design** | Modular monorepo with 6 isolated core packages (`screenplay-core`, `project-model`, `continuity-engine`, `production-engine`, `export-engine`, `agent-runtime`). | `packages/`, `package.json` |
| **Evaluation Harness & Quality** | 15/15 unit and integration tests passing. Clean TypeScript compilation (`tsc --noEmit` exit 0). | `tests/`, `docs/TEST_RESULTS.md` |

---

## 2. Impact & Industry Value (25%)

| Criterion | Implementation in Scribe Studio | Evidence & Reference |
| :--- | :--- | :--- |
| **Solves Hollywood Fragmentation** | Solves the catastrophic ripple effect of script revisions across character sides, continuity notes, breakdown sheets, and production budgets. | `src/components/HeroImpactModal.tsx`, `src/domain/projectStore.ts` |
| **Compute & Token Efficiency** | Instead of re-running all agents, AST diffs selectively invalidate only affected packets. Unaffected scenes incur **zero token cost**. | 100% selective invalidation accuracy, 0% false stale rate. |
| **Production Credibility** | Technical assertions are grounded via live Parallel Search citations, preventing embarrassing real-world errors in high-budget productions. | `src/components/ProductionResearchPanel.tsx` |
| **Industry Standard Exports** | True Courier 12pt pure vector PDF with 54-line pagination and lossless Final Draft FDX XML interchange. | `packages/export-engine/` |

---

## 3. Design & User Experience (25%)

| Criterion | Implementation in Scribe Studio | Evidence & Reference |
| :--- | :--- | :--- |
| **Visual Dependency Graph** | Interactive node-link canvas animating the screenplay blast radius with pulsing aura rings and color-coded entity states. | `src/components/DependencyGraphPanel.tsx` |
| **3D Scene Previs Studio** | Interactive Three.js WebGL stage allowing directors to place actors, cameras, props, and lights with Director POV and Top-Down Plan view. | `src/components/Scene3DStudio.tsx` |
| **Dual-Mode Screenplay Editor** | Formatted screenplay view + raw Fountain syntax editing with real-time character element detection and line stats. | `src/components/ScreenplayEditor.tsx` |
| **Human-In-The-Loop Approval** | Changes are never silently forced; directors review side-by-side AST diffs with an explicit "APPROVE & PROPAGATE" gate. | `src/components/HeroImpactModal.tsx` |

---

## 4. Originality & Innovation (20%)

| Criterion | Implementation in Scribe Studio | Evidence & Reference |
| :--- | :--- | :--- |
| **Screenplay as Root Node** | Treating the screenplay AST as the root of an entity dependency graph is a fundamental departure from naive LLM chat wrappers. | `packages/continuity-engine/src/propagationEngine.ts` |
| **Epistemic Character Auditing** | `CharacterAgent` tracks what each character knows scene-by-scene, catching premature revelations and dialogue spoilers automatically. | `packages/agent-runtime/src/characterAgent.ts` |
| **Clean Provenance** | 100% newly written codebase authored during the contest sprint, completely distinct from any legacy projects. | `docs/PROVENANCE.md` |
