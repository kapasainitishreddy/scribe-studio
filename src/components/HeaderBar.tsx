import React from "react";
import {
  Film,
  Sparkles,
  Play,
  Mic,
  FileDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings,
  BookOpen,
  Clapperboard,
  LayoutGrid,
  ShieldCheck,
  Package
} from "lucide-react";
import type { Project, RevisionColor } from "../../packages/project-model/src/types";

interface HeaderBarProps {
  project: Project;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenCommandPalette: () => void;
  onOpenWriterModal: () => void;
  onOpenTableRead: () => void;
  onOpenScribeModal: () => void;
  onOpenExportModal: () => void;
  onLoadSample: () => void;
}

const REVISION_COLORS: Record<RevisionColor, string> = {
  White: "bg-white text-black",
  Blue: "bg-blue-600 text-white",
  Pink: "bg-pink-500 text-white",
  Yellow: "bg-yellow-400 text-black",
  Green: "bg-emerald-600 text-white",
  Goldenrod: "bg-amber-500 text-black",
  Buff: "bg-amber-200 text-black",
  Salmon: "bg-rose-400 text-black",
  Cherry: "bg-red-700 text-white"
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  project,
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
  onOpenWriterModal,
  onOpenTableRead,
  onOpenScribeModal,
  onOpenExportModal,
  onLoadSample
}) => {
  const currentRev = project.revisions[0] || { color: "White" as RevisionColor, label: "Draft" };
  const stalePacketCount = project.propagationState.staleActorPackets.length;
  const continuityIssueCount = project.continuityIssues.filter((i) => i.status === "active").length;

  return (
    <header className="h-14 border-b border-[#232730] bg-[#111318] px-4 flex items-center justify-between select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm tracking-wide text-amber-400">AGENTIC CINEMA</span>
        </div>

        <div className="h-4 w-px bg-[#262a35]" />

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-200">{project.title}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
              REVISION_COLORS[currentRev.color] || "bg-slate-700 text-white"
            }`}
          >
            {currentRev.color} Rev
          </span>
          <span className="text-xs text-slate-400 font-mono">v{project.version}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center space-x-1 bg-[#161922] p-1 rounded-lg border border-[#232730]">
        {[
          { id: "editor", label: "Screenplay", icon: Film },
          { id: "story-bible", label: "Story Bible", icon: BookOpen },
          { id: "actor-packets", label: "Actor Packets", icon: Package, badge: stalePacketCount },
          { id: "continuity", label: "Continuity", icon: ShieldCheck, badge: continuityIssueCount },
          { id: "breakdown", label: "Breakdown", icon: Clapperboard },
          { id: "director", label: "Director", icon: Clapperboard },
          { id: "producer", label: "Producer", icon: Settings },
          { id: "corkboard", label: "Corkboard", icon: LayoutGrid },
          { id: "revisions", label: "Revisions", icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#252a37] text-white shadow-sm border border-[#333a4d]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#1b1f2b]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab.id === "actor-packets"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions & Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#181b24] hover:bg-[#202532] border border-[#272b38] rounded-md text-xs text-slate-300 transition-colors"
          title="Command Palette & Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="text-[10px] bg-[#111318] px-1 rounded text-slate-400 border border-[#2a2f3d]">⌘K</kbd>
        </button>

        <button
          onClick={onOpenWriterModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-md text-xs font-medium shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Writer Agent</span>
        </button>

        <button
          onClick={onOpenTableRead}
          className="flex items-center space-x-1 px-2 py-1.5 bg-[#181b24] hover:bg-[#202532] border border-[#272b38] text-slate-300 rounded-md text-xs transition-colors"
          title="Start Table Read Mode"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Table Read</span>
        </button>

        <button
          onClick={onOpenScribeModal}
          className="flex items-center space-x-1 px-2 py-1.5 bg-[#181b24] hover:bg-[#202532] border border-[#272b38] text-slate-300 rounded-md text-xs transition-colors"
          title="Scribe Meeting / Table Read Notes"
        >
          <Mic className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Scribe</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#181b24] hover:bg-[#202532] border border-[#272b38] text-slate-200 rounded-md text-xs font-medium transition-colors"
          title="Export Formats (PDF, FDX, Sides, Fountain)"
        >
          <FileDown className="w-3.5 h-3.5 text-amber-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onLoadSample}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-[#141720] rounded border border-[#222632]"
          title="Reload Demo Project"
        >
          Reset Demo
        </button>
      </div>
    </header>
  );
};
