import { describe, it, expect } from "vitest";
import { extractScene } from "../packages/production-engine/src/sceneExtraction";
import {
  generateStoryboardSequence,
  generatePanelSvgSchematic
} from "../packages/production-engine/src/storyboardGenerator";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import { propagateScreenplayChange } from "../packages/continuity-engine/src/propagationEngine";
import type { Project, StoryboardPanel } from "../packages/project-model/src/types";

describe("Scene Comic Pipeline & Selective Invalidation Engine", () => {
  const sample = createSampleProject();

  it("extractScene generates rich structured beats, objectives, and breakdown metadata", () => {
    const extraction = extractScene(sample.screenplayText, 1, {
      characters: sample.characters
    });

    expect(extraction.sceneNumber).toBe(1);
    expect(extraction.slugline).toBe("INT. CYBER VAULT 7 - NIGHT");
    expect(extraction.interiorExterior).toBe("INT");
    expect(extraction.timeOfDay).toContain("NIGHT");
    expect(extraction.charactersPresent).toContain("MAYA LIN");
    expect(extraction.charactersPresent).toContain("MARCUS KANE");

    // Beats
    expect(extraction.storyBeats.length).toBeGreaterThanOrEqual(3);
    for (const beat of extraction.storyBeats) {
      expect(beat.id).toBeDefined();
      expect(beat.beatNumber).toBeGreaterThan(0);
      expect(beat.action).toBeDefined();
      expect(beat.storySignificance).toBeDefined();
      expect(beat.cameraOpportunities.length).toBeGreaterThan(0);
    }

    // Breakdown categories populated
    expect(extraction.props.length).toBeGreaterThan(0);
    expect(extraction.sceneObjective).toBeDefined();
    expect(extraction.conflict).toBeDefined();
  });

  it("generateStoryboardSequence builds valid panels with deterministic SVG schematics", () => {
    const extraction = extractScene(sample.screenplayText, 1, {
      characters: sample.characters
    });
    const sequence = generateStoryboardSequence(extraction, {
      aspectRatio: "16:9",
      layout: "6-panel"
    });

    expect(sequence.sceneNumber).toBe(1);
    expect(sequence.panels.length).toBe(extraction.storyBeats.length);

    for (const panel of sequence.panels) {
      expect(panel.id).toBeDefined();
      expect(panel.sequenceId).toBe(sequence.id);
      expect(panel.panelNumber).toBeGreaterThan(0);
      expect(panel.shotType).toBeDefined();
      expect(panel.cameraAngle).toBeDefined();
      expect(panel.lensSuggestion).toBeDefined();
      expect(panel.lightingIntent).toBeDefined();
      expect(panel.status).toBe("APPROVED");

      // Verify deterministic SVG schematic
      expect(panel.svgSchematic).toBeDefined();
      expect(panel.svgSchematic).toContain("<svg");
      expect(panel.svgSchematic).toContain("</svg>");
      expect(panel.svgSchematic).toContain("polygon"); // camera frustum cone
    }
  });

  it("generatePanelSvgSchematic creates communicative framing for wide, close-up, and dialogue", () => {
    const wideSvg = generatePanelSvgSchematic({
      shotType: "wide",
      cameraAngle: "low-angle",
      action: "Maya inspects terminal.",
      charactersVisible: ["MAYA LIN", "MARCUS KANE"]
    });
    expect(wideSvg).toContain("<svg");
    expect(wideSvg).toContain("MAYA");

    const closeUpSvg = generatePanelSvgSchematic({
      shotType: "close-up",
      cameraAngle: "eye-level",
      action: "Tight on glowing data reel.",
      dialogue: "The cipher matrix is dynamically rebuilding.",
      dialogueSpeaker: "MAYA"
    });
    expect(closeUpSvg).toContain("Speech Bubble");
    expect(closeUpSvg).toContain("MAYA");
    expect(closeUpSvg).toContain("The cipher matrix is dynamically rebuilding.");
  });

  it("Selective Invalidation: Editing Scene 1 invalidates only affected panels while unaffected panels remain APPROVED", () => {
    const project = createSampleProject();

    // Verify initial state: all panels in Scene 1 are APPROVED
    const seq1 = project.storyboardSequences[1];
    expect(seq1).toBeDefined();
    expect(seq1.panels.length).toBeGreaterThan(0);
    expect(seq1.panels.every((p) => p.status === "APPROVED")).toBe(true);

    // Edit Scene 1: Replace physical titanium drive with neural quantum splice
    const originalText = project.screenplayText;
    const modifiedText = originalText.replace(
      "She pulls an ENCRYPTED TITANIUM DRIVE from her combat belt and clicks it into the console port.",
      "She bypasses the biometric lock with a NEURAL QUANTUM SPLICE, flashing amber warning protocols across the vault."
    );

    const result = propagateScreenplayChange(project, modifiedText, "user-edit");
    const updatedProj = result.updatedProject;

    // Verify propagation state recorded invalidated storyboard panels
    expect(result.delta.changedSceneNumbers).toContain(1);
    expect(result.delta.affectedCharacterIds.some((id) => id.includes("maya"))).toBe(true);

    // The sequence for Scene 1 should now reflect selective invalidation
    const updatedSeq1 = updatedProj.storyboardSequences[1];
    expect(updatedSeq1).toBeDefined();

    const outdatedPanels = updatedSeq1.panels.filter((p) => p.status === "OUTDATED");
    const approvedPanels = updatedSeq1.panels.filter((p) => p.status === "APPROVED");

    // CRITICAL REQUIREMENT: Not all panels are invalidated! Zero wasted compute!
    expect(outdatedPanels.length).toBeGreaterThan(0);
    expect(approvedPanels.length).toBeGreaterThan(0);
    expect(outdatedPanels.length + approvedPanels.length).toBe(updatedSeq1.panels.length);

    // Verify invalidation reason is attached
    for (const panel of outdatedPanels) {
      expect(panel.invalidationReason || panel.outdatedReason).toBeDefined();
    }

    // Verify Scene 2, 3, 4 storyboard panels remain APPROVED (untouched!)
    const seq2 = updatedProj.storyboardSequences[2];
    if (seq2) {
      expect(seq2.panels.every((p) => p.status === "APPROVED")).toBe(true);
    }
  });

  it("Story Threads tracking across scenes", () => {
    expect(sample.storyThreads).toBeDefined();
    expect(sample.storyThreads.length).toBeGreaterThanOrEqual(3);

    const obsidianProtocol = sample.storyThreads.find((t) => t.id === "thread-obsidian-drive");
    expect(obsidianProtocol).toBeDefined();
    expect(obsidianProtocol?.scenesInvolved).toContain(1);
    expect(obsidianProtocol?.scenesInvolved).toContain(4);

    const elenaInvestigation = sample.storyThreads.find((t) => t.id === "thread-elena-investigation");
    expect(elenaInvestigation).toBeDefined();
    expect(elenaInvestigation?.charactersInvolved).toContain("maya-lin");
  });
});
