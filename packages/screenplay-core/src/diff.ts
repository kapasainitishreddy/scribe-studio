export interface ConciseDiff {
  added: number;
  removed: number;
  preview: string;
  identical: boolean;
}

export type DiffLineType = "added" | "removed" | "unchanged";

export interface DetailedDiffLine {
  type: DiffLineType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DetailedDiff {
  lines: DetailedDiffLine[];
  addedCount: number;
  removedCount: number;
  identical: boolean;
}

export function conciseDiff(oldText: string, newText: string, previewLines = 10): ConciseDiff {
  if (oldText === newText) {
    return { added: 0, removed: 0, preview: "", identical: true };
  }
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const removed = oldLines.slice(prefix, oldLines.length - suffix);
  const added = newLines.slice(prefix, newLines.length - suffix);

  const preview = [
    ...removed.slice(0, previewLines).map((l) => `- ${l}`),
    ...(removed.length > previewLines ? [`- … ${removed.length - previewLines} more removed lines`] : []),
    ...added.slice(0, previewLines).map((l) => `+ ${l}`),
    ...(added.length > previewLines ? [`+ … ${added.length - previewLines} more added lines`] : [])
  ].join("\n");

  return {
    added: added.length,
    removed: removed.length,
    preview,
    identical: false
  };
}

/**
 * Computes a side-by-side or inline line-level diff for visual display in Writer Agent & Revision diffs.
 */
export function computeDetailedDiff(oldText: string, newText: string): DetailedDiff {
  if (oldText === newText) {
    const lines = oldText.split(/\r?\n/).map((t, idx) => ({
      type: "unchanged" as const,
      text: t,
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1
    }));
    return { lines, addedCount: 0, removedCount: 0, identical: true };
  }

  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const diffLines: DetailedDiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let addedCount = 0;
  let removedCount = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
      diffLines.push({
        type: "unchanged",
        text: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1
      });
      oldIdx += 1;
      newIdx += 1;
    } else {
      // Lookahead matching
      let matchOld = -1;
      let matchNew = -1;
      for (let d = 1; d <= 8; d += 1) {
        if (newIdx + d < newLines.length && oldIdx < oldLines.length && oldLines[oldIdx] === newLines[newIdx + d]) {
          matchNew = newIdx + d;
          break;
        }
        if (oldIdx + d < oldLines.length && newIdx < newLines.length && oldLines[oldIdx + d] === newLines[newIdx]) {
          matchOld = oldIdx + d;
          break;
        }
      }

      if (matchNew !== -1) {
        while (newIdx < matchNew) {
          diffLines.push({
            type: "added",
            text: newLines[newIdx],
            newLineNumber: newIdx + 1
          });
          addedCount += 1;
          newIdx += 1;
        }
      } else if (matchOld !== -1) {
        while (oldIdx < matchOld) {
          diffLines.push({
            type: "removed",
            text: oldLines[oldIdx],
            oldLineNumber: oldIdx + 1
          });
          removedCount += 1;
          oldIdx += 1;
        }
      } else {
        if (oldIdx < oldLines.length) {
          diffLines.push({
            type: "removed",
            text: oldLines[oldIdx],
            oldLineNumber: oldIdx + 1
          });
          removedCount += 1;
          oldIdx += 1;
        }
        if (newIdx < newLines.length) {
          diffLines.push({
            type: "added",
            text: newLines[newIdx],
            newLineNumber: newIdx + 1
          });
          addedCount += 1;
          newIdx += 1;
        }
      }
    }
  }

  return {
    lines: diffLines,
    addedCount,
    removedCount,
    identical: false
  };
}
