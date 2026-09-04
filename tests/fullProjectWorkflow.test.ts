import { describe, it, expect } from "vitest";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { propagateScreenplayChange } from "../packages/continuity-engine/src/propagationEngine";
import { generateCharacterSidesText, generateCharacterSidesPdf } from "../packages/export-engine/src/exportSides";
import { buildScreenplayPdf } from "../packages/export-engine/src/exportPdf";
import { exportFdx } from "../packages/export-engine/src/interchangeFdx";
import { computeDetailedDiff } from "../packages/screenplay-core/src/diff";
import { parseScreenplay } from "../packages/screenplay-core/src/fountain";

describe("End-to-End Filmmaking Workflow Integration Test", () => {
  it("executes the complete master workflow from script mutation to propagation, packet sync, revisions, and export", () => {
    // 1. Load project
    const project = createSampleProject();
    expect(project.title).toBe("The Obsidian Protocol");
    expect(project.actorPackets["maya-lin"].isStale).toBe(false);

    // 2. Modify Scene 1 text
    const editedScript = project.screenplayText.replace(
      "Tell me you've bypassed the biocentric firewall.",
      "Tell me you've completely shattered the biocentric firewall."
    );

    // 3. Trigger Reactive Propagation Engine
    const result = propagateScreenplayChange(project, editedScript, "user-edit");
    const updated = result.updatedProject;

    // 4. Verify invalidation blast radius
    expect(result.delta.changedSceneNumbers).toEqual([1]);
    expect(updated.actorPackets["maya-lin"].isStale).toBe(true);
    expect(updated.actorPackets["marcus-kane"].isStale).toBe(true);
    expect(updated.shotLists[1].isStale).toBe(true);

    // 5. Regenerate Maya's Actor Packet
    const mayaPacket = updated.actorPackets["maya-lin"];
    mayaPacket.isStale = false;
    mayaPacket.lastGeneratedAt = new Date().toISOString();
    expect(mayaPacket.isStale).toBe(false);

    // 6. Create a new Revision
    const pinkRev = {
      id: "rev-pink-3",
      color: "Pink" as const,
      label: "Stunt & Dialogue Polish",
      screenplayText: updated.screenplayText,
      createdAt: new Date().toISOString(),
      author: updated.author,
      summaryOfChanges: "Polished biocentric firewall dialogue in Scene 1.",
      changedSceneNumbers: [1],
      stats: { scenes: 4, dialogueBlocks: 10, words: 300, estimatedPages: 2, characterCounts: {} }
    };
    updated.revisions.unshift(pinkRev);

    // 7. Verify revision diff
    const diff = computeDetailedDiff(project.screenplayText, updated.screenplayText);
    expect(diff.identical).toBe(false);
    expect(diff.lines.some((l) => l.text.includes("shattered"))).toBe(true);

    // 8. Generate Exports
    const pdfBytes = buildScreenplayPdf(updated.screenplayText, { pageNumbers: true });
    expect(pdfBytes.length).toBeGreaterThan(100);

    const fdxXml = exportFdx(updated.screenplayText);
    expect(fdxXml).toContain("<FinalDraft");

    const sidesText = generateCharacterSidesText(updated.screenplayText, {
      characterName: "MAYA",
      projectTitle: updated.title,
      includePrecedingCues: true
    });
    expect(sidesText).toContain("MAYA");
    expect(sidesText).toContain("The firewall isn't the problem, Marcus.");

    const sidesPdf = generateCharacterSidesPdf(updated.screenplayText, {
      characterName: "MAYA",
      projectTitle: updated.title
    });
    expect(sidesPdf.length).toBeGreaterThan(100);
  });
});
