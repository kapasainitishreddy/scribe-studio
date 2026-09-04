import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Sparkles,
  HelpCircle
} from "lucide-react";
import type { ContinuityIssue, ContinuitySeverity, Project } from "../../packages/project-model/src/types";

interface ContinuityPanelProps {
  project: Project;
  onResolveIssue: (issueId: string, action: "dismissed" | "intentional" | "resolved") => void;
  onSelectScene: (sceneNum: number) => void;
}

export const ContinuityPanel: React.FC<ContinuityPanelProps> = ({
  project,
  onResolveIssue,
  onSelectScene
}) => {
  const [filterSeverity, setFilterSeverity] = useState<ContinuitySeverity | "all">("all");
  const [activeTab, setActiveTab] = useState<"active" | "all">("active");

  const issues = project.continuityIssues.filter((i) => {
    if (activeTab === "active" && i.status !== "active") return false;
    if (filterSeverity !== "all" && i.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Top Banner / Filter Toolbar */}
      <div className="h-12 border-b border-[#232730] bg-[#12141c] px-6 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">CONTINUITY SUPERVISOR AGENT</span>
          </div>

          <div className="flex items-center space-x-1 bg-[#181b25] p-0.5 rounded border border-[#262c3d]">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === "active" ? "bg-[#252b3c] text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Active ({project.continuityIssues.filter((i) => i.status === "active").length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === "all" ? "bg-[#252b3c] text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All History ({project.continuityIssues.length})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="bg-[#1c202d] border border-[#2a3144] rounded px-2.5 py-1 text-slate-200 text-xs outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {issues.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-2" />
            <span className="font-semibold text-slate-300">No active continuity discrepancies found.</span>
            <span className="text-slate-400 mt-1">Screenplay scenes, props, and timelines are fully consistent.</span>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className={`bg-[#13151e] border rounded-xl p-5 shadow-lg space-y-3 transition-all ${
                issue.severity === "critical"
                  ? "border-rose-500/40 bg-rose-950/10"
                  : issue.severity === "warning"
                    ? "border-amber-500/40 bg-amber-950/10"
                    : "border-sky-500/40 bg-sky-950/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${
                      issue.severity === "critical"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : issue.severity === "warning"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-400 uppercase bg-[#1a1e2a] px-2 py-0.5 rounded">
                    Category: {issue.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-200">{issue.headline}</h3>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  {issue.affectedScenes.map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => onSelectScene(sNum)}
                      className="px-2 py-0.5 rounded bg-[#1e2332] hover:bg-[#2a3147] text-amber-300 font-mono border border-[#313a52]"
                    >
                      Scene {sNum} ↗
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans">{issue.reason}</div>

              {/* Supporting Evidence */}
              <div className="p-3 bg-[#0d0e14] rounded-lg border border-[#212636] text-[11px] font-mono text-slate-400">
                <span className="text-amber-400 font-bold block mb-1">EVIDENCE:</span>
                <span>{issue.supportingEvidence}</span>
              </div>

              {/* Suggested Resolution & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#222736] text-xs">
                <div className="text-slate-400">
                  <span className="font-semibold text-emerald-400 mr-1">Recommendation:</span>
                  <span>{issue.suggestedResolution}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onResolveIssue(issue.id, "intentional")}
                    className="px-2.5 py-1 bg-[#1a1e2a] hover:bg-[#252b3c] text-slate-400 hover:text-slate-200 rounded border border-[#2d3549] text-[11px]"
                  >
                    Mark Intentional
                  </button>

                  <button
                    onClick={() => onResolveIssue(issue.id, "dismissed")}
                    className="px-2.5 py-1 bg-[#1a1e2a] hover:bg-[#252b3c] text-slate-400 hover:text-slate-200 rounded border border-[#2d3549] text-[11px]"
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() => onResolveIssue(issue.id, "resolved")}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px]"
                  >
                    Resolve Issue
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
