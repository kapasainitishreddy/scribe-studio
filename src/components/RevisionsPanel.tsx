import React, { useState } from "react";
import { History, Plus, RotateCcw, GitCompare, CheckCircle2, Shield } from "lucide-react";
import type { Project, RevisionColor, RevisionRecord } from "../../packages/project-model/src/types";
import { computeDetailedDiff } from "../../packages/screenplay-core/src/diff";

interface RevisionsPanelProps {
  project: Project;
  onCreateRevision: (color: RevisionColor, label: string, summary: string) => void;
  onRestoreRevision: (revisionId: string) => void;
}

const REVISION_COLORS: RevisionColor[] = [
  "White",
  "Blue",
  "Pink",
  "Yellow",
  "Green",
  "Goldenrod",
  "Buff",
  "Salmon",
  "Cherry"
];

const COLOR_CLASSES: Record<RevisionColor, string> = {
  White: "bg-white text-black border-slate-300",
  Blue: "bg-blue-600 text-white border-blue-400",
  Pink: "bg-pink-500 text-white border-pink-400",
  Yellow: "bg-yellow-400 text-black border-yellow-500",
  Green: "bg-emerald-600 text-white border-emerald-400",
  Goldenrod: "bg-amber-500 text-black border-amber-600",
  Buff: "bg-amber-200 text-black border-amber-300",
  Salmon: "bg-rose-400 text-black border-rose-500",
  Cherry: "bg-red-700 text-white border-red-500"
};

export const RevisionsPanel: React.FC<RevisionsPanelProps> = ({
  project,
  onCreateRevision,
  onRestoreRevision
}) => {
  const [selectedRevId, setSelectedRevId] = useState<string>(
    project.revisions[0]?.id || ""
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newColor, setNewColor] = useState<RevisionColor>("Pink");
  const [newLabel, setNewLabel] = useState("");
  const [newSummary, setNewSummary] = useState("");

  const selectedRev = project.revisions.find((r) => r.id === selectedRevId) || project.revisions[0];

  const diffResult = selectedRev
    ? computeDetailedDiff(selectedRev.screenplayText, project.screenplayText)
    : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onCreateRevision(newColor, newLabel.trim(), newSummary.trim());
    setNewLabel("");
    setNewSummary("");
    setIsCreateOpen(false);
  };

  return (
    <div className="flex-1 flex h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Left Revision Stack */}
      <aside className="w-80 border-r border-[#232730] bg-[#111319] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#232730] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">REVISION HISTORY</span>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
          >
            <Plus className="w-3 h-3" />
            <span>New Rev</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {project.revisions.map((rev) => {
            const isSelected = selectedRev?.id === rev.id;
            return (
              <button
                key={rev.id}
                onClick={() => setSelectedRevId(rev.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-[#1c202d] border-amber-500/50 shadow-lg"
                    : "bg-[#141620] border-[#252a3a] text-slate-400 hover:bg-[#181b26]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono ${
                      COLOR_CLASSES[rev.color]
                    }`}
                  >
                    {rev.color} DRAFT
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-200 mt-2">{rev.label}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{rev.summaryOfChanges}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Diff & Comparison Surface */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0d0e14]">
        {selectedRev ? (
          <>
            <div className="h-14 border-b border-[#232730] bg-[#12141c] px-6 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <GitCompare className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200">
                  Comparing {selectedRev.color} Draft with Current Active Script
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-mono">+{diffResult?.addedCount || 0} lines</span>
                <span className="text-rose-400 font-mono">-{diffResult?.removedCount || 0} lines</span>
              </div>

              <button
                onClick={() => onRestoreRevision(selectedRev.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1e2330] hover:bg-[#282f42] text-slate-300 hover:text-white rounded border border-[#2f374c] text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restore This Revision</span>
              </button>
            </div>

            {/* Visual Line Diff Output */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
              <div className="bg-[#12141c] border border-[#252a3a] rounded-xl p-4 divide-y divide-[#1e2230]">
                {diffResult?.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`py-1 px-3 flex items-start space-x-4 ${
                      line.type === "added"
                        ? "bg-emerald-950/20 text-emerald-300"
                        : line.type === "removed"
                          ? "bg-rose-950/20 text-rose-300 line-through opacity-80"
                          : "text-slate-300"
                    }`}
                  >
                    <span className="w-8 text-slate-600 select-none text-[10px] text-right font-mono">
                      {line.newLineNumber || line.oldLineNumber}
                    </span>
                    <span className="w-4 select-none font-bold">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line.text || " "}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            No revision selected.
          </div>
        )}
      </main>

      {/* Create Revision Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#151720] border border-[#2d3447] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-200">Freeze New Revision Snapshot</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Industry Color Sequence
              </label>
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value as RevisionColor)}
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                {REVISION_COLORS.map((col) => (
                  <option key={col} value={col}>
                    {col} Draft
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Revision Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Director Punch-Up Draft"
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Summary of Changes
              </label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={3}
                placeholder="Key scenes modified or major beats altered..."
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded p-3 text-xs text-slate-200 outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#262c3d]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
              >
                Freeze Revision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
