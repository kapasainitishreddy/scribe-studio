# Codebase Provenance & Originality Attestation

**Project:** **Scribe Studio — The Screenplay That Understands What It Changes**  
**Author:** Kapasai Nitish Reddy  
**Date:** September 2026  
**Contest:** Google Cloud *Agentic Cinema: The Blockbuster Hackathon*  

---

## 1. Attestation of Original Work

I hereby certify and attest that:

1. **New Repository & Implementation:** Scribe Studio is an entirely new project designed, architected, and coded from scratch during the active hackathon period (September 2026).
2. **Zero Code Duplication:** No source code, components, CSS styles, or binary assets were copied, cloned, or extracted from any prior repository or existing project (including any earlier conceptual experiments or uncommitted repositories such as `kapasainitishreddy/scribe`).
3. **Clean-Room Engineering:** All packages (`screenplay-core`, `project-model`, `continuity-engine`, `production-engine`, `export-engine`, `agent-runtime`, and the React frontend) were authored with clean-room engineering principles to solve the specific challenge of the hackathon: **an AI-native filmmaking operating system rooted in screenplay AST reactive propagation**.
4. **Permissive Open-Source Licensing:** The repository is distributed under the standard **MIT License**, granting full rights for evaluation, compilation, deployment, and judging.

---

## 2. Directory & Component Lineage

Every file in the repository was created during this hackathon sprint:

```
agentic-cinema/
├── packages/
│   ├── screenplay-core/          # Newly written Fountain parser, AST diff, pagination
│   ├── project-model/            # Newly defined Zod schemas and normalized domain types
│   ├── continuity-engine/        # Newly written rule evaluator & blast radius propagator
│   ├── production-engine/        # Newly authored 16-category breakdown classifier & logistics
│   ├── export-engine/            # Newly engineered pure Courier 12pt PDF & FDX interchange
│   └── agent-runtime/            # Pure Google Gemini + Parallel Search multi-agent runtime
├── src/
│   ├── components/
│   │   ├── HeaderBar.tsx         # Scribe Studio workspace navigation & action strip
│   │   ├── ScreenplayEditor.tsx  # Dual-view script editor with real-time Fountain formatting
│   │   ├── Scene3DStudio.tsx     # Interactive Three.js 3D previsualization stage
│   │   ├── DependencyGraphPanel.tsx # Interactive SVG dependency blast radius graph
│   │   ├── ProductionResearchPanel.tsx # Live Parallel Search verification studio
│   │   ├── HeroImpactModal.tsx   # Single-click hackathon hero run walkthrough
│   │   └── ComplianceDrawer.tsx  # Google Cloud & Parallel runtime diagnostics
│   └── domain/
│       └── projectStore.ts       # Unified reactive state store with local persistence
└── tests/                        # 15 automated test suites verifying all engines
```

---

## 3. Technology Verification

- **Primary Cloud AI:** Google Cloud Vertex AI / Google Gemini (`gemini-1.5-pro`, `gemini-2.0-flash`).
- **Partner Search API:** Parallel Search API (`parallelSearch.ts`).
- **UI & Visualization:** React 19, TypeScript 5.7, Tailwind CSS v4, Three.js (WebGL 3D stage).
- **Desktop Runtime (Optional):** Tauri 2.0 (Rust backend).
