import React from "react";
import {
  User,
  Film,
  Camera,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  Eye,
  Sliders,
  ShieldAlert,
  Clock,
  MapPin,
  Package
} from "lucide-react";
import type { Project, StoryboardPanel } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";

export type InspectorMode = "character" | "scene" | "shot" | "performance" | "change_impact" | "overview";

interface ContextInspectorProps {
  project: Project;
  mode: InspectorMode;
  selectedCharacterId: string;
  selectedSceneNumber: number;
  selectedShot?: StoryboardPanel | null;
  onSelectCharacter: (charId: string) => void;
  onSelectScene: (sceneNum: number) => void;
  onClose: () => void;
  onOpenCharacterBible: () => void;
  onOpenWriterAgent: () => void;
  onApplyChanges: () => Promise<void>;
  isApplyingChanges: boolean;
  changeProgress?: { current: number; total: number; label: string } | null;
  onRegenerateShot?: (panelId: string) => void;
  onUpdateShotLens?: (lens: string) => void;
  onOpenPassport?: () => void;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  project,
  mode,
  selectedCharacterId,
  selectedSceneNumber,
  selectedShot,
  onSelectCharacter,
  onSelectScene,
  onClose,
  onOpenCharacterBible,
  onOpenWriterAgent,
  onApplyChanges,
  isApplyingChanges,
  changeProgress,
  onRegenerateShot,
  onUpdateShotLens,
  onOpenPassport
}) => {
  const activeChar = project.characters[selectedCharacterId] || Object.values(project.characters)[0];
  const parsed = React.useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const activeScene = parsed.scenes.find((s) => s.number === selectedSceneNumber) || parsed.scenes[0];

  // Downstream scene statistics
  const sceneElements = project.breakdown.elements.filter((e) => e.sceneNumber === selectedSceneNumber);
  const sceneProps = sceneElements.filter((e) => e.category === "props");
  const sceneCharacters = sceneElements.filter((e) => e.category === "cast");
  const sceneContinuityAlerts = project.continuityIssues.filter(
    (i) => i.affectedScenes.includes(selectedSceneNumber) && i.status === "active"
  );
  const sceneStoryboard = project.storyboardSequences?.[selectedSceneNumber]?.panels || [];
  const sceneStalePanels = sceneStoryboard.filter((p) => p.status === "OUTDATED");

  // Character specific metrics
  const charPacket = project.actorPackets[selectedCharacterId];
  const charContinuityIssues = project.continuityIssues.filter(
    (i) => activeChar && i.affectedCharacters.includes(activeChar.name) && i.status === "active"
  );
  const charKnownFacts = activeChar?.knowledgeByScene?.[selectedSceneNumber] || [];
  const allCanonFacts = project.canon || [];
  const unknownFactCount = Math.max(0, allCanonFacts.length - charKnownFacts.length);

  return (
    <aside className="w-80 border-l border-[#262C36] bg-[#0D1015] flex flex-col h-full overflow-hidden select-none shrink-0 z-10 transition-all duration-200">
      {/* Inspector Header */}
      <div className="h-10 border-b border-[#262C36] bg-[#12161D] px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#A0A7B2]">
          {mode === "character" && (
            <>
              <User className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Character Dossier</span>
            </>
          )}
          {mode === "scene" && (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Scene Inspector</span>
            </>
          )}
          {mode === "shot" && (
            <>
              <Camera className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Shot Inspector</span>
            </>
          )}
          {mode === "performance" && (
            <>
              <Eye className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Performance HUD</span>
            </>
          )}
          {mode === "change_impact" && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[#F59E0B]">Change Intelligence</span>
            </>
          )}
          {mode === "overview" && (
            <>
              <Film className="w-3.5 h-3.5 text-[#D49B54]" />
              <span>Production Overview</span>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 text-[#69717E] hover:text-[#F0F2F5] rounded hover:bg-[#171C24] transition-colors"
          title="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[#F0F2F5]">
        {/* ============================================================ */}
        {/* 1. CHARACTER DOSSIER                                         */}
        {/* ============================================================ */}
        {mode === "character" && activeChar && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight uppercase">
                {activeChar.name}
              </h3>
              <p className="text-[11px] text-[#A0A7B2] capitalize">
                {activeChar.role} Role • Scene {selectedSceneNumber}
              </p>
            </div>

            <div className="h-px bg-[#262C36]" />

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Current Objective</span>
                <span className="font-medium text-right text-[#F0F2F5] truncate max-w-[170px]">
                  {activeChar.dramaticObjective || "Uncover truth"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Emotional State</span>
                <span className="font-medium text-right text-[#D49B54]">Guarded & Suspicious</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Facts Known</span>
                <span className="font-mono text-[#10B981] font-semibold">{charKnownFacts.length} verified</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Epistemic Horizon</span>
                <span className="font-mono text-[#A0A7B2]">{unknownFactCount} unknown future facts</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Scene Appearances</span>
                <span className="font-mono text-[#F0F2F5]">12 scenes</span>
              </div>
            </div>

            {/* Continuity Alert if any */}
            {charContinuityIssues.length > 0 ? (
              <div className="p-2.5 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Continuity Alert</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {charContinuityIssues[0].reason || charContinuityIssues[0].headline}
                </p>
              </div>
            ) : (
              <div className="p-2 rounded bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Character timeline & knowledge consistent</span>
              </div>
            )}

            <button
              onClick={onOpenCharacterBible}
              className="w-full mt-3 py-1.5 px-3 rounded bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-xs font-medium text-[#D49B54] flex items-center justify-center space-x-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Character Bible</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. SCENE DOSSIER                                             */}
        {/* ============================================================ */}
        {mode === "scene" && activeScene && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] font-bold">
                  SCENE {activeScene.number}
                </span>
                <span className="text-[11px] text-[#A0A7B2] uppercase font-mono">
                  {activeScene.timeOfDay || "NIGHT"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-1 truncate">
                {activeScene.location || "EXT. ROOFTOP"}
              </h3>
            </div>

            <div className="h-px bg-[#262C36]" />

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Location</span>
                <span className="font-medium text-right text-[#F0F2F5] truncate max-w-[170px]">
                  {activeScene.location}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Characters</span>
                <span className="font-medium text-right text-[#F0F2F5] truncate max-w-[170px]">
                  {sceneCharacters.map((c) => c.name).join(", ") || "Maya, Arjun"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Props Present</span>
                <span className="font-medium text-right text-[#D49B54] truncate max-w-[170px]">
                  {sceneProps.map((p) => p.name).join(", ") || "Silver Locket, Gun"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Page Length</span>
                <span className="font-mono text-[#F0F2F5]">2 ⅛ pages</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Est. Screen Time</span>
                <span className="font-mono text-[#F0F2F5]">2:04 min</span>
              </div>
            </div>

            {/* Downstream Production Dependencies */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#69717E]">
                Downstream Production
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-[#12161D] border border-[#262C36] text-center">
                  <div className="text-base font-bold text-white font-mono">{sceneStoryboard.length}</div>
                  <div className="text-[10px] text-[#A0A7B2]">Storyboard Panels</div>
                </div>

                <div className="p-2 rounded bg-[#12161D] border border-[#262C36] text-center">
                  <div className={`text-base font-bold font-mono ${sceneStalePanels.length > 0 ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                    {sceneStalePanels.length}
                  </div>
                  <div className="text-[10px] text-[#A0A7B2]">Stale Panels</div>
                </div>
              </div>

              {sceneContinuityAlerts.length > 0 && (
                <div className="p-2.5 rounded bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-[11px]">
                  ⚠ {sceneContinuityAlerts.length} continuity alert in this scene
                </div>
              )}
            </div>

            <button
              onClick={onOpenWriterAgent}
              className="w-full mt-3 py-1.5 px-3 rounded bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-xs font-medium text-[#D49B54] flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Writer Assistant for Scene {activeScene.number}</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. SHOT INSPECTOR                                            */}
        {/* ============================================================ */}
        {mode === "shot" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] font-bold">
                  {selectedShot ? `SHOT ${selectedShot.panelNumber}` : "SHOT 18-B"}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${selectedShot?.status === "OUTDATED" ? "bg-[#F43F5E]/20 text-[#F43F5E]" : "bg-[#10B981]/20 text-[#10B981]"}`}>
                  {selectedShot?.status === "OUTDATED" ? "⚠ Stale Shot" : "✓ Synced"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-1">
                {selectedShot ? selectedShot.action : "CU Maya — Rain streaks across jawline"}
              </h3>
            </div>

            <div className="h-px bg-[#262C36]" />

            {/* Prime Lens Kit Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#A0A7B2] font-medium flex justify-between">
                <span>Prime Lens</span>
                <span className="text-[#D49B54] font-mono">{selectedShot?.lensSuggestion || "50mm Standard"}</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {["24mm", "35mm", "50mm", "85mm"].map((lens) => (
                  <button
                    key={lens}
                    onClick={() => onUpdateShotLens?.(lens)}
                    className={`py-1.5 text-xs font-mono rounded border transition-all ${
                      lens === "50mm"
                        ? "bg-[#D49B54]/20 border-[#D49B54] text-[#D49B54] font-bold"
                        : "bg-[#12161D] border-[#262C36] text-[#A0A7B2] hover:text-white"
                    }`}
                  >
                    {lens}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Aperture</span>
                <span className="font-mono text-[#F0F2F5]">f/2.8 Depth-of-field</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Movement</span>
                <span className="font-mono text-[#F0F2F5]">{selectedShot?.cameraMovement || "Slow Dolly In"}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Framing</span>
                <span className="font-mono text-[#F0F2F5]">{selectedShot?.shotType || "CU"} (2.39:1)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Lighting</span>
                <span className="text-[#F0F2F5]">{selectedShot?.lightingIntent || "Low-key Cyan & Amber backlight"}</span>
              </div>
            </div>

            {selectedShot?.status === "OUTDATED" && (
              <button
                onClick={() => onRegenerateShot?.(selectedShot.id)}
                className="w-full mt-3 py-1.5 px-3 rounded bg-[#D49B54] hover:bg-[#E3AF69] text-black font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Stale Shot</span>
              </button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. PERFORMANCE HUD (ACTOR REHEARSAL)                         */}
        {/* ============================================================ */}
        {mode === "performance" && activeChar && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] font-bold">
                REHEARSAL TELEMETRY
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight mt-1">
                {activeChar.name} • Scene {selectedSceneNumber}
              </h3>
            </div>

            <div className="h-px bg-[#262C36]" />

            <div className="space-y-2">
              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36]">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Dramatic Objective</div>
                <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">{activeChar.dramaticObjective || "Make him admit it"}</div>
              </div>

              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36]">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Internal Obstacle</div>
                <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">Pride & fear of betrayal</div>
              </div>

              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36]">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Subtext</div>
                <div className="text-xs font-semibold text-[#D49B54] mt-0.5">"Don't leave me alone again."</div>
              </div>

              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36]">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Delivery Emotion</div>
                <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">Cold anger masking vulnerability</div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. CHANGE IMPACT (HERO WORKFLOW & CHANGE PASSPORT)           */}
        {/* ============================================================ */}
        {mode === "change_impact" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold">
                  CHANGE INTELLIGENCE
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight mt-1">
                  Scene {selectedSceneNumber} Blast Radius
                </h3>
              </div>
              {onOpenPassport && (
                <button
                  onClick={onOpenPassport}
                  className="px-2 py-1 rounded bg-[#171C24] hover:bg-[#202736] border border-[#D49B54]/40 text-[#D49B54] text-[10px] font-mono flex items-center space-x-1"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Passport</span>
                </button>
              )}
            </div>

            <div className="h-px bg-[#262C36]" />

            <div className="space-y-2">
              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36] space-y-1">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Script AST State</div>
                <div className="text-xs text-[#10B981] flex items-center space-x-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Scene {selectedSceneNumber} AST node registered</span>
                </div>
              </div>

              {/* Storyboard Pipeline Status */}
              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36] space-y-1">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Storyboard Pipeline</div>
                {(project.propagationState.staleStoryboardPanels || []).length > 0 ? (
                  (project.propagationState.staleStoryboardPanels || []).map((pId) => (
                    <div key={pId} className="text-xs text-[#F59E0B] flex items-center space-x-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Panel {pId} invalidated by AST diff</span>
                    </div>
                  ))
                ) : sceneStalePanels.length > 0 ? (
                  sceneStalePanels.map((p) => (
                    <div key={p.id} className="text-xs text-[#F59E0B] flex items-center space-x-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Panel {p.panelNumber} marked OUTDATED</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All storyboard panels synchronized</span>
                  </div>
                )}
              </div>

              {/* Actor Packets Pipeline Status */}
              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36] space-y-1">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Actor Packets</div>
                {(project.propagationState.staleActorPackets || []).length > 0 ? (
                  (project.propagationState.staleActorPackets || []).map((charId) => (
                    <div key={charId} className="text-xs text-[#F59E0B] flex items-center space-x-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Sides dirty for {project.characters[charId]?.name || charId}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cast rehearsal packets up to date</span>
                  </div>
                )}
              </div>

              {/* Continuity Tracking */}
              <div className="p-2.5 rounded bg-[#12161D] border border-[#262C36] space-y-1">
                <div className="text-[10px] font-mono text-[#69717E] uppercase">Continuity Tracking</div>
                {sceneContinuityAlerts.length > 0 ? (
                  sceneContinuityAlerts.map((issue) => (
                    <div key={issue.id} className="text-xs text-[#F59E0B] flex items-center space-x-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{issue.reason}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 continuity violations in Scene {selectedSceneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {changeProgress ? (
              <div className="p-3 rounded bg-[#171C24] border border-[#262C36] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0A7B2] font-mono">{changeProgress.label}</span>
                  <span className="text-[#D49B54] font-mono font-bold">
                    {changeProgress.current} / {changeProgress.total}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0D1015] overflow-hidden">
                  <div
                    className="h-full bg-[#D49B54] transition-all duration-300"
                    style={{ width: `${(changeProgress.current / changeProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                {(() => {
                  const stalePanelsCount = project.propagationState.staleStoryboardPanels?.length || 0;
                  const stalePacketsCount = project.propagationState.staleActorPackets?.length || 0;
                  const totalDirty = stalePanelsCount + stalePacketsCount + sceneContinuityAlerts.length;

                  return (
                    <>
                      <div className="text-[11px] text-[#69717E] font-mono">
                        {totalDirty > 0
                          ? `Selective invalidation: ${totalDirty} affected item${totalDirty === 1 ? "" : "s"}`
                          : "AST dependency graph fully consistent"}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={onClose}
                          className="py-1.5 px-3 rounded bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-xs font-medium text-[#A0A7B2]"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={onApplyChanges}
                          disabled={isApplyingChanges || totalDirty === 0}
                          className="py-1.5 px-3 rounded bg-[#D49B54] hover:bg-[#E3AF69] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1"
                        >
                          {isApplyingChanges ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Applying...</span>
                            </>
                          ) : totalDirty > 0 ? (
                            <span>Apply {totalDirty} {totalDirty === 1 ? "Update" : "Updates"}</span>
                          ) : (
                            <span>In Sync</span>
                          )}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. GENERAL PRODUCTION OVERVIEW                              */}
        {/* ============================================================ */}
        {mode === "overview" && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] font-bold">
                PRODUCTION SUMMARY
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight mt-1">
                {project.title}
              </h3>
            </div>

            <div className="h-px bg-[#262C36]" />

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Total Scenes</span>
                <span className="font-mono text-[#F0F2F5]">{parsed.scenes.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Speaking Characters</span>
                <span className="font-mono text-[#F0F2F5]">{Object.keys(project.characters).length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Continuity Status</span>
                {project.continuityIssues.filter((i) => i.status === "active").length === 0 ? (
                  <span className="font-mono text-emerald-400">CONSISTENT</span>
                ) : (
                  <span className="font-mono text-amber-400">
                    {project.continuityIssues.filter((i) => i.status === "active").length} ACTIVE ALERTS
                  </span>
                )}
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A202C]">
                <span className="text-[#69717E]">Parallel Ground Truth</span>
                <span className="font-mono text-[#0EA5E9]">
                  {(project.researchFindings || []).some((r) => r.isParallelApiResult)
                    ? "Parallel Live API"
                    : (project.researchFindings || []).length > 0
                    ? "Grounded Offline"
                    : "Ready"}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
