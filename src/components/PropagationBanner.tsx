import React, { useState } from "react";
import { AlertTriangle, RefreshCw, ChevronRight, X, ShieldAlert } from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";

interface PropagationBannerProps {
  project: Project;
  onRegenerateAll: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const PropagationBanner: React.FC<PropagationBannerProps> = ({
  project,
  onRegenerateAll,
  onNavigateToTab
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const stalePackets = project.propagationState.staleActorPackets;
  const staleShots = project.propagationState.staleShotLists;
  const latestEvent = project.propagationState.auditTrail[0];

  const hasStale = stalePackets.length > 0 || staleShots.length > 0;

  if (!hasStale || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between transition-all">
      <div className="flex items-center space-x-3">
        <div className="p-1 bg-amber-500/20 rounded border border-amber-500/40 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-amber-300">Propagation Alert: </span>
          <span>
            Screenplay edits affected Scene(s) {latestEvent?.affectedScenes.join(", ") || "modified"}.
          </span>
          <span className="ml-2 opacity-90">
            {stalePackets.length > 0 && `${stalePackets.length} Actor Packet(s) marked stale.`}
            {staleShots.length > 0 && ` ${staleShots.length} Shot List(s) flagged.`}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {stalePackets.length > 0 && (
          <button
            onClick={onRegenerateAll}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 font-medium rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Regenerate Affected Packets</span>
          </button>
        )}

        <button
          onClick={() => onNavigateToTab("actor-packets")}
          className="flex items-center space-x-0.5 px-2 py-1 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded border border-slate-700"
        >
          <span>Review Packets</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          onClick={() => onNavigateToTab("continuity")}
          className="flex items-center space-x-1 px-2 py-1 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded border border-slate-700"
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>Continuity</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-200"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
