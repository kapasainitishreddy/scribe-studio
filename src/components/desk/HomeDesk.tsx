import React, { useMemo } from "react";
import { Film, ArrowRight, Plus, FolderOpen, Clock, FileText, Sparkles, ShieldCheck } from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";

interface HomeDeskProps {
  project: Project;
  onContinue: () => void;
  onNewProject: () => void;
  onLoadSample: () => void;
  onOpenJudgeTour?: () => void;
}

export const HomeDesk: React.FC<HomeDeskProps> = ({
  project,
  onContinue,
  onNewProject,
  onLoadSample,
  onOpenJudgeTour
}) => {
  const currentRev = project.revisions[0] || { color: "White", label: "Draft" };
  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#090B0E] text-[#F0F2F5] px-6 select-none overflow-y-auto">
      <div className="max-w-xl w-full py-12 space-y-8">
        {/* Brand & Salutation */}
        <div className="space-y-1 text-left">
          <div className="flex items-center space-x-2.5 text-[#D49B54] mb-3">
            <img src="./logo.svg" alt="Scribe Studio Logo" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-sm tracking-widest uppercase">Scribe Studio</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F0F2F5]">
            {greeting}
          </h1>
          <p className="text-sm text-[#A0A7B2]">
            Select a screenplay or resume your active production desk.
          </p>
        </div>

        {/* Hackathon Judge Interactive Walkthrough Card */}
        {onOpenJudgeTour && (
          <div
            onClick={onOpenJudgeTour}
            className="group relative bg-gradient-to-r from-[#D49B54]/15 via-[#12161D] to-[#12161D] hover:from-[#D49B54]/25 border border-[#D49B54]/50 rounded-xl p-5 transition-all duration-200 cursor-pointer shadow-xl flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D49B54] text-black font-extrabold">
                  Hackathon Evaluation
                </span>
                <span className="text-[10px] font-mono text-[#D49B54]">
                  Google Cloud AI & Parallel Track
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#D49B54] transition-colors">
                ⚡ 1-Click Interactive Judge Walkthrough
              </h3>
              <p className="text-xs text-[#A0A7B2]">
                Explore live AST diffing, Reality Gate citations, Director Veto, and 1-click ZIP export.
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#D49B54]/20 group-hover:bg-[#D49B54] flex items-center justify-center transition-colors shrink-0">
              <ArrowRight className="w-4 h-4 text-[#D49B54] group-hover:text-black transition-colors" />
            </div>
          </div>
        )}


        {/* Primary Continue Project Card */}
        <div
          onClick={onContinue}
          className="group relative bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] hover:border-[#D49B54]/50 rounded-xl p-6 transition-all duration-200 cursor-pointer shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] border border-[#D49B54]/30 font-semibold">
                  Active Project
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#262C36] text-[#A0A7B2]">
                  {currentRev.color} Rev
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white group-hover:text-[#D49B54] transition-colors">
                {project.title}
              </h2>
              <p className="text-xs text-[#A0A7B2] flex items-center space-x-3">
                <span>Feature Film</span>
                <span>•</span>
                <span>{parsed.scenes.length} Production Scenes</span>
                <span>•</span>
                <span>Revised recently</span>
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#1A202C] group-hover:bg-[#D49B54] flex items-center justify-center transition-colors">
              <ArrowRight className="w-5 h-5 text-[#A0A7B2] group-hover:text-black transition-colors" />
            </div>
          </div>
        </div>

        {/* Recent Screenplays */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#69717E] tracking-wider uppercase">
            <span>Recent Screenplays</span>
            <Clock className="w-3.5 h-3.5" />
          </div>

          <div className="space-y-2">
            {[
              { title: "Glass House", pages: "112 pages", updated: "Yesterday" },
              { title: "Red Monsoon", pages: "96 pages", updated: "3 days ago" },
              { title: "The Passenger", pages: "104 pages", updated: "Last week" }
            ].map((recent, i) => (
              <div
                key={i}
                onClick={onContinue}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0D1015] hover:bg-[#12161D] border border-[#1A1F29] hover:border-[#262C36] cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-[#69717E]" />
                  <span className="text-sm font-medium text-[#F0F2F5]">{recent.title}</span>
                  <span className="text-xs text-[#69717E]">{recent.pages}</span>
                </div>
                <span className="text-[11px] text-[#69717E] font-mono">{recent.updated}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desk Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1A1F29]">
          <button
            onClick={onNewProject}
            className="flex items-center space-x-2 text-xs font-medium text-[#A0A7B2] hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4 text-[#D49B54]" />
            <span>New Screenplay</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLoadSample}
              className="text-xs text-[#69717E] hover:text-[#A0A7B2] transition-colors"
            >
              Reset to Demo Script
            </button>
            <button
              onClick={onContinue}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-xs font-medium text-[#F0F2F5] transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Open Desk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
