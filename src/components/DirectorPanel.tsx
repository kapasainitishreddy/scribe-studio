import React, { useState } from "react";
import {
  Clapperboard,
  Camera,
  Sparkles,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import type { Project, ShotItem, ShotSize } from "../../packages/project-model/src/types";
import { generateDirectorShotList } from "../../packages/agent-runtime/src/directorAgent";

interface DirectorPanelProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onUpdateShotList: (sceneNum: number, shots: ShotItem[]) => void;
}

export const DirectorPanel: React.FC<DirectorPanelProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onUpdateShotList
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const shotList = project.shotLists[selectedSceneNumber];
  const shots = shotList?.shots || [];

  const handleGenerateCoverage = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateDirectorShotList(project, selectedSceneNumber);
      onUpdateShotList(selectedSceneNumber, generated.shots);
    } catch (e) {
      console.error("Director agent coverage failed:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Top Strip */}
      <div className="h-12 border-b border-[#232730] bg-[#12141c] px-6 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">DIRECTOR AGENT — SHOT PLANNER</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Scene {selectedSceneNumber} Coverage</span>
          {shotList?.isStale && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
              STALE (Script changed)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateCoverage}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate AI Coverage</span>
          </button>
        </div>
      </div>

      {/* Main Shots Canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {shots.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Clapperboard className="w-12 h-12 text-slate-700 mb-3" />
            <span className="font-semibold text-slate-300">No coverage shots generated for Scene {selectedSceneNumber} yet.</span>
            <button
              onClick={handleGenerateCoverage}
              className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Coverage Now</span>
            </button>
          </div>
        ) : (
          shots.map((shot) => (
            <div
              key={shot.id}
              className="bg-[#14161f] border border-[#262b3a] rounded-xl p-5 shadow-lg space-y-3 hover:border-[#353d52] transition-all"
            >
              <div className="flex items-center justify-between border-b border-[#232838] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    SHOT {shot.shotNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1e2332] text-slate-200 text-[11px] uppercase font-bold font-mono">
                    {shot.size}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {shot.lens} • {shot.angle} • {shot.movement}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono uppercase bg-[#181a24] px-2 py-0.5 rounded">
                  {shot.status}
                </span>
              </div>

              <div className="text-xs text-slate-200 font-medium leading-relaxed">
                {shot.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#0f1117] p-3 rounded-lg border border-[#202534]">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Dramatic & Visual Intent
                  </span>
                  <span className="text-slate-300 mt-0.5 block">{shot.visualIntent}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Actor Blocking
                  </span>
                  <span className="text-slate-300 mt-0.5 block">{shot.blockingNotes}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
