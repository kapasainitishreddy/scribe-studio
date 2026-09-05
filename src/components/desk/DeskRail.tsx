import React from "react";
import {
  PenLine,
  Film,
  Play,
  Layers,
  Search,
  Settings,
  Sliders
} from "lucide-react";

export type DeskMode = "home" | "write" | "visualize" | "perform" | "produce";

interface DeskRailProps {
  currentMode: DeskMode;
  onSelectMode: (mode: DeskMode) => void;
  onOpenCommandPalette: () => void;
  onOpenDiagnostics: () => void;
  hasStaleProductionChanges: boolean;
}

export const DeskRail: React.FC<DeskRailProps> = ({
  currentMode,
  onSelectMode,
  onOpenCommandPalette,
  onOpenDiagnostics,
  hasStaleProductionChanges
}) => {
  const modes: { id: DeskMode; label: string; icon: React.FC<{ className?: string }>; glyph: string }[] = [
    { id: "write", label: "Write", icon: PenLine, glyph: "✎" },
    { id: "visualize", label: "Visualize", icon: Film, glyph: "▣" },
    { id: "perform", label: "Perform", icon: Play, glyph: "▶" },
    { id: "produce", label: "Produce", icon: Layers, glyph: "◫" }
  ];

  return (
    <aside className="w-13 border-r border-[#262C36] bg-[#0D1015] flex flex-col items-center py-3 select-none justify-between shrink-0 z-10">
      {/* Top Section: Primary Modes */}
      <div className="flex flex-col items-center space-y-3 w-full">
        {/* Home Button */}
        <button
          onClick={() => onSelectMode("home")}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            currentMode === "home"
              ? "bg-[#D49B54] text-black font-bold shadow-md shadow-[#D49B54]/20"
              : "text-[#A0A7B2] hover:text-white hover:bg-[#171C24]"
          }`}
          title="Production Desk Home"
        >
          <span className="font-mono font-bold text-sm">S</span>
        </button>

        <div className="w-6 h-px bg-[#262C36]" />

        {/* 4 Primary Workspaces */}
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`relative group w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#171C24] text-[#D49B54] border border-[#D49B54]/40 font-semibold"
                  : "text-[#69717E] hover:text-[#F0F2F5] hover:bg-[#12161D]"
              }`}
              title={`${mode.label} Mode`}
            >
              <Icon className="w-4 h-4" />

              {/* Indicator Pip if stale changes exist */}
              {mode.id === "produce" && hasStaleProductionChanges && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              )}

              {/* Tooltip on hover */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#171C24] text-[#F0F2F5] text-xs rounded border border-[#262C36] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Section: Infrequent Actions & Diagnostics */}
      <div className="flex flex-col items-center space-y-2 w-full">
        {/* Quick Search */}
        <button
          onClick={onOpenCommandPalette}
          className="group relative w-9 h-9 rounded-lg flex items-center justify-center text-[#69717E] hover:text-[#F0F2F5] hover:bg-[#12161D] transition-all"
          title="Search & Command Palette (⌘K)"
        >
          <Search className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-[#171C24] text-[#F0F2F5] text-xs rounded border border-[#262C36] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
            Search (⌘K)
          </span>
        </button>

        {/* Developer Diagnostics & Telemetry */}
        <button
          onClick={onOpenDiagnostics}
          className="group relative w-9 h-9 rounded-lg flex items-center justify-center text-[#69717E] hover:text-[#D49B54] hover:bg-[#12161D] transition-all"
          title="Developer Diagnostics & Compliance"
        >
          <Settings className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-[#171C24] text-[#F0F2F5] text-xs rounded border border-[#262C36] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
            Developer Diagnostics
          </span>
        </button>
      </div>
    </aside>
  );
};
