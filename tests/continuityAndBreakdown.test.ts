import { describe, it, expect } from "vitest";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { analyzeContinuity } from "../packages/continuity-engine/src/continuityRules";
import { classifySceneElements, generateFullBreakdown } from "../packages/production-engine/src/breakdownClassifier";
import { calculateProductionLogistics } from "../packages/production-engine/src/producerLogistics";

describe("Continuity and Production Breakdown Engines", () => {
  it("should classify scene elements across 16 categories", () => {
    const project = createSampleProject();
    const fullBreakdown = generateFullBreakdown(project);
    expect(fullBreakdown.length).toBeGreaterThan(5);

    const castElements = fullBreakdown.filter((e) => e.category === "cast");
    expect(castElements.length).toBeGreaterThan(0);

    const vehicleOrStunts = fullBreakdown.filter((e) => e.category === "vehicles" || e.category === "stunts");
    expect(vehicleOrStunts.length).toBeGreaterThan(0);
  });

  it("should calculate production logistics and complexity metrics", () => {
    const project = createSampleProject();
    const logistics = calculateProductionLogistics(project);
    expect(logistics.totalScenes).toBe(4);
    expect(logistics.uniqueLocationCount).toBeGreaterThanOrEqual(3);
    expect(logistics.estimatedShootingDays).toBeGreaterThanOrEqual(1);
    expect(logistics.nightShootCount).toBeGreaterThan(0);
    expect(logistics.castDayRequirements["MAYA"]).toBeGreaterThan(0);
  });

  it("should detect impossible teleportation between distant locations in continuous time", () => {
    const project = createSampleProject();
    // Inject teleportation: Scene 1 Vault 7 Night -> Scene 2 Tokyo Docks CONTINUOUS with same character
    const badScript = `INT. VAULT 7 - NIGHT\n\nMAYA\nI am in the subterranean vault.\n\nEXT. TOKYO DOCKS - CONTINUOUS\n\nMAYA\nNow I am suddenly at the docks.`;
    const tempProject = { ...project, screenplayText: badScript };
    const issues = analyzeContinuity(tempProject);
    expect(issues.some((i) => i.category === "teleportation")).toBe(true);
  });
});
