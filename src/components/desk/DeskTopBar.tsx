import React, { useState } from "react";
import { Film, Command, FileDown, Home, Volume2, VolumeX } from "lucide-react";
import type { Project, RevisionColor } from "../../../packages/project-model/src/types";
import { cinemaAudio } from "../../utils/cinemaAudio";

interface DeskTopBarProps {
  project: Project;
  currentMode: "home" | "write" | "visualize" | "perform" | "produce";
  selectedSceneNumber: number;
  totalScenes: number;
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  onToggleHome: () => void;
  onOpenJudgeTour?: () => void;
}


const REVISION_COLORS: Record<RevisionColor, string> = {
  White: "bg-slate-200 text-black",
  Blue: "bg-blue-600 text-white",
  Pink: "bg-pink-500 text-white",
  Yellow: "bg-amber-400 text-black",
  Green: "bg-emerald-600 text-white",
  Goldenrod: "bg-amber-500 text-black",
  Buff: "bg-amber-200 text-black",
  Salmon: "bg-rose-400 text-black",
  Cherry: "bg-red-700 text-white"
};

export const DeskTopBar: React.FC<DeskTopBarProps> = ({
  project,
  currentMode,
  selectedSceneNumber,
  totalScenes,
  onOpenCommandPalette,
  onOpenExportModal,
  onToggleHome,
  onOpenJudgeTour
}) => {
  const currentRev = project.revisions[0] || { color: "White" as RevisionColor, label: "Draft" };
  const [isMuted, setIsMuted] = useState(cinemaAudio.getIsMuted());

  return (
    <header className="h-11 border-b border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between select-none shrink-0 z-10">
      {/* Left Group: Logo & Project Identity */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleHome}
          className="flex items-center space-x-2 text-[#D49B54] hover:text-[#E3AF69] transition-colors focus:outline-none"
          title="Return to Desk Home"
        >
          <img src="./logo.svg" alt="Scribe Studio" className="w-6 h-6 object-contain" />
        </button>

        <span className="text-xs font-semibold text-[#F0F2F5] tracking-wide uppercase">
          {project.title}
        </span>

        <div className="h-3 w-px bg-[#262C36]" />

        {currentMode !== "home" && (
          <div className="flex items-center space-x-2 text-xs text-[#A0A7B2]">
            <span className="font-mono text-[11px] text-[#A0A7B2]">
              Scene {selectedSceneNumber} <span className="text-[#69717E]">/</span> {totalScenes || 1}
            </span>
          </div>
        )}

        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
            REVISION_COLORS[currentRev.color] || "bg-slate-700 text-white"
          }`}
        >
          {currentRev.color} Rev
        </span>
      </div>

      {/* Center Group: Mode Badge */}
      <div className="hidden md:flex items-center space-x-1">
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#69717E]">
          Mode:
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D49B54]">
          {currentMode}
        </span>
      </div>

      {/* Right Group: Judge Walkthrough, Command Palette & Export */}
      <div className="flex items-center space-x-2">
        {/* Judge Walkthrough Trigger */}
        {onOpenJudgeTour && (
          <button
            onClick={onOpenJudgeTour}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#D49B54]/15 hover:bg-[#D49B54]/25 border border-[#D49B54]/40 text-xs font-semibold text-[#D49B54] transition-all cursor-pointer shadow-sm animate-pulse hover:animate-none"
            title="Start 1-Click Interactive Hackathon Walkthrough"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D49B54]" />
            <span>Judge Walkthrough</span>
          </button>
        )}

        {/* Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-xs text-[#A0A7B2] hover:text-[#F0F2F5] transition-colors cursor-pointer"
          title="Open Command Palette (⌘K or Ctrl+K)"
        >
          <Command className="w-3 h-3 text-[#69717E]" />
          <span className="font-mono text-[10px]">⌘K</span>
        </button>

        {/* Cinema Soundscapes Audio Toggle */}
        <button
          onClick={() => {
            const muted = cinemaAudio.toggleMute();
            setIsMuted(muted);
            if (!muted) cinemaAudio.playCameraShutter();
          }}
          className={`p-1.5 rounded border transition-all cursor-pointer ${
            isMuted
              ? "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-white"
              : "bg-[#D49B54]/15 border-[#D49B54]/40 text-[#D49B54]"
          }`}
          title={isMuted ? "Enable Cinema Audio (Camera Shutter & Soundscapes)" : "Mute Cinema Audio"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Export Modal Trigger */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#171C24] hover:bg-[#1F2532] border border-[#262C36] text-xs font-medium text-[#F0F2F5] hover:border-[#D49B54]/40 transition-colors cursor-pointer"
          title="Export Screenplay, Sides, or Production Sheets"
        >
          <FileDown className="w-3.5 h-3.5 text-[#D49B54]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

