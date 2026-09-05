import React, { useState, useMemo } from "react";
import {
  Sparkles,
  LayoutGrid,
  Columns,
  Grid,
  Film,
  Camera,
  CheckCircle2,
  Lock,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  FileDown,
  Layers,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Compass,
  Zap,
  Tag
} from "lucide-react";
import type {
  Project,
  StoryboardSequence,
  StoryboardPanel,
  ShotSize,
  CameraAngle,
  ComicBubbleType
} from "../../packages/project-model/src/types";

interface SceneComicPanelProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onUpdatePanel: (sequenceId: string, panelId: string, updates: Partial<StoryboardPanel>) => void;
  onApprovePanel: (sequenceId: string, panelId: string) => void;
  onLockPanel: (sequenceId: string, panelId: string) => void;
  onRegeneratePanel: (sequenceId: string, panelId: string) => void;
  onRegenerateOutdated: (sequenceId: string) => void;
  onGenerateSceneComic: (sceneNum: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SceneComicPanel: React.FC<SceneComicPanelProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onUpdatePanel,
  onApprovePanel,
  onLockPanel,
  onRegeneratePanel,
  onRegenerateOutdated,
  onGenerateSceneComic,
  onNavigateToTab
}) => {
  // Layout views: 1-panel (Spotlight), 2-panel, 3-panel, 4-panel, 6-panel, contact-sheet, vertical-strip
  const [layoutMode, setLayoutMode] = useState<"1-panel" | "2-panel" | "3-panel" | "4-panel" | "6-panel" | "contact-sheet" | "vertical-strip">("6-panel");
  const [filterStatus, setFilterStatus] = useState<"all" | "outdated" | "approved" | "locked">("all");
  const [showRuleOfThirds, setShowRuleOfThirds] = useState<boolean>(false);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Find sequence for selected scene
  const sequences = project.storyboardSequences || {};
  const currentSequence = useMemo(() => {
    return (
      Object.values(sequences).find((s) => s.sceneNumber === selectedSceneNumber) ||
      Object.values(sequences)[0] ||
      null
    );
  }, [sequences, selectedSceneNumber]);

  // Scene Extraction for context
  const extraction = project.extractions?.[selectedSceneNumber];

  // Panels filtered by status
  const panels = useMemo(() => {
    if (!currentSequence) return [];
    if (filterStatus === "all") return currentSequence.panels;
    return currentSequence.panels.filter((p) => p.status.toLowerCase() === filterStatus.toLowerCase());
  }, [currentSequence, filterStatus]);

  // Stale / Outdated panel count
  const outdatedPanels = useMemo(() => {
    if (!currentSequence) return [];
    return currentSequence.panels.filter((p) => p.status === "OUTDATED");
  }, [currentSequence]);

  const selectedPanel = useMemo(() => {
    if (!currentSequence || !selectedPanelId) return currentSequence?.panels[0] || null;
    return currentSequence.panels.find((p) => p.id === selectedPanelId) || currentSequence.panels[0];
  }, [currentSequence, selectedPanelId]);

  // Scene list from project extractions or parsed scenes
  const availableScenes = useMemo(() => {
    const list: number[] = [];
    if (project.extractions) {
      Object.keys(project.extractions).forEach((k) => list.push(Number(k)));
    }
    if (list.length === 0) return [1, 2, 3, 4];
    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [project.extractions]);

  // Story Threads related to current scene
  const activeThreads = useMemo(() => {
    return (project.storyThreads || []).filter((t) => t.scenesInvolved.includes(selectedSceneNumber));
  }, [project.storyThreads, selectedSceneNumber]);

  const handlePrintExport = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] text-[#e2e4e9] overflow-hidden select-none">
      {/* Top Studio Control Bar */}
      <div className="h-14 border-b border-[#232730] bg-[#12141c] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs text-amber-300 uppercase tracking-wider">SCENE COMIC STUDIO</span>
          </div>

          <div className="h-4 w-px bg-[#262a35]" />

          {/* Scene Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium">Scene:</span>
            <div className="flex items-center space-x-1">
              {availableScenes.map((sNum) => {
                const isSelected = sNum === selectedSceneNumber;
                const seq = Object.values(sequences).find((s) => s.sceneNumber === sNum);
                const hasOutdated = seq?.panels.some((p) => p.status === "OUTDATED");
                return (
                  <button
                    key={sNum}
                    onClick={() => {
                      onSelectScene(sNum);
                      setSelectedPanelId(null);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all relative ${
                      isSelected
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                        : "bg-[#181b24] text-slate-300 hover:bg-[#222736] border border-[#262b3a]"
                    }`}
                  >
                    Scene {sNum}
                    {hasOutdated && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#12141c]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Layout Mode Selector */}
        <div className="flex items-center space-x-1 bg-[#181b25] p-1 rounded-lg border border-[#262a38]">
          {[
            { id: "1-panel", label: "1 (Spotlight)", icon: Columns },
            { id: "2-panel", label: "2-Up", icon: Columns },
            { id: "3-panel", label: "3-Beat", icon: Columns },
            { id: "4-panel", label: "2x2 Grid", icon: LayoutGrid },
            { id: "6-panel", label: "6-Panel Novel", icon: Grid },
            { id: "vertical-strip", label: "Webtoon Strip", icon: Layers },
            { id: "contact-sheet", label: "Contact Sheet", icon: LayoutGrid }
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = layoutMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setLayoutMode(mode.id as any)}
                title={mode.label}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                  isSelected
                    ? "bg-[#2b3142] text-amber-400 shadow-sm border border-[#3b435a]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden lg:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center space-x-2">
          {/* Rule of Thirds Toggle */}
          <button
            onClick={() => setShowRuleOfThirds((prev) => !prev)}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1 border transition-all ${
              showRuleOfThirds
                ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40"
                : "bg-[#181b25] text-slate-400 border-[#262a38] hover:text-slate-200"
            }`}
            title="Toggle Rule of Thirds & Safe Framing Guides"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Grid 3rds</span>
          </button>

          {/* Regenerate Outdated Panels Only (Zero Wasted Compute) */}
          {outdatedPanels.length > 0 && currentSequence && (
            <button
              onClick={() => onRegenerateOutdated(currentSequence.id)}
              className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded text-xs font-bold shadow-md shadow-amber-900/30 flex items-center space-x-1.5 animate-pulse"
              title="Selective Invalidation: Only regenerate affected panels, keeping unchanged panels locked"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>Update {outdatedPanels.length} Stale Panel{outdatedPanels.length > 1 ? "s" : ""}</span>
            </button>
          )}

          {/* Print / Export Contact Sheet */}
          <button
            onClick={handlePrintExport}
            className="px-2.5 py-1 bg-[#1c202c] hover:bg-[#252b3b] border border-[#2f364a] text-slate-200 rounded text-xs font-medium flex items-center space-x-1"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Scene Health & Context Sub-Header */}
      <div className="bg-[#0e1017] border-b border-[#1f232d] px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-200">
            {extraction?.slugline || `SCENE ${selectedSceneNumber}`}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            {extraction?.charactersPresent.join(", ") || "Active Cast"}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {extraction?.storyBeats.length || 6} Story Beats &middot; {currentSequence?.panels.length || 0} Panels
          </span>
        </div>

        {/* Story Threads Pill Indicator */}
        <div className="flex items-center space-x-2">
          {activeThreads.map((thread) => (
            <span
              key={thread.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1"
            >
              <Tag className="w-2.5 h-2.5 text-indigo-400" />
              <span>{thread.title}</span>
            </span>
          ))}

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#141720] px-1.5 py-0.5 rounded border border-[#202532]">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Filter:</span>
            {(["all", "outdated", "approved", "locked"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold transition-all ${
                  filterStatus === st
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Comic Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#090a0d]">
          {!currentSequence || currentSequence.panels.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Film className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-base font-bold text-slate-200">No Visual Script Generated for Scene {selectedSceneNumber}</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                Extract beats and generate a cinematic comic sequence with camera framing, dialogue bubbles, and blocking schematics.
              </p>
              <button
                onClick={() => onGenerateSceneComic(selectedSceneNumber)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-amber-950/40 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Scene Comic Now</span>
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                layoutMode === "1-panel"
                  ? "grid-cols-1 max-w-4xl mx-auto"
                  : layoutMode === "2-panel"
                  ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
                  : layoutMode === "3-panel"
                  ? "grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto"
                  : layoutMode === "4-panel"
                  ? "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto"
                  : layoutMode === "6-panel"
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto"
                  : layoutMode === "contact-sheet"
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                  : "grid-cols-1 max-w-3xl mx-auto space-y-4" // vertical strip
              }`}
            >
              {panels.map((panel) => {
                const isSelected = selectedPanel?.id === panel.id;
                const isOutdated = panel.status === "OUTDATED";
                const isLocked = panel.status === "LOCKED";
                const isApproved = panel.status === "APPROVED";

                return (
                  <div
                    key={panel.id}
                    onClick={() => setSelectedPanelId(panel.id)}
                    className={`group relative rounded-xl bg-[#13161f] border transition-all duration-200 flex flex-col overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500/20 shadow-xl shadow-amber-950/30"
                        : isOutdated
                        ? "border-rose-500/80 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/20"
                        : "border-[#222735] hover:border-[#353d52] shadow-md"
                    }`}
                  >
                    {/* Panel Header Bar */}
                    <div className="bg-[#181c27] px-3 py-1.5 border-b border-[#222735] flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                          #{panel.panelNumber}
                        </span>
                        <span className="font-bold text-slate-200 uppercase tracking-wider">
                          {panel.shotType}
                        </span>
                        <span className="text-slate-500 text-[10px] hidden sm:inline">
                          ({panel.cameraAngle})
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center space-x-1.5">
                        {isOutdated && (
                          <span
                            className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 animate-pulse"
                            title={panel.invalidationReason || "Screenplay modified: Panel details outdated"}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            <span>STALE</span>
                          </span>
                        )}
                        {isLocked && (
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5 text-sky-400" />
                            <span>LOCKED</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>APPROVED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schematic / Concept Frame Canvas Area */}
                    <div className="relative aspect-video w-full bg-[#08090d] overflow-hidden">
                      {/* Render deterministic SVG Schematic */}
                      {panel.svgSchematic ? (
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: panel.svgSchematic }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          Schematic unavailable
                        </div>
                      )}

                      {/* Optional Rule of Thirds Overlay */}
                      {showRuleOfThirds && (
                        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                          <div className="border-r border-b border-cyan-400/25" />
                          <div className="border-r border-b border-cyan-400/25" />
                          <div className="border-b border-cyan-400/25" />
                          <div className="border-r border-b border-cyan-400/25" />
                          <div className="border-r border-b border-cyan-400/25" />
                          <div className="border-b border-cyan-400/25" />
                          <div className="border-r border-cyan-400/25" />
                          <div className="border-r border-cyan-400/25" />
                          <div />
                        </div>
                      )}

                      {/* Outdated Overlay Alert Banner */}
                      {isOutdated && (
                        <div className="absolute top-2 left-2 right-2 bg-rose-950/90 border border-rose-500/60 rounded-md p-2 text-[10px] text-rose-200 shadow-lg backdrop-blur-sm z-10 flex items-start space-x-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold uppercase tracking-wider block text-rose-300">
                              Screenplay Delta Detected
                            </span>
                            <span className="text-[10px] text-rose-200">
                              {panel.invalidationReason || "Scene text was altered. Dialogue or blocking out of sync."}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentSequence) onRegeneratePanel(currentSequence.id, panel.id);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold shrink-0 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      )}

                      {/* Floating Camera & Lens Tag */}
                      <div className="absolute bottom-2 left-2 flex items-center space-x-1.5 z-10">
                        <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
                          {panel.lensSuggestion || "35mm Prime"}
                        </span>
                        {panel.cameraMovement && (
                          <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10 hidden sm:inline">
                            {panel.cameraMovement}
                          </span>
                        )}
                      </div>

                      {/* Color Mood Indicator Strip */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1 opacity-75"
                        style={{ backgroundColor: panel.colorMood || "#f59e0b" }}
                      />
                    </div>

                    {/* Dialogue & Action Body Card */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2 bg-[#13161f]">
                      {/* Action Description */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                        {panel.action}
                      </p>

                      {/* Dialogue Bubble Quote if present */}
                      {panel.dialogue && (
                        <div className="bg-[#1b1f2b] border border-[#2a3144] rounded-lg p-2 relative">
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 mb-0.5">
                            <MessageSquare className="w-3 h-3 text-amber-400" />
                            <span>{panel.dialogueSpeaker || "CHARACTER"}</span>
                            {panel.bubbleType && panel.bubbleType !== "speech" && (
                              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                {panel.bubbleType}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-200 italic line-clamp-2">
                            "{panel.dialogue}"
                          </p>
                        </div>
                      )}

                      {/* Footer Info: Characters & Props */}
                      <div className="pt-2 border-t border-[#1e2330] flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[150px]">
                          Cast: {panel.charactersVisible.join(", ") || "None"}
                        </span>
                        {panel.propsVisible.length > 0 && (
                          <span className="text-slate-400 truncate max-w-[130px] font-mono text-[10px]">
                            Props: {panel.propsVisible.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Quick Actions Strip */}
                    <div className="px-3 py-1.5 bg-[#171b26] border-t border-[#222735] flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSequence) onApprovePanel(currentSequence.id, panel.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isApproved
                              ? "text-emerald-400 bg-emerald-950/40"
                              : "text-slate-400 hover:text-emerald-400 hover:bg-[#202535]"
                          }`}
                          title="Approve Panel"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSequence) onLockPanel(currentSequence.id, panel.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isLocked
                              ? "text-sky-400 bg-sky-950/40"
                              : "text-slate-400 hover:text-sky-400 hover:bg-[#202535]"
                          }`}
                          title="Lock Panel (Protect from automatic screenplay regeneration)"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSequence) onRegeneratePanel(currentSequence.id, panel.id);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#202535] rounded transition-colors"
                          title="Regenerate Schematic & Beat Data"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                        <span>v{panel.version}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Panel Inspector & Fine-Tuning */}
        {selectedPanel && currentSequence && (
          <aside className="w-80 border-l border-[#232730] bg-[#11131a] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Panel #{selectedPanel.panelNumber} Inspector
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  selectedPanel.status === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : selectedPanel.status === "OUTDATED"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {selectedPanel.status}
              </span>
            </div>

            {/* Shot Sizing & Camera Options */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Shot Size
                </label>
                <select
                  value={selectedPanel.shotType}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      shotType: e.target.value as ShotSize
                    })
                  }
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="extreme-wide">Extreme Wide Shot (EWS)</option>
                  <option value="wide">Wide Shot (WS / Master)</option>
                  <option value="establishing">Establishing Shot</option>
                  <option value="medium-wide">Medium Wide (Cowboy)</option>
                  <option value="medium">Medium Shot (MS)</option>
                  <option value="medium-close-up">Medium Close-Up (MCU)</option>
                  <option value="close-up">Close-Up (CU)</option>
                  <option value="extreme-close-up">Extreme Close-Up (ECU)</option>
                  <option value="two-shot">Two-Shot</option>
                  <option value="over-the-shoulder">Over-The-Shoulder (OTS)</option>
                  <option value="point-of-view">Point-Of-View (POV)</option>
                  <option value="insert">Insert / Cutaway</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Camera Angle
                </label>
                <select
                  value={selectedPanel.cameraAngle}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      cameraAngle: e.target.value as CameraAngle
                    })
                  }
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="eye-level">Eye Level</option>
                  <option value="low-angle">Low Angle (Hero / Powerful)</option>
                  <option value="high-angle">High Angle (Vulnerable)</option>
                  <option value="dutch-angle">Dutch Angle (Unease / Tension)</option>
                  <option value="birds-eye">Bird's Eye / Overhead</option>
                  <option value="worms-eye">Worm's Eye</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Lens Suggestion
                </label>
                <input
                  type="text"
                  value={selectedPanel.lensSuggestion || ""}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      lensSuggestion: e.target.value
                    })
                  }
                  placeholder="e.g. 24mm Anamorphic, 50mm Prime"
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Lighting Intent & Mood
                </label>
                <input
                  type="text"
                  value={selectedPanel.lightingIntent || ""}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      lightingIntent: e.target.value
                    })
                  }
                  placeholder="e.g. Low-key chiaroscuro, cold cyan neon"
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Action & Dialogue Editor */}
            <div className="space-y-3 pt-2 border-t border-[#232730]">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Panel Action / Blocking
                </label>
                <textarea
                  rows={3}
                  value={selectedPanel.action}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      action: e.target.value
                    })
                  }
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Dialogue Bubble
                </label>
                <div className="flex items-center space-x-2 mb-1.5">
                  <input
                    type="text"
                    value={selectedPanel.dialogueSpeaker || ""}
                    onChange={(e) =>
                      onUpdatePanel(currentSequence.id, selectedPanel.id, {
                        dialogueSpeaker: e.target.value
                      })
                    }
                    placeholder="Speaker"
                    className="w-1/2 bg-[#181c27] border border-[#272d3e] rounded-lg px-2 py-1 text-xs text-amber-400 font-bold uppercase"
                  />
                  <select
                    value={selectedPanel.bubbleType || "speech"}
                    onChange={(e) =>
                      onUpdatePanel(currentSequence.id, selectedPanel.id, {
                        bubbleType: e.target.value as ComicBubbleType
                      })
                    }
                    className="w-1/2 bg-[#181c27] border border-[#272d3e] rounded-lg px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="speech">Speech Bubble</option>
                    <option value="thought">Thought Bubble</option>
                    <option value="caption">Narrator Caption</option>
                    <option value="shout">Shout / Exclamation</option>
                    <option value="whisper">Whisper</option>
                    <option value="off-screen">Off-Screen (O.S.)</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={selectedPanel.dialogue || ""}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      dialogue: e.target.value
                    })
                  }
                  placeholder="Dialogue text spoken in this beat"
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none italic"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Director's Note
                </label>
                <textarea
                  rows={2}
                  value={selectedPanel.directorNotes || ""}
                  onChange={(e) =>
                    onUpdatePanel(currentSequence.id, selectedPanel.id, {
                      directorNotes: e.target.value
                    })
                  }
                  placeholder="Subtext, blocking instructions, lens axis"
                  className="w-full bg-[#181c27] border border-[#272d3e] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>
            </div>

            {/* Quick Panel Action Buttons */}
            <div className="pt-2 border-t border-[#232730] flex flex-col space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onApprovePanel(currentSequence.id, selectedPanel.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => onLockPanel(currentSequence.id, selectedPanel.id)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Panel</span>
                </button>
              </div>

              <button
                onClick={() => onRegeneratePanel(currentSequence.id, selectedPanel.id)}
                className="w-full px-3 py-1.5 bg-[#1f2433] hover:bg-[#283044] border border-[#323a50] text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Re-Extract from Script</span>
              </button>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab("scene-3d")}
                  className="w-full px-3 py-1.5 bg-[#171b26] hover:bg-[#202536] border border-[#272e42] text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open in 3D Previs Studio &rarr;</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
