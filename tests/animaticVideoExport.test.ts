import { describe, it, expect } from "vitest";
import {
  buildEditorialTimelineForScene,
  checkBrowserVideoCapabilities
} from "../packages/production-engine/src/animaticExporter";
import type { Project, StoryboardPanel } from "../packages/project-model/src/types";
import { createSampleProject } from "../packages/project-model/src/sampleProject";

describe("Animatic Video Export & Editorial Timeline Engine", () => {
  const samplePanels: StoryboardPanel[] = [
    {
      id: "panel-18-1",
      sequenceId: "seq-18",
      sceneNumber: 18,
      beatId: "b-18-1",
      panelNumber: 1,
      shotType: "wide",
      cameraAngle: "low-angle",
      lensSuggestion: "24mm Anamorphic",
      cameraMovement: "Slow Dolly In",
      composition: "Maya stands in the doorway.",
      charactersVisible: ["Maya"],
      action: "Maya enters the flooded sub-level.",
      dialogue: "We have less than three minutes.",
      location: "Sub-level 4",
      propsVisible: ["Flashlight"],
      lightingIntent: "Cyan spill",
      mood: "tense",
      continuityReferences: [],
      directorNotes: "Master establishing",
      generationPrompt: "Cinematic film still",
      version: 1,
      status: "APPROVED",
      sourceLineIds: []
    },
    {
      id: "panel-18-2",
      sequenceId: "seq-18",
      sceneNumber: 18,
      beatId: "b-18-2",
      panelNumber: 2,
      shotType: "close-up",
      cameraAngle: "eye-level",
      lensSuggestion: "50mm Prime",
      cameraMovement: "Static",
      composition: "Tight on Maya's hands.",
      charactersVisible: ["Maya"],
      action: "She reaches into her utility pouch.",
      dialogue: "Where is the drive?",
      location: "Sub-level 4",
      propsVisible: ["Titanium Drive"],
      lightingIntent: "Amber fill",
      mood: "urgent",
      continuityReferences: [],
      directorNotes: "Focus on prop",
      generationPrompt: "Cinematic closeup",
      version: 2,
      status: "OUTDATED", // Stale panel due to revision
      sourceLineIds: []
    }
  ];

  const baseProject = createSampleProject();
  const mockProject: Project = {
    ...baseProject,
    id: "proj-101",
    title: "The Zero Protocol",
    author: "Elena Vance",
    version: 2,
    storyboardSequences: {
      18: {
        id: "seq-18",
        sceneNumber: 18,
        title: "Scene 18 Animatic",
        layout: "4-panel",
        panels: samplePanels,
        aspectRatio: "16:9",
        updatedAt: new Date().toISOString()
      }
    },
    propagationState: {
      ...baseProject.propagationState,
      staleStoryboardPanels: ["panel-18-2"]
    }
  };

  it("builds a mathematically valid EditorialTimeline with 24 FPS frame ranges", () => {
    const timeline = buildEditorialTimelineForScene(mockProject, 18, 24);

    expect(timeline.sceneNumber).toBe(18);
    expect(timeline.fps).toBe(24);
    expect(timeline.timecodeStart).toBe("01:00:00:00");
    expect(timeline.tracks.length).toBe(2);

    const videoTrack = timeline.tracks.find((t) => t.kind === "video");
    expect(videoTrack).toBeDefined();
    expect(videoTrack?.clips.length).toBe(2);

    // Frame sequential continuity check
    const clip1 = videoTrack!.clips[0];
    const clip2 = videoTrack!.clips[1];

    expect(clip1.startFrame).toBe(0);
    expect(clip1.durationFrames).toBeGreaterThan(0);
    expect(clip2.startFrame).toBe(clip1.durationFrames);
    expect(timeline.totalDurationFrames).toBe(clip1.durationFrames + clip2.durationFrames);
    expect(timeline.totalDurationSeconds).toBeCloseTo(timeline.totalDurationFrames / 24, 2);
  });

  it("preserves status and propagation metadata across video clips", () => {
    const timeline = buildEditorialTimelineForScene(mockProject, 18, 24);
    const videoTrack = timeline.tracks.find((t) => t.kind === "video")!;

    const clip1 = videoTrack.clips[0];
    const clip2 = videoTrack.clips[1];

    expect(clip1.status).toBe("APPROVED");
    expect(clip1.metadata.isStale).toBe(false);

    // Invalidation reached video timeline
    expect(clip2.status).toBe("OUTDATED");
    expect(clip2.metadata.isStale).toBe(true);
    expect(clip2.metadata.lens).toBe("50mm Prime");
  });

  it("extracts synchronized dialogue subtitle clips with speaker attribution", () => {
    const timeline = buildEditorialTimelineForScene(mockProject, 18, 24);
    const subTrack = timeline.tracks.find((t) => t.kind === "subtitles")!;

    expect(subTrack.clips.length).toBe(2);
    expect(subTrack.clips[0].metadata.speaker).toBe("Maya");
    expect(subTrack.clips[0].metadata.dialogueText).toBe("We have less than three minutes.");
    expect(subTrack.clips[1].metadata.dialogueText).toBe("Where is the drive?");
  });

  it("safely handles capability checks in test/headless environments without throwing", async () => {
    const caps = await checkBrowserVideoCapabilities();
    expect(caps).toHaveProperty("supported");
    expect(caps).toHaveProperty("canExportMp4");
    expect(caps).toHaveProperty("canExportWebm");
  });
});
