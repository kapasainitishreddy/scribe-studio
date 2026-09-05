import React from "react";
import { ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";

interface ChangeIntelligenceBarProps {
  project: Project;
  selectedSceneNumber: number;
  onReviewChanges: () => void;
  isReviewOpen: boolean;
}

export const ChangeIntelligenceBar: React.FC<ChangeIntelligenceBarProps> = ({
  project,
  selectedSceneNumber,
  onReviewChanges,
  isReviewOpen
}) => {
  const stalePanelsCount = project.propagationState.staleStoryboardPanels?.length || 0;
  const stalePacketsCount = project.propagationState.staleActorPackets?.length || 0;
  const activeContinuityIssues = project.continuityIssues.filter((i) => i.status === "active").length;
  const totalAffected = stalePanelsCount + stalePacketsCount + activeContinuityIssues;

  // Counterfactual preview: Count protected / unaffected assets
  const allPanelsCount = Object.values(project.storyboardSequences || {}).reduce(
    (acc, s) => acc + (s.panels?.length || 0),
    0
  );
  const protectedPanelsCount = Math.max(0, allPanelsCount - stalePanelsCount);
  const allCharsCount = Object.keys(project.characters || {}).length;
  const protectedCharsCount = Math.max(0, allCharsCount - stalePacketsCount);
  const protectedCount = protectedPanelsCount + protectedCharsCount;

  const hasChanges = totalAffected > 0;

  return (
    <div className="h-8 border-t border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between text-xs select-none shrink-0 z-10">
      {/* Left Status Info */}
      <div className="flex items-center space-x-3">
        {hasChanges ? (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[#F0F2F5] font-semibold">
              Scene {selectedSceneNumber} AST Modified
            </span>
            <span className="text-[#69717E]">•</span>
            <span className="text-[#D49B54] font-medium">
              Counterfactual Preview:
            </span>
            <span className="text-[#A0A7B2]">
              {totalAffected} downstream {totalAffected === 1 ? "asset requires" : "assets require"} update
            </span>
            <span className="text-[#69717E]">•</span>
            <span className="text-emerald-400/90 font-mono text-[11px]">
              {protectedCount} protected
            </span>
            <span className="hidden lg:inline text-[11px] text-[#69717E]">
              (Stale Shots: {stalePanelsCount}, Stale Sides: {stalePacketsCount}, Continuity: {activeContinuityIssues})
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-[#69717E]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Scene {selectedSceneNumber} · Autosaved · AST graph clean · All departments verified in sync</span>
          </div>
        )}
      </div>

      {/* Right Action Trigger */}
      <div className="flex items-center space-x-2">
        {hasChanges && (
          <button
            onClick={onReviewChanges}
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
              isReviewOpen
                ? "bg-[#D49B54] text-black"
                : "bg-[#171C24] hover:bg-[#202736] text-[#D49B54] border border-[#D49B54]/40"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Review Change Passport</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

