import { describe, it, expect } from "vitest";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { propagateScreenplayChange, computeScreenplayDelta } from "../packages/continuity-engine/src/propagationEngine";

describe("The Dependency Propagation Engine", () => {
  it("should compute exact screenplay delta when a scene is edited", () => {
    const project = createSampleProject();
    const modifiedText = project.screenplayText.replace(
      "Two minutes until their automated sweeps cycle back.",
      "Sixty seconds until their automated sweeps cycle back. We must hurry!"
    );

    const delta = computeScreenplayDelta(project.screenplayText, modifiedText);
    expect(delta.changedSceneNumbers).toEqual([1]);
    expect(delta.affectedCharacterIds).toContain("marcus");
  });

  it("should invalidate affected actor packets and shot lists while preserving unrelated artifacts", () => {
    const project = createSampleProject();
    // Initially packets are not stale
    expect(project.actorPackets["maya-lin"].isStale).toBe(false);
    expect(project.actorPackets["marcus-kane"].isStale).toBe(false);

    // Edit Scene 1
    const modifiedText = project.screenplayText.replace(
      "The firewall isn't the problem, Marcus.",
      "The firewall is completely unresponsive, Marcus."
    );

    const result = propagateScreenplayChange(project, modifiedText, "user-edit");

    // Maya Lin & Marcus Kane appear in Scene 1, so their actor packets must be invalidated
    expect(result.invalidatedActorPackets).toContain("maya-lin");
    expect(result.updatedProject.actorPackets["maya-lin"].isStale).toBe(true);
    expect(result.updatedProject.actorPackets["maya-lin"].staleReason).toContain("Scene(s) 1");

    // Scene 1 shot list should be marked stale
    expect(result.invalidatedShotLists).toContain(1);
    expect(result.updatedProject.shotLists[1].isStale).toBe(true);

    // Version incremented
    expect(result.updatedProject.version).toBe(project.version + 1);

    // Audit trail recorded
    expect(result.updatedProject.propagationState.auditTrail.length).toBeGreaterThan(1);
    const latestEvent = result.updatedProject.propagationState.auditTrail[0];
    expect(latestEvent.affectedScenes).toContain(1);
  });
});
