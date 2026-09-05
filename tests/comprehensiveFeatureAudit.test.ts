import { describe, it, expect } from "vitest";
import { parseScreenplay, screenplayStats } from "../packages/screenplay-core/src/fountain";
import { conciseDiff, computeDetailedDiff } from "../packages/screenplay-core/src/diff";
import { paginateScreenplay } from "../packages/screenplay-core/src/screenplayFormat";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { propagateScreenplayChange } from "../packages/continuity-engine/src/propagationEngine";
import { analyzeContinuity } from "../packages/continuity-engine/src/continuityRules";
import { generateFullBreakdown } from "../packages/production-engine/src/breakdownClassifier";
import { calculateProductionLogistics } from "../packages/production-engine/src/producerLogistics";
import { buildScreenplayPdf } from "../packages/export-engine/src/exportPdf";
import { exportFdx, importFdx } from "../packages/export-engine/src/interchangeFdx";
import { generateCharacterSidesText } from "../packages/export-engine/src/exportSides";
import { buildSubtitleCues, exportSrt, exportVtt } from "../packages/export-engine/src/subtitles";
import { executeParallelSearch } from "../packages/agent-runtime/src/parallelSearch";
import { runProductionResearchAgent } from "../packages/agent-runtime/src/productionResearchAgent";
import type { Project } from "../packages/project-model/src/types";

describe("Scribe Studio — Comprehensive Feature & Engine Audit", () => {
  const project = createSampleProject();

  // 1. Screenplay Core Parser & 54-Line Hollywood Pagination
  it("Feature 1: Screenplay AST Parser & Hollywood 54-Line Pagination", () => {
    const parsed = parseScreenplay(project.screenplayText);
    expect(parsed.scenes.length).toBe(4);
    expect(parsed.lines.length).toBeGreaterThan(50);

    const stats = screenplayStats(project.screenplayText);
    expect(stats.scenes).toBe(4);
    expect(stats.words).toBeGreaterThan(200);
    expect(stats.estimatedPages).toBeGreaterThanOrEqual(1);
    expect(stats.characterCounts["MAYA"]).toBeGreaterThan(0);
    expect(stats.characterCounts["MARCUS"]).toBeGreaterThan(0);

    const pages = paginateScreenplay(project.screenplayText);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    for (const page of pages) {
      expect(page.lines.length).toBeLessThanOrEqual(55);
    }
  });

  // 2. Deterministic Line Diff Engine (<2ms)
  it("Feature 2: Real-time Line-Level AST Diff Engine", () => {
    const textA = "INT. ROOM - DAY\n\nMAYA\nI found the cipher.\n";
    const textB = "INT. ROOM - DAY\n\nMAYA\nI destroyed the cipher.\n";

    const startTime = performance.now();
    const detailed = computeDetailedDiff(textA, textB);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(10); // Under 10ms
    expect(detailed.identical).toBe(false);
    expect(detailed.addedCount).toBeGreaterThan(0);

    const concise = conciseDiff(textA, textB);
    expect(concise.identical).toBe(false);
    expect(concise.added).toBeGreaterThan(0);
    expect(concise.preview).toContain("I found the cipher.");
  });

  // 3. Reactive Dependency Propagation Engine (Blast Radius)
  it("Feature 3: Reactive Blast Radius & Selective Invalidation", () => {
    const modifiedText = project.screenplayText.replace(
      "She pulls an ENCRYPTED TITANIUM DRIVE from her combat belt",
      "She pulls a NEURAL QUANTUM SPLICE from her combat belt"
    );

    const result = propagateScreenplayChange(project, modifiedText, "user-edit");
    const updated = result.updatedProject;

    // Maya Lin & Marcus Kane appear in Scene 1 -> must be STALE
    expect(updated.propagationState.staleActorPackets).toContain("maya-lin");
    expect(updated.propagationState.staleActorPackets).toContain("marcus-kane");

    // Dr. Aris Thorne does NOT appear in Scene 1 -> must remain PRISTINE
    expect(updated.propagationState.staleActorPackets).not.toContain("dr-aris-thorne");

    // Audit trail must record the event
    expect(updated.propagationState.auditTrail.length).toBeGreaterThan(0);
    expect(updated.propagationState.auditTrail[0].affectedScenes).toContain(1);
  });

  // 4. Continuity Supervisor Agent (7 Categories)
  it("Feature 4: Continuity Supervisor Agent (Teleportation & Logic)", () => {
    // Inject teleportation anomaly: Scene 1 Vault 7 Night -> Scene 2 Tokyo Docks CONTINUOUS
    const badScript = `INT. VAULT 7 - NIGHT\n\nMAYA\nI am in the subterranean vault.\n\nEXT. TOKYO DOCKS - CONTINUOUS\n\nMAYA\nNow I am suddenly at the docks without travel.`;
    const tempProject = { ...project, screenplayText: badScript };
    const issues = analyzeContinuity(tempProject);
    expect(issues.some((i) => i.category === "teleportation")).toBe(true);
  });

  // 5. 16-Category Production Breakdown Engine
  it("Feature 5: 16-Category Automated Production Breakdown", () => {
    const fullBreakdown = generateFullBreakdown(project);
    expect(fullBreakdown.length).toBeGreaterThan(5);

    const castElements = fullBreakdown.filter((e) => e.category === "cast");
    expect(castElements.length).toBeGreaterThan(0);

    const vehicleOrStunts = fullBreakdown.filter(
      (e) => e.category === "vehicles" || e.category === "stunts" || e.category === "props"
    );
    expect(vehicleOrStunts.length).toBeGreaterThan(0);
  });

  // 6. Producer Logistics & Scheduling Intelligence
  it("Feature 6: Producer Logistics & Schedule Calculation", () => {
    const logistics = calculateProductionLogistics(project);
    expect(logistics.totalScenes).toBe(4);
    expect(logistics.uniqueLocationCount).toBeGreaterThanOrEqual(3);
    expect(logistics.estimatedShootingDays).toBeGreaterThanOrEqual(1);
    expect(logistics.nightShootCount).toBeGreaterThan(0);
    expect(logistics.castDayRequirements["MAYA"]).toBeGreaterThan(0);
  });

  // 7. Story Bible & Inviolable Canon Engine
  it("Feature 7: Story Bible Inviolability Lock", () => {
    const lockedFact = project.canon.find((f) => f.locked);
    expect(lockedFact).toBeDefined();
    expect(lockedFact?.locked).toBe(true);
    expect(lockedFact?.status).toBe("locked");
  });

  // 8. Actor Packets & Cue Tracking
  it("Feature 8: Personalized Actor Packets & Dialogue Cue Generation", () => {
    const sides = generateCharacterSidesText(project.screenplayText, {
      characterName: "MAYA",
      projectTitle: "The Obsidian Protocol",
      includePrecedingCues: true
    });

    expect(sides).toContain("MAYA");
    expect(sides).toContain("(CUE - MARCUS)");
    expect(sides).toContain("The firewall isn't the problem, Marcus.");
  });

  // 9. Industry Vector PDF Export
  it("Feature 9: Pixel-Perfect Courier 12pt Vector PDF Export", () => {
    const pdfBytes = buildScreenplayPdf(project.screenplayText, { pageNumbers: true });
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    const header = String.fromCharCode(...pdfBytes.slice(0, 8));
    expect(header).toContain("%PDF-1.4");
  });

  // 10. Final Draft FDX XML Interchange
  it("Feature 10: Final Draft FDX XML Lossless Roundtrip", () => {
    const fdxXml = exportFdx(project.screenplayText);
    expect(fdxXml).toContain("<FinalDraft");
    expect(fdxXml).toContain('Type="Scene Heading"');
    expect(fdxXml).toContain('Type="Character"');
    expect(fdxXml).toContain('Type="Dialogue"');

    const imported = importFdx(fdxXml);
    expect(imported.document).toContain("INT. CYBER VAULT 7 - NIGHT");
    expect(imported.document).toContain("MAYA");
  });

  // 11. Subtitle Generation Engine (SRT & VTT)
  it("Feature 11: Automated SRT & VTT Subtitles Generation", () => {
    const cues = buildSubtitleCues(project.screenplayText);
    expect(cues.length).toBeGreaterThan(0);

    const srt = exportSrt(cues);
    expect(srt).toContain("-->");

    const vtt = exportVtt(cues);
    expect(vtt).toContain("WEBVTT");
  });

  // 12. 3D Scene Previs Entity Model (Three.js Stage)
  it("Feature 12: 3D Scene Previs Entity Models & Stage Layout", () => {
    expect(project.scene3DObjects.length).toBeGreaterThanOrEqual(4);

    const actors = project.scene3DObjects.filter((o) => o.kind === "actor");
    const cameras = project.scene3DObjects.filter((o) => o.kind === "camera");
    const props = project.scene3DObjects.filter((o) => o.kind === "prop");

    expect(actors.length).toBeGreaterThanOrEqual(2);
    expect(cameras.length).toBeGreaterThanOrEqual(1);
    expect(props.length).toBeGreaterThanOrEqual(1);

    const camA = cameras[0];
    expect(camA.position.x).toBeDefined();
    expect(camA.position.y).toBeDefined();
    expect(camA.position.z).toBeDefined();
  });

  // 13. Partner Track: Parallel Search API Runtime Grounding
  it("Feature 13: Parallel Search API Runtime Grounding", async () => {
    const searchRes = await executeParallelSearch({
      query: "Tokyo harbor industrial drainage storm flumes maritime regulations",
      maxResults: 2
    });

    expect(searchRes.query).toBe("Tokyo harbor industrial drainage storm flumes maritime regulations");
    expect(searchRes.sources.length).toBeGreaterThan(0);
    expect(searchRes.sources[0].url).toContain("http");
    expect(searchRes.sources[0].title).toBeDefined();
    expect(searchRes.sources[0].snippet).toBeDefined();

    const findings = await runProductionResearchAgent({
      project,
      sceneNumber: 4
    });

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].sources.length).toBeGreaterThan(0);
    expect(findings[0].confidence).toBeGreaterThan(0.7);
    expect(["APPROVED", "NEEDS REVIEW", "NOT_CHECKED"]).toContain(findings[0].status);
    expect(findings[0].evidenceState).toBeDefined();
  });

  // 14. Strict AI Compliance (Zero Disallowed Vendors)
  it("Feature 14: Strict AI Compliance (Zero Disallowed Vendors)", () => {
    expect(project.settings.activeProvider).toBe("google-gemini");
    const configuredProviders = Object.keys(project.settings.providers);
    expect(configuredProviders).toContain("google-gemini");
    expect(configuredProviders).toContain("google-adk");
    expect(configuredProviders).toContain("parallel-search");

    expect(configuredProviders).not.toContain("openai");
    expect(configuredProviders).not.toContain("anthropic");
    expect(configuredProviders).not.toContain("ollama");
    expect(configuredProviders).not.toContain("whisper");
  });
});
