import React, { useState, useMemo } from "react";
import {
  Clapperboard,
  Film,
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Sliders,
  Play,
  Maximize2,
  RefreshCw,
  Box,
  ShieldCheck,
  TrendingUp,
  Tag
} from "lucide-react";
import type {
  Project,
  StoryboardPanel,
  ShotItem,
  SceneBeat,
  ContinuityIssue
} from "../../packages/project-model/src/types";

interface DirectorModePanelProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onNavigateToTab: (tab: string) => void;
  onUpdatePanel?: (sequenceId: string, panelId: string, updates: Partial<StoryboardPanel>) => void;
}

export const DirectorModePanel: React.FC<DirectorModePanelProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onNavigateToTab,
  onUpdatePanel
}) => {
  const [selectedBeatIndex, setSelectedBeatIndex] = useState<number>(0);

  // Scene Extraction
  const extraction = project.extractions?.[selectedSceneNumber];
  const beats = extraction?.storyBeats || [];

  // Storyboard Sequence
  const sequence = useMemo(() => {
    return Object.values(project.storyboardSequences || {}).find(
      (s) => s.sceneNumber === selectedSceneNumber
    );
  }, [project.storyboardSequences, selectedSceneNumber]);

  // Continuity Issues for this scene
  const sceneContinuityIssues = useMemo(() => {
    return (project.continuityIssues || []).filter(
      (i) => i.affectedScenes.includes(selectedSceneNumber) && i.status === "active"
    );
  }, [project.continuityIssues, selectedSceneNumber]);

  // 3D Objects in this scene
  const scene3DObjects = useMemo(() => {
    return (project.scene3DObjects || []).filter(
      (o) => o.sceneNumber === selectedSceneNumber
    );
  }, [project.scene3DObjects, selectedSceneNumber]);

  // Shot List
  const shotList = project.shotLists?.[selectedSceneNumber];

  // Active Story Threads
  const sceneThreads = useMemo(() => {
    return (project.storyThreads || []).filter((t) =>
      t.scenesInvolved.includes(selectedSceneNumber)
    );
  }, [project.storyThreads, selectedSceneNumber]);

  // Compute Scene Health Metrics
  const sceneHealth = useMemo(() => {
    const totalBeats = beats.length || 6;
    const totalPanels = sequence?.panels.length || 0;
    const outdatedPanels = sequence?.panels.filter((p) => p.status === "OUTDATED").length || 0;
    const coveragePercent = Math.min(100, Math.round((totalPanels / Math.max(1, totalBeats)) * 100));
    const continuityRisk = sceneContinuityIssues.length * 25; // 0 to 100

    return {
      coveragePercent,
      outdatedPanels,
      continuityRisk: Math.min(100, continuityRisk),
      characterCount: extraction?.charactersPresent.length || 2,
      propsCount: extraction?.props.length || 1
    };
  }, [beats, sequence, sceneContinuityIssues, extraction]);

  const activeBeat = beats[selectedBeatIndex] || beats[0];
  const activePanel = sequence?.panels[selectedBeatIndex] || sequence?.panels[0];

  const availableScenes = useMemo(() => {
    const list = Object.keys(project.extractions || {}).map(Number);
    return list.length > 0 ? list.sort((a, b) => a - b) : [1, 2, 3, 4];
  }, [project.extractions]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] text-[#e2e4e9] overflow-hidden select-none">
      {/* Top Header Strip */}
      <div className="h-14 border-b border-[#232730] bg-[#12141c] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-md">
            <Clapperboard className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-emerald-300 uppercase tracking-wider">DIRECTOR CONTROL CONSOLE</span>
          </div>

          <div className="h-4 w-px bg-[#262a35]" />

          {/* Scene Switcher */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium">Scene:</span>
            <div className="flex items-center space-x-1">
              {availableScenes.map((sNum) => (
                <button
                  key={sNum}
                  onClick={() => {
                    onSelectScene(sNum);
                    setSelectedBeatIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    sNum === selectedSceneNumber
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                      : "bg-[#181b24] text-slate-300 hover:bg-[#222736] border border-[#262b3a]"
                  }`}
                >
                  Scene {sNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scene Health Summary Pills */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-[#171b26] border border-[#262c3d] px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Visual Coverage:</span>
            <span className="font-mono font-bold text-emerald-300">{sceneHealth.coveragePercent}%</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#171b26] border border-[#262c3d] px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Continuity Risk:</span>
            <span
              className={`font-mono font-bold ${
                sceneHealth.continuityRisk > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {sceneHealth.continuityRisk === 0 ? "CLEAR (0%)" : `${sceneHealth.continuityRisk}% RISK`}
            </span>
          </div>

          {sceneHealth.outdatedPanels > 0 && (
            <button
              onClick={() => onNavigateToTab("comic")}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center space-x-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{sceneHealth.outdatedPanels} Stale Storyboards</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Director Cockpit Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Column 1: Beat Breakdown & Dramatic Intention (3 cols) */}
        <div className="col-span-12 lg:col-span-4 border-r border-[#222734] bg-[#0e1017] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131722] border-b border-[#222734] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Scene {selectedSceneNumber} Beat Engine
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
              {beats.length} Beats
            </span>
          </div>

          {/* Dramatic Objective Card */}
          <div className="p-3.5 bg-[#141824]/50 border-b border-[#202535] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Dramatic Objective
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {extraction?.sceneObjective || "Extract the encrypted asset and secure exfiltration."}
            </p>
            {extraction?.conflict && (
              <div className="pt-1 text-[11px] text-rose-300/90 font-medium">
                <span className="text-rose-400 font-bold">Conflict: </span>
                {extraction.conflict}
              </div>
            )}
          </div>

          {/* Beats List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {beats.map((beat, idx) => {
              const isSelected = selectedBeatIndex === idx;
              const matchingPanel = sequence?.panels.find((p) => p.beatId === beat.id) || sequence?.panels[idx];
              const isOutdated = matchingPanel?.status === "OUTDATED";

              return (
                <div
                  key={beat.id}
                  onClick={() => setSelectedBeatIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1c2233] border-emerald-500 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30"
                      : "bg-[#131620] border-[#202534] hover:border-[#313a52]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        BEAT {beat.beatNumber}
                      </span>
                      <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                        {beat.emotion}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isOutdated && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1 rounded font-bold">
                          STALE
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {beat.estimatedDurationSec}s
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {beat.action}
                  </p>

                  {beat.dialogue && (
                    <div className="mt-2 text-[11px] text-amber-300/90 italic bg-black/30 p-1.5 rounded border border-amber-500/20">
                      <span className="font-bold not-italic text-amber-400 text-[10px] block">
                        {beat.speaker}:
                      </span>
                      "{beat.dialogue}"
                    </div>
                  )}

                  <div className="mt-2 pt-1.5 border-t border-[#1e2330] flex items-center justify-between text-[10px] text-slate-500">
                    <span>Cast: {beat.characters.join(", ") || "General"}</span>
                    <span className="capitalize">{beat.storySignificance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Storyboard & Visual Composition (5 cols) */}
        <div className="col-span-12 lg:col-span-5 border-r border-[#222734] bg-[#090b0f] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131722] border-b border-[#222734] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Visual Composition & Schematic
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab("comic")}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>Full Comic Studio &rarr;</span>
            </button>
          </div>

          {/* Active Storyboard Frame */}
          <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
            {activePanel ? (
              <div className="space-y-4">
                {/* Visual Canvas */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#272f44] bg-[#06070a] shadow-xl">
                  {activePanel.svgSchematic ? (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: activePanel.svgSchematic }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      Schematic loading...
                    </div>
                  )}

                  {/* Framing Meta Overlay */}
                  <div className="absolute top-2 left-2 flex items-center space-x-2">
                    <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-amber-500/30">
                      SHOT {activePanel.panelNumber}: {activePanel.shotType.toUpperCase()}
                    </span>
                    <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-white/10">
                      {activePanel.cameraAngle}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
                    Lens: {activePanel.lensSuggestion || "35mm Prime"}
                  </div>
                </div>

                {/* Director Subtext & Lighting Intent */}
                <div className="bg-[#121622] border border-[#22283a] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Lighting & Atmosphere Intent
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Axis: 180° Compliant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {activePanel.lightingIntent || "High contrast low-key chiaroscuro with neon rim lighting."}
                  </p>

                  <div className="pt-2 border-t border-[#1c2233]">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Director's Blocking Note
                    </span>
                    <p className="text-xs text-slate-200 italic">
                      "{activePanel.directorNotes || "Focus on emotional tension; track actor eye-lines precisely."}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No panel mapped to this beat.</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: 3D Previs Quick Preview & Continuity Watchdog (3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-[#0c0e14] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131722] border-b border-[#222734] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Box className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Stage & Continuity Watch
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab("scene-3d")}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
            >
              3D Studio &rarr;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* 3D Blocking Snapshot */}
            <div className="bg-[#121622] border border-[#22283a] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Set Elements ({scene3DObjects.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Stage Ready</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {scene3DObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-black/30 text-slate-300"
                  >
                    <span className="font-medium capitalize">{obj.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{obj.kind}</span>
                  </div>
                ))}
                {scene3DObjects.length === 0 && (
                  <div className="text-xs text-slate-500 italic py-2">
                    Standard staging loaded (Maya, Marcus, Camera A).
                  </div>
                )}
              </div>
            </div>

            {/* Active Continuity Alerts */}
            <div className="bg-[#121622] border border-[#22283a] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Continuity Integrity
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    sceneContinuityIssues.length > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {sceneContinuityIssues.length} ISSUES
                </span>
              </div>

              {sceneContinuityIssues.length > 0 ? (
                <div className="space-y-2">
                  {sceneContinuityIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-xs space-y-1"
                    >
                      <div className="font-bold text-rose-300 text-[11px]">
                        {issue.headline}
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-snug">
                        {issue.reason}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No continuity conflicts detected for Scene {selectedSceneNumber}.</span>
                </div>
              )}
            </div>

            {/* Narrative Thread Tracking */}
            <div className="bg-[#121622] border border-[#22283a] rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Story Threads
              </span>
              <div className="space-y-2">
                {sceneThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="p-2 rounded bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 text-[11px]">
                        {thread.title}
                      </span>
                      <span className="text-[9px] font-mono text-indigo-400 uppercase">
                        {thread.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      {thread.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
