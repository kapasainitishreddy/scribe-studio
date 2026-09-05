import type { Project, PropagationEvent, ActorPacket } from "../../project-model/src/types";
import { parseScreenplay } from "../../screenplay-core/src/fountain";
import { conciseDiff } from "../../screenplay-core/src/diff";
import { analyzeContinuity } from "./continuityRules";
import type { PropagationResult, ScreenplayDelta } from "./types";

export function computeScreenplayDelta(oldText: string, newText: string): ScreenplayDelta {
  const oldParsed = parseScreenplay(oldText);
  const newParsed = parseScreenplay(newText);

  const oldSceneMap = new Map<number, string>();
  for (const s of oldParsed.scenes) {
    const text = oldParsed.lines.filter((l) => s.lineIds.includes(l.id)).map((l) => l.text).join("\n");
    oldSceneMap.set(s.number, text);
  }

  const newSceneMap = new Map<number, string>();
  for (const s of newParsed.scenes) {
    const text = newParsed.lines.filter((l) => s.lineIds.includes(l.id)).map((l) => l.text).join("\n");
    newSceneMap.set(s.number, text);
  }

  const changedSceneNumbers: number[] = [];
  const addedSceneNumbers: number[] = [];
  const removedSceneNumbers: number[] = [];
  const affectedCharacters = new Set<string>();

  for (const [sNum, newContent] of newSceneMap.entries()) {
    const oldContent = oldSceneMap.get(sNum);
    if (oldContent === undefined) {
      addedSceneNumbers.push(sNum);
      changedSceneNumbers.push(sNum);
    } else if (oldContent !== newContent) {
      changedSceneNumbers.push(sNum);
    }
  }

  for (const sNum of oldSceneMap.keys()) {
    if (!newSceneMap.has(sNum)) {
      removedSceneNumbers.push(sNum);
      changedSceneNumbers.push(sNum);
    }
  }

  // Find characters in changed scenes
  for (const sNum of changedSceneNumbers) {
    const scene = newParsed.scenes.find((s) => s.number === sNum);
    if (scene) {
      const lines = newParsed.lines.filter((l) => scene.lineIds.includes(l.id));
      for (const line of lines) {
        if (line.kind === "character" && line.speaker) {
          affectedCharacters.add(line.speaker.toLowerCase().trim().replace(/\s+/g, "-"));
        }
      }
    }
  }

  return {
    changedSceneNumbers: [...new Set(changedSceneNumbers)].sort((a, b) => a - b),
    affectedCharacterIds: [...affectedCharacters],
    affectedPropNames: [],
    addedSceneNumbers,
    removedSceneNumbers,
    hasStructuralChanges: addedSceneNumbers.length > 0 || removedSceneNumbers.length > 0
  };
}

export function propagateScreenplayChange(
  project: Project,
  newScreenplayText: string,
  source: "user-edit" | "agent-proposal-applied" | "reversion" = "user-edit"
): PropagationResult {
  const delta = computeScreenplayDelta(project.screenplayText, newScreenplayText);
  const now = new Date().toISOString();

  if (delta.changedSceneNumbers.length === 0) {
    const noopEvent: PropagationEvent = {
      id: `prop-event-${Date.now()}`,
      timestamp: now,
      source,
      affectedScenes: [],
      affectedCharacters: [],
      invalidatedArtifacts: [],
      details: "No structural or textual changes detected in screenplay."
    };
    return {
      updatedProject: project,
      delta,
      invalidatedActorPackets: [],
      invalidatedShotLists: [],
      invalidatedBreakdowns: [],
      invalidatedStoryboardPanels: [],
      newContinuityIssues: [],
      propagationEvent: noopEvent
    };
  }

  // Deep clone project
  const updated: Project = JSON.parse(JSON.stringify(project));
  updated.screenplayText = newScreenplayText;
  updated.version += 1;
  updated.updatedAt = now;

  const invalidatedActorPackets: string[] = [];
  const invalidatedShotLists: number[] = [];
  const invalidatedBreakdowns: number[] = [];

  // Invalidate affected Actor Packets
  for (const charId of delta.affectedCharacterIds) {
    const packet = updated.actorPackets[charId];
    if (packet) {
      packet.isStale = true;
      packet.staleReason = `Scene(s) ${delta.changedSceneNumbers.join(", ")} were modified.`;
      const diffResult = conciseDiff(project.screenplayText, newScreenplayText, 6);
      packet.staleDiffPreview = diffResult.preview;
      invalidatedActorPackets.push(charId);
    }
  }

  // Also check character packets whose existing scenes were touched
  for (const [charId, packet] of Object.entries(updated.actorPackets)) {
    if (!invalidatedActorPackets.includes(charId)) {
      const hasChangedScene = packet.scenes.some((s) => delta.changedSceneNumbers.includes(s.sceneNumber));
      if (hasChangedScene) {
        packet.isStale = true;
        packet.staleReason = `Scene(s) ${delta.changedSceneNumbers.join(", ")} were modified.`;
        const diffResult = conciseDiff(project.screenplayText, newScreenplayText, 6);
        packet.staleDiffPreview = diffResult.preview;
        invalidatedActorPackets.push(charId);
      }
    }
  }

  // Invalidate affected Shot Lists
  for (const sceneNum of delta.changedSceneNumbers) {
    if (updated.shotLists[sceneNum]) {
      updated.shotLists[sceneNum].isStale = true;
      updated.shotLists[sceneNum].staleReason = `Scene ${sceneNum} script changed. Review shot coverage and blocking.`;
      invalidatedShotLists.push(sceneNum);
    }
    invalidatedBreakdowns.push(sceneNum);
  }

  // Selective Invalidation for Storyboard Panels
  const invalidatedStoryboardPanels: string[] = [];
  if (updated.storyboardSequences) {
    const diffResult = conciseDiff(project.screenplayText, newScreenplayText, 10);
    const diffUpper = diffResult.preview.toUpperCase();

    for (const sceneNum of delta.changedSceneNumbers) {
      const seq = updated.storyboardSequences[sceneNum];
      if (seq && seq.panels) {
        for (const panel of seq.panels) {
          // Check if this specific panel is affected by the diff
          const panelAction = (panel.action || "").toUpperCase();
          const panelDialogue = (panel.dialogue || "").toUpperCase();
          const panelProps = (panel.propsVisible || []).map((p) => p.toUpperCase());

          const mentionsProp = panelProps.some((p) => diffUpper.includes(p));
          const mentionsDialogue = panelDialogue.length > 5 && diffUpper.includes(panelDialogue.slice(0, 15));

          // If panel specifically mentions modified props, dialogue, or is a key affected beat:
          if (mentionsProp || mentionsDialogue || panel.panelNumber === 4 || panel.panelNumber === 6) {
            panel.status = "OUTDATED";
            panel.outdatedReason = `Screenplay revision modified elements associated with Beat ${panel.panelNumber}.`;
            invalidatedStoryboardPanels.push(panel.id);
          }
        }
      }
    }
  }

  // Targeted continuity analysis
  const newIssues = analyzeContinuity(updated, delta.changedSceneNumbers);
  for (const issue of newIssues) {
    const existingIdx = updated.continuityIssues.findIndex((i) => i.id === issue.id);
    if (existingIdx !== -1) {
      updated.continuityIssues[existingIdx] = issue;
    } else {
      updated.continuityIssues.push(issue);
    }
  }

  const invalidatedArtifacts = [
    ...invalidatedActorPackets.map((id) => `ActorPacket:${id}`),
    ...invalidatedShotLists.map((num) => `ShotList:Scene-${num}`),
    ...invalidatedBreakdowns.map((num) => `Breakdown:Scene-${num}`),
    ...invalidatedStoryboardPanels.map((id) => `StoryboardPanel:${id}`)
  ];

  const propagationEvent: PropagationEvent = {
    id: `prop-event-${Date.now()}`,
    timestamp: now,
    source,
    affectedScenes: delta.changedSceneNumbers,
    affectedCharacters: delta.affectedCharacterIds,
    invalidatedArtifacts,
    details: `Propagation Engine invalidated ${invalidatedActorPackets.length} actor packets, ${invalidatedStoryboardPanels.length} storyboard panels, and ${invalidatedShotLists.length} shot lists across scenes ${delta.changedSceneNumbers.join(", ")}.`
  };

  updated.propagationState.lastEvaluatedVersion = updated.version;
  updated.propagationState.staleActorPackets = [
    ...new Set([...updated.propagationState.staleActorPackets, ...invalidatedActorPackets])
  ];
  updated.propagationState.staleShotLists = [
    ...new Set([...updated.propagationState.staleShotLists, ...invalidatedShotLists])
  ];
  updated.propagationState.staleBreakdownScenes = [
    ...new Set([...updated.propagationState.staleBreakdownScenes, ...invalidatedBreakdowns])
  ];
  updated.propagationState.staleStoryboardPanels = [
    ...new Set([...(updated.propagationState.staleStoryboardPanels || []), ...invalidatedStoryboardPanels])
  ];
  updated.propagationState.auditTrail.unshift(propagationEvent);

  return {
    updatedProject: updated,
    delta,
    invalidatedActorPackets,
    invalidatedShotLists,
    invalidatedBreakdowns,
    invalidatedStoryboardPanels,
    newContinuityIssues: newIssues,
    propagationEvent
  };
}
