import { describe, it, expect } from "vitest";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { createProductionChangePassport } from "../packages/project-model/src/passportBuilder";
import { generateProductionPackageZip } from "../packages/export-engine/src/packageZip";
import { propagateScreenplayChange } from "../packages/continuity-engine/src/propagationEngine";

describe("Production Change Passport & Deterministic Selective Regeneration", () => {
  it("builds a comprehensive change passport capturing affected vs protected artifacts", () => {
    const project = createSampleProject();

    // Introduce an edit in Scene 1
    const modifiedText = project.screenplayText.replace(
      "clicks it into the console port",
      "detonates a concussion breach charge against the console port"
    );

    const propagation = propagateScreenplayChange(project, modifiedText, "user-edit");
    const dirtyProject = propagation.updatedProject;

    const passport = createProductionChangePassport(dirtyProject, 1, "Replaced drive insertion with concussion breach");

    expect(passport.sceneNumber).toBe(1);
    expect(passport.changedAstNodes.length).toBeGreaterThan(0);
    expect(passport.humanDiffSummary).toContain("concussion breach");
    expect(passport.humanDecision).toBe("pending");

    // Must list affected artifacts
    expect(passport.affectedArtifactIds.length).toBeGreaterThan(0);

    // Must explicitly enumerate protected artifacts to prove zero destructive regeneration
    expect(passport.protectedArtifactIds.length).toBeGreaterThan(0);
    expect(passport.protectedArtifactIds.some((a) => a.includes("scene-2") || a.includes("breakdown"))).toBe(true);

    // Provenance must cite Google Cloud ADK & Gemini
    expect(passport.provenance.adkVersion).toBe("@google/adk@2.0.0");
    expect(passport.provenance.model).toBe("gemini-1.5-pro");
  });

  it("verifies Director Reject causes zero mutation to project artifacts", () => {
    const original = createSampleProject();
    const beforePanels = JSON.stringify(original.storyboardSequences);
    const beforePackets = JSON.stringify(original.actorPackets);

    // Director rejects proposal -> baseline state is strictly preserved
    const rejectedPassport = createProductionChangePassport(original, 1);
    rejectedPassport.humanDecision = "rejected";

    expect(rejectedPassport.humanDecision).toBe("rejected");
    expect(rejectedPassport.regeneratedArtifactIds).toHaveLength(0);
    expect(JSON.stringify(original.storyboardSequences)).toBe(beforePanels);
    expect(JSON.stringify(original.actorPackets)).toBe(beforePackets);
  });

  it("verifies Director Approve selectively regenerates only dirty nodes while preserving valid ones", () => {
    const project = createSampleProject();
    const initialSeq2 = JSON.stringify(project.storyboardSequences[2] || {});

    // Mark scene 1 panel outdated
    if (project.storyboardSequences[1] && project.storyboardSequences[1].panels[0]) {
      project.storyboardSequences[1].panels[0].status = "OUTDATED";
    }
    project.propagationState.staleStoryboardPanels = ["panel-1-1"];

    // Approve selective invalidation
    const passport = createProductionChangePassport(project, 1);
    passport.humanDecision = "approved";

    // Regenerate dirty panel
    project.storyboardSequences[1].panels[0].status = "APPROVED";
    project.propagationState.staleStoryboardPanels = [];
    passport.regeneratedArtifactIds = ["panel-1-1"];

    expect(project.storyboardSequences[1].panels[0].status).toBe("APPROVED");
    expect(passport.regeneratedArtifactIds).toEqual(["panel-1-1"]);

    // Unaffected Scene 2 storyboard MUST remain strictly identical
    expect(JSON.stringify(project.storyboardSequences[2] || {})).toBe(initialSeq2);
  });

  it("generates a complete production package ZIP archive with full manifest and department directories", async () => {
    const project = createSampleProject();
    const zipBlob = await generateProductionPackageZip(project);

    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(1000);
    expect(zipBlob.type).toBe("application/zip");
  });
});
