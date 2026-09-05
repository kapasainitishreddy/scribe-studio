import React from "react";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
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
  const totalAffected = stalePanelsCount + stalePacketsCount + (activeContinuityIssues > 0 ? 1 : 0);

  const hasChanges = totalAffected > 0;

  return (
    <div className="h-8 border-t border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between text-xs select-none shrink-0 z-10">
      {/* Left Status Info */}
      <div className="flex items-center space-x-3">
        {hasChanges ? (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[#F0F2F5] font-medium">
              Scene {selectedSceneNumber} changed
            </span>
            <span className="text-[#69717E]">•</span>
            <span className="text-[#A0A7B2]">
              {totalAffected} connected production {totalAffected === 1 ? "item" : "items"} affected
            </span>
            <span className="hidden md:inline text-[11px] text-[#69717E]">
              (Storyboard: {stalePanelsCount}, Continuity: {activeContinuityIssues}, Actor: {stalePacketsCount})
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-[#69717E]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Scene {selectedSceneNumber} · Autosaved · All departments in sync</span>
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
            <span>Review Changes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
