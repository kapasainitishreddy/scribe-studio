import React, { useState } from "react";
import { Sparkles, RefreshCw, Check, X, ArrowRight, GitCompare } from "lucide-react";
import type { AgentProposal, Project } from "../../packages/project-model/src/types";
import { generateWriterProposal } from "../../packages/agent-runtime/src/writerAgent";
import { computeDetailedDiff } from "../../packages/screenplay-core/src/diff";

interface WriterAgentModalProps {
  project: Project;
  selectedSceneNumber: number;
  onClose: () => void;
  onAcceptProposal: (proposal: AgentProposal) => void;
}

export const WriterAgentModal: React.FC<WriterAgentModalProps> = ({
  project,
  selectedSceneNumber,
  onClose,
  onAcceptProposal
}) => {
  const [sceneNum, setSceneNum] = useState(selectedSceneNumber || 1);
  const [goal, setGoal] = useState<
    "increase-tension" | "shorten-scene" | "punch-up-dialogue" | "improve-subtext" | "custom"
  >("increase-tension");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<AgentProposal | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateWriterProposal({
        project,
        sceneNumber: sceneNum,
        instruction: goal,
        customPrompt
      });
      setProposal(res);
    } catch (err) {
      console.error("Writer agent proposal failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const diffResult = proposal
    ? computeDetailedDiff(proposal.currentText, proposal.proposedText)
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-[#141620] border border-[#2d3448] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#252b3c] bg-[#11131a] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Writer Agent — Scene Revision Assistant</h2>
              <p className="text-[11px] text-slate-400">
                AI generates structured mutations. Edits never apply without your visual diff review.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {/* Modal Controls */}
        <div className="p-4 bg-[#161824] border-b border-[#252b3c] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <label className="text-slate-400 font-semibold">Target Scene:</label>
            <select
              value={sceneNum}
              onChange={(e) => setSceneNum(parseInt(e.target.value) || 1)}
              className="bg-[#1c202d] border border-[#2d354a] rounded px-2.5 py-1 text-slate-200 outline-none"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  Scene {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-slate-400 font-semibold">Dramatic Objective:</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="bg-[#1c202d] border border-[#2d354a] rounded px-2.5 py-1 text-slate-200 outline-none"
            >
              <option value="increase-tension">Heighten Dramatic Tension</option>
              <option value="shorten-scene">Tighten / Shorten Pacing</option>
              <option value="punch-up-dialogue">Punch Up Character Dialogue</option>
              <option value="improve-subtext">Elevate Subtext & Conflict</option>
              <option value="custom">Custom Instruction</option>
            </select>
          </div>

          {goal === "custom" && (
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Make Marcus more aggressive about the timer"
              className="flex-1 bg-[#1c202d] border border-[#2d354a] rounded px-3 py-1 text-slate-200 outline-none"
            />
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded text-xs font-semibold shadow-sm transition-all ml-auto"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGenerating ? "Analyzing Scene..." : "Generate Proposal"}</span>
          </button>
        </div>

        {/* Diff Review Surface */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
          {proposal ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#11131a] border border-[#252b3c] flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="font-bold text-amber-400">{proposal.task}: </span>
                  <span className="text-slate-300">{proposal.explanation}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="text-emerald-400">+{diffResult?.addedCount || 0} lines</span>
                  <span className="text-rose-400">-{diffResult?.removedCount || 0} lines</span>
                </div>
              </div>

              {/* Side-by-side or line diff */}
              <div className="bg-[#101219] border border-[#252a3a] rounded-xl p-4 divide-y divide-[#1e2230]">
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
                    <span className="w-4 select-none font-bold">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line.text || " "}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs font-sans">
              <Sparkles className="w-12 h-12 text-slate-700 mb-3" />
              <span className="font-semibold text-slate-300">Select an objective and click "Generate Proposal".</span>
              <span className="text-slate-500 mt-1">You will see a side-by-side unified diff before applying changes.</span>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        {proposal && (
          <div className="h-14 border-t border-[#252b3c] bg-[#11131a] px-6 flex items-center justify-between">
            <div className="text-xs text-amber-400/90 font-medium">
              Approving will automatically trigger the Propagation Engine across all downstream artifacts.
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setProposal(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Discard
              </button>
              <button
                onClick={() => onAcceptProposal(proposal)}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Proposal to Script</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
