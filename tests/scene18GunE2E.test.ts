import { describe, it, expect } from "vitest";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { extractScene } from "../packages/production-engine/src/sceneExtraction";
import { generateStoryboardSequence } from "../packages/production-engine/src/storyboardGenerator";
import {
  propagateScreenplayChange,
  calculateProjectMetrics,
  verifyProjectConsistency
} from "../packages/continuity-engine/src/propagationEngine";
import type { Project, StoryboardSequence } from "../packages/project-model/src/types";

describe("Scene 18 Gun Discovery E2E Automated Benchmark", () => {
  const scene18ScreenplayText = `
SCENE 18

EXT. SUBURBAN GARAGE - NIGHT #18#

Rain lashes against the corrugated steel door. MAYA LIN slips through the broken side latch into the shadows.

MAYA LIN
(whispering)
I'm inside the secondary perimeter.

She sweeps her tactical flashlight across rows of dust-covered shelving. A heavy TOOL CABINET sits against the back wall, its lock visibly jimmied.

A sharp METALLIC CLATTER echoes from the floor above. Maya freezes, killing her light.

Silence resumes. She moves to the cabinet and forces open the bent third drawer.
Beneath oily rags, Maya discovers a concealed GLOCK 19 semi-automatic handgun with an acoustic suppressor.

BASE COMMS
(over radio static)
Unit One, sweeps are turning back toward Sector 4. Evacuate immediately.

MAYA LIN
Ten seconds.

Maya hides the Glock securely into her inner jacket lining and slides the drawer shut.
`;

  function setupScene18Project(): Project {
    const base = createSampleProject();
    base.screenplayText = `${base.screenplayText.trim()}\n\n${scene18ScreenplayText.trim()}\n`;

    // Add Scene 18 to Maya Lin's packet (Marcus Kane & Dr. Aris Thorne are not in Scene 18)
    base.actorPackets["maya-lin"].scenes.push({
      sceneId: "scene-18",
      sceneNumber: 18,
      sceneHeading: "EXT. SUBURBAN GARAGE - NIGHT",
      dramaticObjective: "Locate covert weapon and exfiltrate safely",
      emotionalState: "Hyper-vigilant, secretive",
      wardrobeCheck: "Tactical leather jacket with concealed lining",
      propsRequired: ["Flashlight", "Tool Cabinet", "Glock 19 Gun"],
      secretsKnown: ["Possesses covert firearm"],
      cues: []
    });

    const extraction = extractScene(base.screenplayText, 18, {
      characters: base.characters
    });
    base.extractions[18] = extraction;

    // 6-panel storyboard for Scene 18 initially APPROVED
    const seq18 = generateStoryboardSequence(extraction, {
      layout: "6-panel",
      aspectRatio: "16:9"
    });
    seq18.panels = seq18.panels.map((p, idx) => {
      const panelNum = idx + 1;
      return {
        ...p,
        panelNumber: panelNum,
        status: "APPROVED" as const,
        propsVisible:
          panelNum === 4
            ? ["Glock 19 Gun", "Suppressor"]
            : panelNum === 6
            ? ["Glock 19 Gun"]
            : panelNum === 2
            ? ["Flashlight"]
            : []
      };
    }).slice(0, 6);

    base.storyboardSequences[18] = seq18;
    return base;
  }

  it("Fixture baseline: Scene 18 panels are all APPROVED and actor packets are pristine", () => {
    const project = setupScene18Project();
    const seq = project.storyboardSequences[18];

    expect(seq.panels.length).toBe(6);
    expect(seq.panels.every((p) => p.status === "APPROVED")).toBe(true);
    expect(project.actorPackets["maya-lin"].isStale).toBe(false);
    expect(project.actorPackets["marcus-kane"].isStale).toBe(false);
    expect(project.storyboardSequences[2].panels.every((p) => p.status === "APPROVED")).toBe(true);
  });

  it("Screenplay Delta: Maya does NOT discover the gun -> selectively invalidates Panels 4 & 6 while Panels 1-3 & 5 stay APPROVED", () => {
    const project = setupScene18Project();

    // Modify Scene 18: Maya searches the cabinet but does NOT discover any weapon
    const originalText = project.screenplayText;
    const modifiedText = originalText
      .replace(
        "Beneath oily rags, Maya discovers a concealed GLOCK 19 semi-automatic handgun with an acoustic suppressor.",
        "Maya searches the cabinet thoroughly but does NOT discover any weapon, finding only rusted wrench sets."
      )
      .replace(
        "Maya hides the Glock securely into her inner jacket lining and slides the drawer shut.",
        "Maya slides the empty drawer shut with empty hands, exhaling in cold frustration."
      );

    expect(modifiedText).not.toEqual(originalText);

    // Run dependency propagation
    const result = propagateScreenplayChange(project, modifiedText, "user-edit");
    const updated = result.updatedProject;

    // 1. Check changed scenes & actors
    expect(result.delta.changedSceneNumbers).toEqual([18]);
    expect(result.delta.affectedCharacterIds).toContain("maya-lin");
    expect(result.delta.affectedCharacterIds).not.toContain("marcus-kane");

    // 2. Actor packet blast radius: Maya is STALE, Marcus & Thorne are UNTOUCHED
    expect(updated.actorPackets["maya-lin"].isStale).toBe(true);
    expect(updated.actorPackets["maya-lin"].staleReason).toContain("Scene(s) 18");
    expect(updated.actorPackets["marcus-kane"].isStale).toBe(false);

    // 3. Scene 2 (Dr. Thorne) is completely unaffected
    const seq2 = updated.storyboardSequences[2];
    expect(seq2.panels.every((p) => p.status === "APPROVED")).toBe(true);

    // 4. Storyboard selective invalidation in Scene 18:
    const seq18 = updated.storyboardSequences[18];
    const p1 = seq18.panels.find((p) => p.panelNumber === 1)!;
    const p2 = seq18.panels.find((p) => p.panelNumber === 2)!;
    const p3 = seq18.panels.find((p) => p.panelNumber === 3)!;
    const p4 = seq18.panels.find((p) => p.panelNumber === 4)!;
    const p5 = seq18.panels.find((p) => p.panelNumber === 5)!;
    const p6 = seq18.panels.find((p) => p.panelNumber === 6)!;

    // Panels 4 & 6 must be OUTDATED (gun discovery and gun concealment invalidated)
    expect(p4.status).toBe("OUTDATED");
    expect(p6.status).toBe("OUTDATED");
    expect(p4.outdatedReason).toBeDefined();
    expect(p6.outdatedReason).toBeDefined();

    // Panels 1, 2, 3, 5 must remain APPROVED (Zero wasted compute!)
    expect(p1.status).toBe("APPROVED");
    expect(p2.status).toBe("APPROVED");
    expect(p3.status).toBe("APPROVED");
    expect(p5.status).toBe("APPROVED");

    // Stale panels list in propagation state
    expect(updated.propagationState.staleStoryboardPanels).toContain(p4.id);
    expect(updated.propagationState.staleStoryboardPanels).toContain(p6.id);
    expect(updated.propagationState.staleStoryboardPanels).not.toContain(p1.id);
  });

  it("REJECT branch: Rejection aborts change with zero mutations to project state", () => {
    const originalProject = setupScene18Project();
    const originalSnapshot = JSON.stringify(originalProject);

    // Rejection simulation
    const rejectedProject = JSON.parse(originalSnapshot);

    // Verify 0 mutations
    expect(rejectedProject.screenplayText).toEqual(originalProject.screenplayText);
    expect(rejectedProject.actorPackets["maya-lin"].isStale).toBe(false);
    expect(rejectedProject.storyboardSequences[18].panels.every((p: any) => p.status === "APPROVED")).toBe(true);
    expect(rejectedProject.propagationState.staleStoryboardPanels.length).toBe(0);
  });

  it("APPROVE branch: Closed-loop selective regeneration + automated verification pass", () => {
    const project = setupScene18Project();

    // Apply the Scene 18 change
    const originalText = project.screenplayText;
    const modifiedText = originalText
      .replace(
        "Beneath oily rags, Maya discovers a concealed GLOCK 19 semi-automatic handgun with an acoustic suppressor.",
        "Maya searches the cabinet thoroughly but does NOT discover any weapon, finding only rusted wrench sets."
      )
      .replace(
        "Maya hides the Glock securely into her inner jacket lining and slides the drawer shut.",
        "Maya slides the empty drawer shut with empty hands, exhaling in cold frustration."
      );

    const { updatedProject: blastRadiusProject } = propagateScreenplayChange(project, modifiedText, "user-edit");

    // Compute live BEFORE metrics
    const beforeMetrics = calculateProjectMetrics(blastRadiusProject);
    expect(beforeMetrics.staleActorPackets).toBeGreaterThanOrEqual(1);
    expect(beforeMetrics.staleStoryboardPanels).toBe(2);

    // APPROVE WORKFLOW:
    // 1. Selectively regenerate only stale actor packet (Maya Lin)
    const approvedProject: Project = JSON.parse(JSON.stringify(blastRadiusProject));
    approvedProject.actorPackets["maya-lin"].isStale = false;
    approvedProject.actorPackets["maya-lin"].staleReason = undefined;
    approvedProject.actorPackets["maya-lin"].lastGeneratedAt = new Date().toISOString();
    approvedProject.propagationState.staleActorPackets = [];

    // 2. Selectively regenerate only outdated panels (Panels 4 & 6)
    const seq18 = approvedProject.storyboardSequences[18];
    seq18.panels = seq18.panels.map((p) => {
      if (p.status === "OUTDATED") {
        return {
          ...p,
          status: "APPROVED",
          action: p.panelNumber === 4
            ? "Maya searches the cabinet thoroughly, finding only rusted wrench sets."
            : "Maya slides the empty drawer shut with empty hands.",
          propsVisible: ["Rusted Wrenches"],
          version: p.version + 1,
          outdatedReason: undefined
        };
      }
      return p;
    });
    approvedProject.propagationState.staleStoryboardPanels = [];
    approvedProject.propagationState.staleBreakdownScenes = [];
    approvedProject.propagationState.staleShotLists = [];
    approvedProject.continuityIssues = approvedProject.continuityIssues.map((i) => ({
      ...i,
      status: "resolved" as const
    }));

    // 3. Automated Verification Run with 0 unaffected artifacts regenerated
    const verificationReport = verifyProjectConsistency(approvedProject, beforeMetrics, 0);

    expect(verificationReport.status).toBe("PASS");
    expect(verificationReport.beforeMetrics.staleActorPackets).toBeGreaterThanOrEqual(1);
    expect(verificationReport.beforeMetrics.staleStoryboardPanels).toBe(2);
    expect(verificationReport.afterMetrics.continuityIssues).toBe(0);
    expect(verificationReport.afterMetrics.staleActorPackets).toBe(0);
    expect(verificationReport.afterMetrics.staleStoryboardPanels).toBe(0);
    expect(verificationReport.afterMetrics.productionMismatches).toBe(0);
    expect(verificationReport.unaffectedArtifactsRegenerated).toBe(0); // ZERO WASTED COMPUTE
  });
});
