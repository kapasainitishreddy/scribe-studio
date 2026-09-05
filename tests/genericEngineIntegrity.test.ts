import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { computeScreenplayDelta } from "../packages/continuity-engine/src/propagationEngine";
import { parseScreenplay } from "../packages/screenplay-core/src/fountain";

describe("Finding 3 & 12 — Generic Engine Integrity & Multi-Screenplay Dynamic Blast Radius", () => {
  it("verifies zero hardcoded demo constants exist in core engine source files", () => {
    const filesToAudit = [
      "packages/continuity-engine/src/propagationEngine.ts",
      "packages/continuity-engine/src/continuityRules.ts",
      "packages/screenplay-core/src/fountain.ts",
      "packages/screenplay-core/src/diff.ts",
      "server/src/agents/rootProductionAgent.ts",
      "server/src/agents/consolidationAgent.ts",
      "server/src/agents/continuityReasoningAgent.ts",
      "server/src/agents/productionImpactAgent.ts",
      "server/src/agents/realityResearchAgent.ts",
      "server/src/agents/changeImpactAgent.ts"
    ];

    const forbiddenPatterns = [
      "scene-18-continuity-payoff",
      "scene-18-actor-sides",
      "panel.panelNumber === 4",
      "panel.panelNumber === 6"
    ];

    for (const relPath of filesToAudit) {
      const fullPath = path.resolve(__dirname, "..", relPath);
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        for (const pattern of forbiddenPatterns) {
          expect(
            fileContent.includes(pattern),
            `Architectural violation: Forbidden demo-specific constant "${pattern}" found in generic engine file: ${relPath}`
          ).toBe(false);
        }
      }
    }
  });

  it("dynamically evaluates blast radius for Screenplay A (Cyberpunk Med-Lab) without modification", () => {
    const screenplayA = `Title: CYBERPUNK MED-LAB\n\nEXT. BIO-DOME - NIGHT\n\nDr. Aris approaches the perimeter airlock.\n\nINT. LAB BAY 5 - NIGHT\n\nARIS\nThe synth-blood synthesis is unstable.\n\nHe injects the SYNTH-BLOOD VIAL into the centrifuge.\n\nEXT. ARCTIC LANDING STRIP - DAY\n\nVANCE\nWe need the synth-blood samples delivered before dusk.\n\nINT. RECOVERY WARD - DAY\n\nNurse Chloe checks the patient telemetry monitors. All vital signs are nominal.\n`;

    const parsed = parseScreenplay(screenplayA);
    expect(parsed.scenes.length).toBe(4);

    const delta = computeScreenplayDelta(
      screenplayA,
      screenplayA.replace("He injects the SYNTH-BLOOD VIAL", "He smashes the SYNTH-BLOOD VIAL")
    );

    expect(delta.changedSceneNumbers).toEqual([2]);
    expect(delta.affectedCharacterIds).toContain("aris");
    expect(delta.affectedCharacterIds).not.toContain("nurse-chloe");
  });

  it("dynamically evaluates blast radius for Screenplay B (Historical Treaty) without modification", () => {
    const screenplayB = `Title: THE 1919 ARMISTICE\n\nINT. VERSAILLES HALL - DAY\n\nHALIFAX\nThe delegation awaits the formal treaty scroll.\n\nINT. DOWNING STREET - NIGHT\n\nCHURCHILL\nWe shall append our signature to the TREATY SCROLL at dawn.\n\nEXT. SOMME TRENCHES - DAY\n\nCorporal Evans cleans his Enfield rifle in the mud. The rain pours steadily.\n`;

    const parsed = parseScreenplay(screenplayB);
    expect(parsed.scenes.length).toBe(3);

    const delta = computeScreenplayDelta(
      screenplayB,
      screenplayB.replace("to the TREATY SCROLL at dawn", "to the CODICIL AMENDMENT at dawn")
    );

    expect(delta.changedSceneNumbers).toEqual([2]);
    expect(delta.affectedCharacterIds).toContain("churchill");
    expect(delta.affectedCharacterIds).not.toContain("corporal-evans");
  });
});