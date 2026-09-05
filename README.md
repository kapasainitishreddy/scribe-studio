# Scribe Studio 🎬

> **The screenplay is the root node of the production graph.**  
> Change one scene and Scribe Studio identifies exactly which characters, continuity facts, actor sides, production elements, and storyboard panels are affected—protecting unaffected scenes with a mathematical guarantee of zero wasted compute.

**Official Submission for Google Cloud's Agentic Cinema: The Blockbuster Hackathon**  
**Primary Track:** Google Cloud AI (Gemini 1.5 Pro, 2.0 Flash, Google ADK) • **Partner Track:** Parallel Search API  

[![Live Public Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://kapasainitishreddy.github.io/scribe-studio/)
[![Public Repository](https://img.shields.io/badge/GitHub-kapasainitishreddy%2Fscribe--studio-blue?style=for-the-badge&logo=github)](https://github.com/kapasainitishreddy/scribe-studio)
[![Google Cloud AI](https://img.shields.io/badge/Google%20Cloud-Gemini%201.5%20Pro%20%26%202.0%20Flash-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Parallel Search API](https://img.shields.io/badge/Partner%20Track-Parallel%20Search%20API-0ea5e9?style=for-the-badge)](https://parallel.ai)
[![Evaluation](https://img.shields.io/badge/Evaluation-52%2F52%20Scenarios%20Passing%20(100%25)-10b981?style=for-the-badge)](evaluation-results/evaluation_metrics.json)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing%20(9%20Suites)-10b981?style=for-the-badge)](docs/TEST_RESULTS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Public Links

- **Live Application:** [https://kapasainitishreddy.github.io/scribe-studio/](https://kapasainitishreddy.github.io/scribe-studio/)
- **Public GitHub Repository:** [https://github.com/kapasainitishreddy/scribe-studio](https://github.com/kapasainitishreddy/scribe-studio)
- **Deployed Commit:** `707ae88`
- **Submission Gate Audit:** [docs/SUBMISSION_GATE.md](docs/SUBMISSION_GATE.md) (24/24 PASS)
- **Devpost Submission Text:** [docs/DEVPOST_SUBMISSION.md](docs/DEVPOST_SUBMISSION.md)
- **Runtime Proof & Schemas:** [docs/RUNTIME_PROOF.md](docs/RUNTIME_PROOF.md)

---

## 💡 What is Scribe Studio?

In filmmaking and episodic television, a single script change creates invisible ripple effects across the entire production:
- An actress receives obsolete dialogue cues on tomorrow's sides.
- A character discusses a weapon or secret they have not yet discovered.
- Storyboard artists draw shots with props that were rewritten out of the scene.
- Prop masters order gear that no longer exists in the script.

Existing generative AI tools make this worse: they re-prompt entire scripts or blindly regenerate whole scenes, erasing human director intent and burning thousands of tokens.

**Scribe Studio treats the screenplay as the root node of an active entity dependency graph.** Modifying any line executes an AST-directed blast radius propagation in under 1.4 milliseconds that:
1. Detects line-level AST diffs with deterministic SHA-256 hashing.
2. Audits character epistemic knowledge states (catching premature revelations before they are observed).
3. Evaluates continuity rules across all downstream scenes.
4. Queries the **Parallel Search API** to verify real-world factual claims (maritime regulations, fire suppression dynamics, post-quantum encryption standards) with auditable live citations.
5. Selectively invalidates **only** affected Actor Packets and Storyboard Panels, protecting 100% of unaffected scenes with **zero wasted compute tokens** (`unaffectedArtifactsRegenerated === 0`).
6. Grants the director full veto power via bi-directional **Approve** (atomic reconciliation) or **Reject** (zero state mutations).

---

## 🏗️ Architecture & 9-Stage Closed Loop

```
[Screenplay AST (Root Node)] (packages/screenplay-core/src/fountain.ts)
                 ↓
[Change Detection & AST Diff Engine (<1.4ms)]
                 ↓
[Google ADK Multi-Agent Orchestrator] (packages/agent-runtime/src/scribeAgent.ts)
   ├── WriterAgent (Scene alternatives & diffs)
   ├── CharacterAgent (Epistemic knowledge horizon audits)
   ├── ContinuityAgent (26 consistency rules)
   └── ProductionImpactAgent (16-category breakdown)
                 ↓
[Parallel Search Research Agent] (packages/agent-runtime/src/productionResearchAgent.ts)
   ├── Hard-Negative Gating (100% abstention on drama)
   └── Real-time Grounding (https://api.parallel.ai/v1/search)
                 ↓
[Reactive Blast Radius Propagator] (packages/continuity-engine/src/propagationEngine.ts)
   └── Selective Invalidation (Panels 4 & 6 OUTDATED, Panels 1-3 & 5 APPROVED)
                 ↓
[Consolidated Hero Impact Proposal] (src/components/HeroImpactModal.tsx)
                 ↓
[Human Director Decision] ───► REJECT ──► 0 Mutations Committed
                 │
                 └───► APPROVE
                         ↓
[Targeted Selective Regeneration] (unaffectedArtifactsRegenerated === 0)
                         ↓
[Mathematical Consistency Engine] (verifyProjectConsistency() -> 0 Errors)
```

---

## 🎬 Key Capabilities

### 1. Scene $\to$ Beats $\to$ Shots $\to$ Storyboard / Comic Visual Pipeline
- **Automated Beat Extraction:** Parses scenes into dramatic beats (Introduction, Inciting Incident, Escalation, Turn, Resolution).
- **Shot Breakdown:** Automatically derives camera framings (Wide Shot, Medium Close-Up, Extreme Close-Up, POV), camera angles, blocking, dialogue bubbles, and captions.
- **7 Dynamic Comic Layouts:** Standard Grid, Widescreen Cinematic, Manga Dynamic, Hero Spotlight, Three-Strip, Four-Panel Quad, and Full Splash.
- **Deterministic SVG Fallback Visualizer:** Procedural vector schematics with framing grids, character silhouettes, lighting tints, speech bubbles, and continuity badges—rendering 100% offline with zero missing asset warnings.

### 2. Four Specialized Filmmaker Department Lenses
- **Director Lens:** Dramatic beat structure, narrative pacing, and emotional arcs.
- **Actor / Rehearsal Lens:** Isolates character sides, dialogue bubbles, and character epistemic knowledge horizons, with a one-click rehearsal mode that blurs lines for memorization.
- **Cinematographer Lens:** Highlights shot framing notations (WS, MCU, ECU), aspect ratios (2.39:1, 1.85:1, 16:9), prime lens kit (18mm–85mm), and coverage matrix.
- **Script Supervisor Lens:** Surfaces panel continuity badges, prop/wardrobe states, stale packet warnings, and 180° eyeline axis preservation.

### 3. Interactive 3D WebGL Previs Studio (Three.js)
- Stage actors, cameras, props, and lighting fixtures in a virtual 3D environment.
- Real-time toggle between 3D Orbit, Top-Down Tactical Blueprint, and true Director POV frustum.

### 4. Lossless Hollywood Industry Export Engine
- **Hollywood Standard PDF:** Pure vector Courier 12pt export with exact 1.5" left gutter and 1.0" margins adhering to 54-line Hollywood pagination.
- **Final Draft FDX XML Interchange:** Lossless bi-directional import and export preserving dual dialogue, parentheticals, and scene headings.

---

## 📊 Evaluation & Empirical Benchmarks

All metrics are measured and computed directly by the automated evaluation harness (`tests/agentEvaluationHarness.test.ts`):

| Metric | Target Threshold | Measured Result | Status |
| :--- | :---: | :---: | :---: |
| **Total Evaluated Scenarios** | $\ge 50$ | **52 Scenarios** | **PASS** |
| **Hard Negative Test Cases** | $\ge 15$ | **27 Scenarios** | **PASS** |
| **Positive Test Cases** | $\ge 15$ | **25 Scenarios** | **PASS** |
| **Overall Suite Accuracy** | $\ge 90.0\%$ | **100.0% (52 / 52 Passed)** | **PASS** |
| **Continuity Detection Precision** | $\ge 85.0\%$ | **100.0%** | **PASS** |
| **Continuity Detection Recall** | $\ge 85.0\%$ | **100.0%** | **PASS** |
| **Continuity F1 Score** | $\ge 85.0\%$ | **1.000** | **PASS** |
| **False Positive Rate (FPR)** | $\le 10.0\%$ | **0.0%** | **PASS** |
| **False Stale Invalidation Rate** | $\le 5.0\%$ | **0.0%** | **PASS** |
| **Zero-Compute Protection Rate** | **100.0%** | **100.0% (0 Wasted Compute)** | **PASS** |
| **Research Trigger Precision** | $\ge 90.0\%$ | **100.0%** | **PASS** |
| **Research Abstention Accuracy** | $\ge 90.0\%$ | **100.0%** | **PASS** |

Live metrics file: [`evaluation-results/evaluation_metrics.json`](evaluation-results/evaluation_metrics.json)  
Full methodology document: [`docs/EVALUATION.md`](docs/EVALUATION.md)

---

## 🔒 Strict Hackathon Compliance & Provenance

| Requirement | Audit Status | Evidence |
| :--- | :---: | :--- |
| **Google Cloud AI** | **100% Compliant** | Uses Gemini 1.5 Pro and 2.0 Flash via Google Gen AI endpoints and Google ADK design patterns (`packages/agent-runtime/src/providers.ts`). |
| **Partner Track** | **100% Compliant** | Official integration with Parallel Search API (`packages/agent-runtime/src/parallelSearch.ts`). |
| **0% Disallowed Vendors** | **0 Occurrences** | Verified 0 occurrences of OpenAI, Anthropic, Ollama, Whisper, or OpenRouter across all source files (`docs/SECURITY_AUDIT.md`). |
| **Original Codebase** | **100% Clean-Room** | Authored from scratch during the hackathon period. Zero legacy code copied (`docs/PROVENANCE.md`). |
| **Open Source** | **MIT Licensed** | Permissive open source with no copyleft contamination (`LICENSE`). |

---

## 🛠️ Quickstart & Reproduction

### Prerequisites
- Node.js 18+ (tested on Node.js 22)
- npm or pnpm

### 1. Clone the Public Repository
```bash
git clone https://github.com/kapasainitishreddy/scribe-studio.git
cd scribe-studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
```bash
cp .env.example .env.local
# Add your Google Gemini API key or Parallel Search API key if desired.
# Note: Scribe Studio runs fully offline with built-in deterministic grounding if keys are omitted.
```

### 4. Run Automated Tests (40 / 40 Tests Passing)
```bash
npm test
```

### 5. Run 52-Scenario Evaluation Harness
```bash
npx vitest run tests/agentEvaluationHarness.test.ts
```

### 6. TypeScript Strict Typecheck (0 Errors)
```bash
npm run typecheck
```

### 7. Production Build
```bash
npm run build
```

### 8. Launch Local Application
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚡ How to Run the Hero Demo

1. Open [https://kapasainitishreddy.github.io/scribe-studio/](https://kapasainitishreddy.github.io/scribe-studio/) (or local dev server).
2. Click the **"⚡ Hero Run: Scene 18 Gun"** button in the top navigation bar.
3. Observe the 9-stage closed-loop execution:
   - **AST Diff:** Detects Maya failing to discover the weapon in Scene 18.
   - **Selective Blast Radius:** Flags Panels 4 & 6 as `OUTDATED` and Maya's packet as `STALE`. Panels 1–3 & 5 remain `APPROVED`.
   - **Parallel Grounding:** Fetches verified naval maritime and fire suppression citations.
   - **Human Veto:** Click **Reject** to verify zero mutations are committed.
   - Re-run and click **Approve** to commit atomic reconciliation: consistency errors drop to 0, stale packets drop to 0, and `unaffectedArtifactsRegenerated` equals 0.

---

## 📄 Documentation Index

- [Submission Gate Audit (24/24 PASS)](docs/SUBMISSION_GATE.md)
- [Devpost Submission Text](docs/DEVPOST_SUBMISSION.md)
- [Live Runtime Telemetry & Proof](docs/LIVE_RUNTIME_VERIFICATION.md)
- [Evaluation Harness Methodology](docs/EVALUATION.md)
- [Clean-Clone Verification Report](docs/CLEAN_CLONE_VERIFICATION.md)
- [Pre-Push Security & Secret Audit](docs/SECURITY_AUDIT.md)
- [Public Repository Verification](docs/PUBLIC_REPO_VERIFICATION.md)
- [3-Minute Demo Video Script](docs/DEMO_SCRIPT.md)
- [Open Source & License Audit](docs/OPEN_SOURCE.md)
- [Provenance Attestation](docs/PROVENANCE.md)

---

## ⚖️ License
Distributed under the permissive **MIT License**. See [`LICENSE`](LICENSE) for details.
