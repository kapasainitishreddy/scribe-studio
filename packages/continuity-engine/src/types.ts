import type { ContinuityIssue, PropagationEvent, Project } from "../../project-model/src/types";

export interface ScreenplayDelta {
  changedSceneNumbers: number[];
  affectedCharacterIds: string[];
  affectedPropNames: string[];
  addedSceneNumbers: number[];
  removedSceneNumbers: number[];
  hasStructuralChanges: boolean;
}

export interface PropagationResult {
  updatedProject: Project;
  delta: ScreenplayDelta;
  invalidatedActorPackets: string[];
  invalidatedShotLists: number[];
  invalidatedBreakdowns: number[];
  newContinuityIssues: ContinuityIssue[];
  propagationEvent: PropagationEvent;
}
