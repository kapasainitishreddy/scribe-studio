import React, { useState, useMemo } from "react";
import {
  Camera,
  Film,
  Sun,
  Sliders,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Eye,
  Grid,
  Info
} from "lucide-react";
import type {
  Project,
  StoryboardPanel,
  ShotSize,
  CameraAngle
} from "../../packages/project-model/src/types";

interface CinematographerModePanelProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onNavigateToTab: (tab: string) => void;
  onUpdatePanel?: (sequenceId: string, panelId: string, updates: Partial<StoryboardPanel>) => void;
}

export const CinematographerModePanel: React.FC<CinematographerModePanelProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onNavigateToTab,
  onUpdatePanel
}) => {
  const [aspectRatio, setAspectRatio] = useState<"2.39:1" | "1.85:1" | "16:9" | "4:3">("2.39:1");
  const [selectedLens, setSelectedLens] = useState<string>("35mm");

  const sequence = useMemo(() => {
    return Object.values(project.storyboardSequences || {}).find(
      (s) => s.sceneNumber === selectedSceneNumber
    );
  }, [project.storyboardSequences, selectedSceneNumber]);

  const extraction = project.extractions?.[selectedSceneNumber];
  const panels = sequence?.panels || [];

  // Coverage Matrix Analysis (Master, Over-The-Shoulder, Close-Ups, Inserts)
  const coverageAnalysis = useMemo(() => {
    const hasEstablishing = panels.some((p) => p.shotType === "establishing" || p.shotType === "wide");
    const hasMedium = panels.some((p) => p.shotType === "medium" || p.shotType === "medium-wide" || p.shotType === "two-shot");
    const hasCloseUp = panels.some((p) => p.shotType === "close-up" || p.shotType === "medium-close-up" || p.shotType === "extreme-close-up");
    const hasOTS = panels.some((p) => p.shotType === "over-the-shoulder");
    const hasInsert = panels.some((p) => p.shotType === "insert");

    const totalRequired = 5;
    const fulfilled = [hasEstablishing, hasMedium, hasCloseUp, hasOTS, hasInsert].filter(Boolean).length;
    const coverageScore = Math.round((fulfilled / totalRequired) * 100);

    return {
      hasEstablishing,
      hasMedium,
      hasCloseUp,
      hasOTS,
      hasInsert,
      coverageScore,
      gapCount: totalRequired - fulfilled
    };
  }, [panels]);

  const availableScenes = useMemo(() => {
    const list = Object.keys(project.extractions || {}).map(Number);
    return list.length > 0 ? list.sort((a, b) => a - b) : [1, 2, 3, 4];
  }, [project.extractions]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] text-[#e2e4e9] overflow-hidden select-none">
      {/* Header Strip */}
      <div className="h-14 border-b border-[#232730] bg-[#12141c] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md">
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs text-amber-300 uppercase tracking-wider">
              CINEMATOGRAPHER STUDIO (DP LENS)
            </span>
          </div>

          <div className="h-4 w-px bg-[#262a35]" />

          {/* Scene Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium">Scene:</span>
            <div className="flex items-center space-x-1">
              {availableScenes.map((sNum) => (
                <button
                  key={sNum}
                  onClick={() => onSelectScene(sNum)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    sNum === selectedSceneNumber
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "bg-[#181b24] text-slate-300 hover:bg-[#222736] border border-[#262b3a]"
                  }`}
                >
                  Scene {sNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aspect Ratio & Camera Package Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 bg-[#181b25] p-1 rounded-lg border border-[#262a38]">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-1.5">Sensor/Gate:</span>
            {(["2.39:1", "1.85:1", "16:9", "4:3"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                  aspectRatio === ratio
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigateToTab("scene-3d")}
            className="px-3 py-1 bg-[#1c2233] hover:bg-[#252e44] border border-[#2c3750] text-sky-300 rounded text-xs font-semibold flex items-center space-x-1"
          >
            <span>3D Camera Placement &rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left: Shot List & Coverage Analysis (4 cols) */}
        <div className="col-span-12 lg:col-span-4 border-r border-[#222734] bg-[#0d0f16] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131622] border-b border-[#222734] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Coverage Matrix & Lenses
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              {coverageAnalysis.coverageScore}% Complete
            </span>
          </div>

          {/* Coverage Checklist */}
          <div className="p-3.5 bg-[#141824]/50 border-b border-[#202535] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Coverage Checklist</span>
              {coverageAnalysis.gapCount > 0 ? (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                  {coverageAnalysis.gapCount} Coverage Gap{coverageAnalysis.gapCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Full Coverage
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className={`p-1.5 rounded border flex items-center space-x-1.5 ${
                  coverageAnalysis.hasEstablishing
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                }`}
              >
                {coverageAnalysis.hasEstablishing ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>Master / Wide</span>
              </div>

              <div
                className={`p-1.5 rounded border flex items-center space-x-1.5 ${
                  coverageAnalysis.hasMedium
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                }`}
              >
                {coverageAnalysis.hasMedium ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>Medium / 2-Shot</span>
              </div>

              <div
                className={`p-1.5 rounded border flex items-center space-x-1.5 ${
                  coverageAnalysis.hasCloseUp
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                }`}
              >
                {coverageAnalysis.hasCloseUp ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>Close-Ups (CU)</span>
              </div>

              <div
                className={`p-1.5 rounded border flex items-center space-x-1.5 ${
                  coverageAnalysis.hasOTS
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-950/20 border-amber-500/20 text-amber-300"
                }`}
              >
                {coverageAnalysis.hasOTS ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>Reverse OTS</span>
              </div>

              <div
                className={`col-span-2 p-1.5 rounded border flex items-center space-x-1.5 ${
                  coverageAnalysis.hasInsert
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                }`}
              >
                {coverageAnalysis.hasInsert ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span>Insert / Cutaway Shot (High Tech Props)</span>
              </div>
            </div>
          </div>

          {/* Prime Lens Kit Selector */}
          <div className="p-3 bg-[#11141e] border-b border-[#202534] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Prime Lens Package
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {["18mm", "24mm", "35mm", "50mm", "85mm"].map((lens) => (
                <button
                  key={lens}
                  onClick={() => setSelectedLens(lens)}
                  className={`py-1.5 rounded text-center text-xs font-mono font-bold border transition-all ${
                    selectedLens === lens
                      ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                      : "bg-[#181c28] text-slate-300 border-[#262c3e] hover:bg-[#22273a]"
                  }`}
                >
                  {lens}
                </button>
              ))}
            </div>
          </div>

          {/* Planned Lighting & Atmosphere Setup */}
          <div className="p-3 flex-1 overflow-y-auto space-y-3 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Atmosphere & Lighting Plan
            </span>
            <div className="bg-[#141722] border border-[#23293a] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Key Source:</span>
                <span className="text-amber-400 font-mono">Luminescent Terminal Monoliths (5600K Cyan)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Rim / Kicker:</span>
                <span className="text-orange-400 font-mono">Emergency Amber Beacon (3200K)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Contrast Ratio:</span>
                <span className="text-slate-200 font-mono">8:1 (Heavy Chiaroscuro)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Atmosphere Haze:</span>
                <span className="text-slate-200 font-mono">Condensation Mist / Cold Vapor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Storyboard Shots View with Aspect Ratio Framing (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-[#090a0e] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131622] border-b border-[#222734] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Framing & Camera Setups ({panels.length} Setups)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Aspect Ratio: <strong className="text-amber-400">{aspectRatio}</strong>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {panels.map((panel) => (
              <div
                key={panel.id}
                className="bg-[#121520] border border-[#222736] rounded-xl overflow-hidden flex flex-col shadow-lg hover:border-[#353e54] transition-all"
              >
                {/* Panel Header */}
                <div className="bg-[#171b26] px-3 py-1.5 border-b border-[#222736] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                      SETUP #{panel.panelNumber}
                    </span>
                    <span className="font-bold text-slate-200 uppercase text-[11px]">
                      {panel.shotType}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {panel.lensSuggestion || "35mm Prime"} &middot; {panel.cameraAngle}
                  </span>
                </div>

                {/* SVG Schematic Canvas with Aspect Ratio Mask */}
                <div className="relative aspect-video w-full bg-[#05070a] overflow-hidden">
                  {panel.svgSchematic ? (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: panel.svgSchematic }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      Schematic loading...
                    </div>
                  )}

                  {/* Camera Movement Tag */}
                  {panel.cameraMovement && (
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono border border-amber-500/20">
                      Move: {panel.cameraMovement}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 text-xs space-y-1.5 bg-[#121520] flex-1 flex flex-col justify-between">
                  <p className="text-slate-300 text-[11px] line-clamp-2">
                    {panel.action}
                  </p>
                  <div className="pt-2 border-t border-[#1d2230] flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[140px]">
                      Cast: {panel.charactersVisible.join(", ") || "None"}
                    </span>
                    <span className="font-mono text-amber-400/90">
                      {panel.composition}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
