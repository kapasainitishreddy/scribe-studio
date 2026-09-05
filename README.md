# Scribe Studio 🎬

> **"Change the script. Know the production consequences before the set pays for them."**  
> *Screenplay AST + internal production dependency graph + live external evidence graph + human-approved selective propagation.*

**Official Submission for Google Cloud's Agentic Cinema: The Blockbuster Hackathon**  
**Primary Track:** Google Cloud AI (Gemini 1.5 Pro, 2.0 Flash, @google/adk, @google/genai) • **Partner Track:** Parallel Search API (`parallel-web`)  

[![Live Public Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://kapasainitishreddy.github.io/scribe-studio/)
[![Public Repository](https://img.shields.io/badge/GitHub-kapasainitishreddy%2Fscribe--studio-blue?style=for-the-badge&logo=github)](https://github.com/kapasainitishreddy/scribe-studio)
[![Google Cloud AI](https://img.shields.io/badge/Google%20Cloud-@google/adk%20%26%20@google/genai-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Parallel Search API](https://img.shields.io/badge/Partner%20Track-Parallel%20Search%20API%20(parallel--web)-0ea5e9?style=for-the-badge)](https://parallel.ai)
[![Tests](https://img.shields.io/badge/Tests-54%2F54%20Passing%20(13%20Suites)-10b981?style=for-the-badge)](docs/SUBMISSION_TRUTH_MATRIX.md)
[![Evaluation](https://img.shields.io/badge/Evaluation-52%2F52%20Scenarios%20Passing%20(100%25)-10b981?style=for-the-badge)](evaluation-results/submission_metrics.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Public Links & Submission Evidence

- **Live Application URL:** [https://kapasainitishreddy.github.io/scribe-studio/](https://kapasainitishreddy.github.io/scribe-studio/)
- **Public GitHub Repository:** [https://github.com/kapasainitishreddy/scribe-studio](https://github.com/kapasainitishreddy/scribe-studio)
- **Submission Truth Matrix:** [docs/SUBMISSION_TRUTH_MATRIX.md](docs/SUBMISSION_TRUTH_MATRIX.md) *(Every claim audited as PROVEN, PARTIAL, or REMOVE)*
- **Devpost Submission Copy:** [docs/DEVPOST_SUBMISSION.md](docs/DEVPOST_SUBMISSION.md)
- **Official 3-Minute Video Demo Script:** [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- **Automated Verification Telemetry:** [evaluation-results/submission_metrics.json](evaluation-results/submission_metrics.json)

---

## 💡 The Core Problem & The Winning Thesis

In filmmaking and television production, a script change is never just text:
1. An actor receives obsolete dialogue cues on tomorrow's sides.
2. A character references a secret or weapon they never witnessed.
3. Storyboard artists draw shots with props that were rewritten out of the story.
4. Line producers order rentals and permits for scenes that no longer require them.

Existing generative AI tools exacerbate this: they re-prompt entire scripts or indiscriminately regenerate scenes, erasing human director intent and burning thousands of compute tokens.

**Scribe Studio treats the screenplay as the root node of an active production dependency graph.**
- **Screenplay AST:** Fountain line-level AST diffing with deterministic SHA-256 line hashing (<1.4ms).
- **Internal Production Dependency Graph:** Tracks character epistemic knowledge, 16 breakdown categories, camera plans, and storyboard panels.
- **External Evidence Graph (Parallel Search):** Reality Gate distinguishes dramatic dialogue from factual/regulatory claims, grounding technical claims with live web citations.
- **Human-Approved Selective Propagation:** The director inspects the **Production Change Passport**, approving selective reconciliation (where unaffected artifacts consume strictly zero tokens) or rejecting changes with 0 mutations.

---

## 🏗️ Architecture & Technology Stack

```
[Screenplay AST (Root Node)] (packages/screenplay-core/src/fountain.ts)
                 ↓
[Change Detection & AST Diff Engine (<1.4ms)]
                 ↓
[Reality Gate & Gating Classifier] (packages/agent-runtime/src/realityGate.ts)
   ├── Pure Drama ──► Zero-Compute Protection (0 web queries)
   └── Factual/Regulatory ──► Parallel Search API (parallel-web@1.3.3)
                 ↓
[Google Cloud Agent Backend / ADK] (server/src/index.ts & packages/agent-runtime/)
   ├── ChangeImpactAgent (@google/adk@2.0.0 & @google/genai@2.21.0)
   ├── CharacterEpistemicAgent (Knowledge horizon checks)
   └── ContinuityAuditAgent (26 industry consistency rules)
                 ↓
[Production Change Passport] (packages/project-model/src/passportBuilder.ts)
   ├── Changed AST Nodes & Diff Hash
   ├── Affected vs Protected Artifact Accounting
   ├── Parallel Citations & Evidence States (VERIFIED, POTENTIAL_CONFLICT, UNRESOLVED)
   └── Model & ADK Provenance
                 ↓
[Human Director Decision] ────► REJECT ──► 0 Mutations Committed (Pristine Rollback)
                 │
                 └────► APPROVE
                         ↓
[Selective Invalidation Engine] (unaffectedArtifactsRegenerated === 0)
   ├── Regenerate ONLY dirty Storyboard Panels
   ├── Update ONLY dirty Actor Packets
   └── 1-Click ZIP Production Package (MANIFEST.json + 8 Department Folders)
```

### Dependencies & Zero-Disallowed-Vendors Guarantee
- **Official Google Cloud AI SDKs:** `@google/adk@2.0.0` and `@google/genai@2.21.0`.
- **Parallel Official SDK:** `parallel-web@1.3.3`.
- **Cloud Run Ready Microservice:** Located in `server/` (Express, TypeScript, Dockerfile).
- **Zero non-Google AI Tooling:** Strictly zero occurrences of OpenAI, Anthropic, Ollama, Whisper, or OpenRouter across all source code.

---

## 🚀 Reproduction & Verification Guide

Judges can reproduce and verify all results locally in under 60 seconds:

```bash
# 1. Clone the repository
git clone https://github.com/kapasainitishreddy/scribe-studio.git
cd scribe-studio

# 2. Install dependencies
npm install

# 3. Verify zero TypeScript errors
npm run typecheck

# 4. Run the full unit & integration test suite (54/54 passing across 13 suites)
npm test

# 5. Run the 52-scenario autonomous benchmark evaluation harness
npm run eval

# 6. Run the live credentials / integration test
npm run test:live

# 7. Build the production client bundle
npm run build

# 8. (Optional) Run the Cloud Run agent backend
cd server
npm install
npm run build
npm start
```

---

## 📊 Rigorous Mathematical Verification

All numbers are serialized in `evaluation-results/submission_metrics.json`:

| Metric | Result | Target | Status |
|---|---|---|---|
| **TypeScript Typecheck Errors** | **0** | 0 | ✅ PASS |
| **Vitest Test Suites** | **13 / 13** | 100% | ✅ PASS |
| **Vitest Total Tests** | **54 / 54** | 100% | ✅ PASS |
| **Multi-Scenario Benchmark** | **52 / 52** | 100% | ✅ PASS |
| **Continuity Precision & Recall** | **100.0% / 100.0%** | >95% | ✅ PASS |
| **False Positive Rate** | **0.0%** | <2% | ✅ PASS |
| **Zero-Compute Protection Rate** | **100.0%** | 100% | ✅ PASS |
| **Research Trigger Precision** | **100.0%** | >95% | ✅ PASS |
| **Research Abstention Accuracy** | **100.0%** | 100% | ✅ PASS |
| **Unaffected Artifacts Regenerated** | **Strictly 0** | 0 | ✅ PASS |

---

## 📦 1-Click Production Package ZIP

When exporting, Scribe Studio generates a single industry standard ZIP archive (`PROJECT_PRODUCTION_PACKAGE.zip`) containing:
- `/MANIFEST.json` — Project metadata, revision colors, scene counts, and package checksums.
- `/SCRIPT/` — Hollywood standard PDF, Final Draft FDX XML, master Fountain script, and SRT subtitles.
- `/CAST/` — Recipient-partitioned rehearsal sides for every actor with preceding cues and dedicated PDFs.
- `/DIRECTOR/` — Beat sheet with scene function, objective, conflict, turn, and stakes.
- `/CAMERA/` — Cinematographer shotlist CSV with dynamic coverage topology and explicit **"Why This Shot Exists (Reason)"** column.
- `/CONTINUITY/` — Script supervisor prop, wardrobe, and physical condition timeline logs.
- `/PRODUCTION/` — 16 Hollywood categories breakdown CSV.
- `/RESEARCH/` — Parallel Search evidence citations, claim assessments, and URLs.
- `/CHANGE_PASSPORTS/` — Production Change Passports capturing every diff, affected vs protected nodes, and model provenance.

---

## ⚖️ Permissive Open Source License
Released under the **MIT License**. 100% permissive open source.
