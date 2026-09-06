import React, { useState, useMemo } from "react";
import {
  Film,
  Camera,
  Grid,
  Crosshair,
  Square,
  Eye,
  GitCommit,
  Plus,
  Box,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Sliders,
  Play
} from "lucide-react";
import type { Project, StoryboardPanel } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { generatePanelSvgSchematic } from "../../../packages/production-engine/src/storyboardGenerator";
import { Scene3DStudio } from "../Scene3DStudio";
import { AnimaticScreeningModal } from "./AnimaticScreeningModal";

interface VisualizeWorkspaceProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  selectedShotId: string | null;
  onSelectShot: (shot: StoryboardPanel) => void;
  onUpdatePanel?: (panel: StoryboardPanel) => void;
  onAddShot?: () => void;
  onAddScene3DObject: (obj: any) => void;
  onUpdateScene3DObject: (id: string, updates: any) => void;
  onDeleteScene3DObject: (id: string) => void;
}

export const VisualizeWorkspace: React.FC<VisualizeWorkspaceProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  selectedShotId,
  onSelectShot,
  onUpdatePanel,
  onAddShot,
  onAddScene3DObject,
  onUpdateScene3DObject,
  onDeleteScene3DObject
}) => {
  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const activeScene = parsed.scenes.find((s) => s.number === selectedSceneNumber) || parsed.scenes[0];

  // Viewport mode: 2D Schematic / 3D Previs
  const [viewportMode, setViewportMode] = useState<"schematic" | "previs_3d">("schematic");
  const [isAnimaticOpen, setIsAnimaticOpen] = useState(false);

  // In-Viewer Overlays
  const [showThirds, setShowThirds] = useState(true);
  const [showCenter, setShowCenter] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [showEyeline, setShowEyeline] = useState(false);
  const [showAxis180, setShowAxis180] = useState(false);

  // Aspect Ratio: 2.39:1 Anamorphic Cinema Standard
  const [aspectRatio, setAspectRatio] = useState<"2.39" | "1.85" | "16:9">("2.39");

  // Get storyboard shots for this scene
  const sceneSequence = project.storyboardSequences?.[selectedSceneNumber];
  const shots: StoryboardPanel[] = useMemo(() => {
    if (sceneSequence && sceneSequence.panels.length > 0) {
      return sceneSequence.panels;
    }
    // Fallback default shots
    return [
      {
        id: `p-${selectedSceneNumber}-1`,
        sequenceId: `seq-${selectedSceneNumber}`,
        sceneNumber: selectedSceneNumber,
        beatId: `b-${selectedSceneNumber}-1`,
        panelNumber: 1,
        shotType: "wide",
        cameraAngle: "low-angle",
        lensSuggestion: "24mm",
        cameraMovement: "Slow Dolly In",
        composition: "Silhouettes against city neon lights.",
        charactersVisible: ["Maya", "Arjun"],
        action: `Wide Establishing — ${activeScene?.location || "Rooftop"} at night with rain.`,
        dialogue: "",
        location: activeScene?.location || "Rooftop",
        propsVisible: ["Silver Locket", "Revolver"],
        lightingIntent: "Cyan rain backlight",
        mood: "tense",
        continuityReferences: [],
        directorNotes: "Wide master establishing mood",
        generationPrompt: "Cinematic film still, wide shot",
        version: 1,
        status: "APPROVED",
        sourceLineIds: []
      },
      {
        id: `p-${selectedSceneNumber}-2`,
        sequenceId: `seq-${selectedSceneNumber}`,
        sceneNumber: selectedSceneNumber,
        beatId: `b-${selectedSceneNumber}-2`,
        panelNumber: 2,
        shotType: "close-up",
        cameraAngle: "eye-level",
        lensSuggestion: "50mm",
        cameraMovement: "Static",
        composition: "Rule of thirds, eyeline on upper grid line.",
        charactersVisible: ["Maya"],
        action: "Close Up — Maya looks down at the silver locket.",
        dialogue: "I thought you'd forgotten me.",
        dialogueSpeaker: "MAYA",
        location: activeScene?.location || "Rooftop",
        propsVisible: ["Silver Locket"],
        lightingIntent: "Soft key on eyes",
        mood: "vulnerable",
        continuityReferences: [],
        directorNotes: "Emotional anchor shot",
        generationPrompt: "Cinematic portrait, close up",
        version: 1,
        status: "APPROVED",
        sourceLineIds: []
      },
      {
        id: `p-${selectedSceneNumber}-3`,
        sequenceId: `seq-${selectedSceneNumber}`,
        sceneNumber: selectedSceneNumber,
        beatId: `b-${selectedSceneNumber}-3`,
        panelNumber: 3,
        shotType: "insert",
        cameraAngle: "high-angle",
        lensSuggestion: "85mm",
        cameraMovement: "Tilt Down",
        composition: "Shallow depth of field, rain droplets gleaming.",
        charactersVisible: [],
        action: "Macro Insert — The revolver lies wet against concrete.",
        dialogue: "",
        location: activeScene?.location || "Rooftop",
        propsVisible: ["Revolver"],
        lightingIntent: "Gleam on gun metal",
        mood: "ominous",
        continuityReferences: [],
        directorNotes: "Weapon focus insert",
        generationPrompt: "Macro cinematography insert of weapon",
        version: 1,
        status: "OUTDATED",
        sourceLineIds: []
      }
    ];
  }, [sceneSequence, selectedSceneNumber, activeScene]);

  const activeShot = shots.find((s) => s.id === selectedShotId) || shots[0];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none">
      {/* ============================================================ */}
      {/* LEFT SECOND RAIL: SCENES LIST                                */}
      {/* ============================================================ */}
      <nav aria-label="Visualize Scenes" className="w-52 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
        <div className="p-2.5 border-b border-[#262C36] bg-[#12161D] flex items-center justify-between text-xs font-semibold text-[#A0A7B2]">
          <span>SCENES</span>
          <span className="font-mono text-[10px] text-[#69717E]">{parsed.scenes.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
          {parsed.scenes.map((s) => {
            const isSelected = selectedSceneNumber === s.number;
            const hasStale = project.storyboardSequences?.[s.number]?.panels?.some((p) => p.status === "OUTDATED");
            return (
              <button
                key={s.id}
                onClick={() => onSelectScene(s.number)}
                className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5]"
                    : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
                }`}
              >
                <div className="truncate">
                  <span className="font-mono font-bold text-[10px] text-[#D49B54] mr-1.5">
                    {s.number}
                  </span>
                  <span className="truncate font-medium">{s.location}</span>
                </div>
                {hasStale && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" title="Stale shots in scene" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============================================================ */}
      {/* CENTER: CINEMA VIEWPORT & SHOT TIMELINE                      */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Viewport Top Bar & In-Viewer Tool Overlays */}
        <div className="h-9 border-b border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between shrink-0">
          {/* In-Viewer Tool Overlays */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[10px] font-mono text-[#69717E] uppercase mr-2">Overlays:</span>

            <button
              onClick={() => setShowThirds(!showThirds)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                showThirds
                  ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54]"
                  : "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-[#A0A7B2]"
              }`}
              title="Toggle Rule of Thirds Grid"
            >
              <Grid className="w-3 h-3" />
              <span>Thirds</span>
            </button>

            <button
              onClick={() => setShowCenter(!showCenter)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                showCenter
                  ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54]"
                  : "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-[#A0A7B2]"
              }`}
              title="Toggle Center Crosshair"
            >
              <Crosshair className="w-3 h-3" />
              <span>Center</span>
            </button>

            <button
              onClick={() => setShowSafeArea(!showSafeArea)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                showSafeArea
                  ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54]"
                  : "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-[#A0A7B2]"
              }`}
              title="Toggle Action & Title Safe Area"
            >
              <Square className="w-3 h-3" />
              <span>Safe Area</span>
            </button>

            <button
              onClick={() => setShowEyeline(!showEyeline)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                showEyeline
                  ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54]"
                  : "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-[#A0A7B2]"
              }`}
              title="Toggle Eyeline Guide"
            >
              <Eye className="w-3 h-3" />
              <span>Eyeline</span>
            </button>

            <button
              onClick={() => setShowAxis180(!showAxis180)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                showAxis180
                  ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54]"
                  : "bg-[#12161D] border-[#262C36] text-[#69717E] hover:text-[#A0A7B2]"
              }`}
              title="Toggle 180° Action Axis"
            >
              <GitCommit className="w-3 h-3" />
              <span>180° Axis</span>
            </button>
          </div>

          {/* Right Controls: Viewport Engine & Aspect Ratio */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Aspect Ratio Selector */}
            <div className="flex items-center space-x-1 bg-[#12161D] px-2 py-0.5 rounded border border-[#262C36] font-mono text-[10px]">
              <span className="text-[#69717E]">Matte:</span>
              <button
                onClick={() => setAspectRatio("2.39")}
                className={`px-1 rounded ${aspectRatio === "2.39" ? "text-[#D49B54] font-bold" : "text-[#A0A7B2]"}`}
              >
                2.39:1
              </button>
              <button
                onClick={() => setAspectRatio("1.85")}
                className={`px-1 rounded ${aspectRatio === "1.85" ? "text-[#D49B54] font-bold" : "text-[#A0A7B2]"}`}
              >
                1.85:1
              </button>
              <button
                onClick={() => setAspectRatio("16:9")}
                className={`px-1 rounded ${aspectRatio === "16:9" ? "text-[#D49B54] font-bold" : "text-[#A0A7B2]"}`}
              >
                16:9
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-[#12161D] p-0.5 rounded border border-[#262C36]">
              <button
                onClick={() => setViewportMode("schematic")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  viewportMode === "schematic"
                    ? "bg-[#171C24] text-[#D49B54] font-bold"
                    : "text-[#69717E] hover:text-[#A0A7B2]"
                }`}
              >
                Schematic
              </button>
              <button
                onClick={() => setViewportMode("previs_3d")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  viewportMode === "previs_3d"
                    ? "bg-[#171C24] text-[#D49B54] font-bold"
                    : "text-[#69717E] hover:text-[#A0A7B2]"
                }`}
              >
                3D Previs
              </button>
            </div>

            {/* Cinematic Animatic Screening Room Button */}
            <button
              onClick={() => setIsAnimaticOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#D49B54] hover:bg-[#E3AF69] text-black font-extrabold text-[11px] tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
              title="Screen scene storyboard as 2.39:1 Anamorphic animatic"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Screen Animatic</span>
            </button>
          </div>
        </div>

        {/* Viewport Canvas Surface */}
        <div className={`flex-1 ${viewportMode === "previs_3d" ? "flex flex-col p-2 min-h-0 self-stretch" : "flex items-center justify-center p-6"} bg-[#090B0E] relative overflow-hidden`}>
          {viewportMode === "previs_3d" ? (
            <div className="w-full h-full min-h-0 flex-1 flex flex-col rounded-lg overflow-hidden border border-[#262C36]">
              <Scene3DStudio
                project={project}
                selectedSceneNumber={selectedSceneNumber}
                onSelectScene={onSelectScene}
                onAddObject={onAddScene3DObject}
                onUpdateObject={onUpdateScene3DObject}
                onDeleteObject={onDeleteScene3DObject}
              />
            </div>
          ) : (
            <div
              className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl border border-[#262C36] flex items-center justify-center"
              style={{
                aspectRatio: aspectRatio === "2.39" ? "2.39 / 1" : aspectRatio === "1.85" ? "1.85 / 1" : "16 / 9"
              }}
            >
              {/* Dynamic SVG Schematic Render */}
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: generatePanelSvgSchematic(activeShot || shots[0])
                }}
              />

              {/* OVERLAY: Rule of Thirds */}
              {showThirds && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div />
                </div>
              )}

              {/* OVERLAY: Center Cross */}
              {showCenter && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-6 h-px bg-amber-400/50" />
                  <div className="h-6 w-px bg-amber-400/50 absolute" />
                </div>
              )}

              {/* OVERLAY: Action Safe & Title Safe Area */}
              {showSafeArea && (
                <div className="absolute inset-[5%] border border-dotted border-cyan-400/40 pointer-events-none">
                  <div className="absolute inset-[5%] border border-dotted border-cyan-400/30">
                    <span className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400/60">
                      TITLE SAFE (80%)
                    </span>
                  </div>
                </div>
              )}

              {/* OVERLAY: Eyeline */}
              {showEyeline && (
                <div className="absolute top-[35%] left-0 right-0 border-b border-dashed border-rose-400/50 pointer-events-none flex items-center justify-between px-3">
                  <span className="text-[9px] font-mono text-rose-400/80 bg-black/60 px-1 rounded">
                    EYELINE (35%)
                  </span>
                </div>
              )}

              {/* OVERLAY: 180 Axis */}
              {showAxis180 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-full border-b-2 border-dashed border-amber-500/40" />
                  <span className="absolute top-2 left-2 text-[9px] font-mono text-amber-400/80 bg-black/60 px-1.5 py-0.5 rounded">
                    180° ACTION AXIS
                  </span>
                </div>
              )}

              {/* Shot Telemetry Watermark */}
              <div className="absolute bottom-3 left-4 pointer-events-none flex items-center space-x-3 text-[11px] font-mono text-white/80 bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm">
                <span className="font-bold text-[#D49B54]">SHOT {activeShot.panelNumber}</span>
                <span>•</span>
                <span>{activeShot.lensSuggestion || "50mm"}</span>
                <span>•</span>
                <span>{activeShot.cameraAngle || "eye-level"}</span>
                <span>•</span>
                <span>{activeShot.cameraMovement || "Static"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Shot Strip */}
        <div className="h-14 border-t border-[#262C36] bg-[#0D1015] px-4 flex items-center space-x-2 overflow-x-auto shrink-0 select-none">
          <span className="text-[10px] font-mono text-[#69717E] uppercase mr-2 shrink-0">
            Shots ({shots.length}):
          </span>

          {shots.map((shot, idx) => {
            const isSelected = (selectedShotId === shot.id) || (!selectedShotId && idx === 0);
            const letter = String.fromCharCode(65 + idx);
            return (
              <button
                key={shot.id}
                onClick={() => onSelectShot(shot)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono transition-all shrink-0 border ${
                  isSelected
                    ? "bg-[#171C24] border-[#D49B54] text-[#D49B54] font-bold shadow-md"
                    : "bg-[#12161D] border-[#262C36] text-[#A0A7B2] hover:text-white hover:bg-[#171C24]"
                }`}
              >
                <span>[{letter} {shot.shotType}]</span>
                <span className="truncate max-w-[110px] text-[11px] font-normal text-[#F0F2F5]">
                  {shot.charactersVisible?.[0] || shot.action.slice(0, 14)}
                </span>
                {shot.status === "OUTDATED" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" title="Stale shot" />
                )}
              </button>
            );
          })}

          {onAddShot && (
            <button
              onClick={onAddShot}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-xs text-[#69717E] hover:text-[#A0A7B2] shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Shot</span>
            </button>
          )}
        </div>
      </main>

      {/* Cinematic Anamorphic Screening Room Modal */}
      <AnimaticScreeningModal
        isOpen={isAnimaticOpen}
        onClose={() => setIsAnimaticOpen(false)}
        sceneNumber={selectedSceneNumber}
        sceneSlugline={activeScene?.location || `Scene ${selectedSceneNumber}`}
        panels={shots}
        project={project}
      />
    </div>
  );
};
