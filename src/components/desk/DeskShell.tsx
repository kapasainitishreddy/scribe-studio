import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Project, StoryboardPanel } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { DeskTopBar } from "./DeskTopBar";
import { DeskRail, DeskMode } from "./DeskRail";
import { ContextInspector, InspectorMode } from "./ContextInspector";
import { ChangeIntelligenceBar } from "./ChangeIntelligenceBar";
import { HomeDesk } from "./HomeDesk";
import { WriteWorkspace } from "./WriteWorkspace";
import { VisualizeWorkspace } from "./VisualizeWorkspace";
import { PerformWorkspace } from "./PerformWorkspace";
import { ProduceWorkspace } from "./ProduceWorkspace";
import { CommandPalette } from "../CommandPalette";
import { ComplianceDrawer } from "../ComplianceDrawer";
import { ExportModal } from "../ExportModal";
import { WriterAgentModal } from "../WriterAgentModal";
import { TableReadModal } from "../TableReadModal";
import { MeetingScribeModal } from "../MeetingScribeModal";
import { ChangePassportModal } from "./ChangePassportModal";
import { createProductionChangePassport } from "../../../packages/project-model/src/passportBuilder";

interface DeskShellProps {
  project: Project;
  updateScreenplay: (text: string) => void;
  selectedSceneNumber: number;
  setSelectedSceneNumber: (sceneNum: number) => void;
  selectedCharacterId: string;
  setSelectedCharacterId: (charId: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isComplianceOpen: boolean;
  setIsComplianceOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isWriterModalOpen: boolean;
  setIsWriterModalOpen: (open: boolean) => void;
  isTableReadOpen: boolean;
  setIsTableReadOpen: (open: boolean) => void;
  isScribeModalOpen: boolean;
  setIsScribeModalOpen: (open: boolean) => void;
  executeHeroWorkflow: (sceneNum?: number) => Promise<any>;
  approveHeroWorkflow: (metrics?: any) => any;
  rejectHeroWorkflow: () => void;
  regenerateActorPacket: (charId: string) => void;
  regenerateAllStalePackets: () => void;
  resolveContinuityIssue: (issueId: string) => void;
  toggleBreakdownLock: (elementId: string) => void;
  addBreakdownElement: (element: any) => void;
  addScene3DObject: (obj: any) => void;
  updateScene3DObject: (id: string, updates: any) => void;
  deleteScene3DObject: (id: string) => void;
  runParallelResearch: (query: string) => Promise<any>;
  loadSampleProject: () => void;
  createNewProject: () => void;
  setActiveAiProvider: (provider: any) => void;
  updateStoryboardPanel: (seqId: string, panelId: string, updates: any) => void;
  regenerateStoryboardPanel: (seqId: string, panelId: string) => void;
  regenerateOutdatedPanels: (seqId: string) => void;
  generateStoryboardForScene: (sceneNum: number) => void;
}

export const DeskShell: React.FC<DeskShellProps> = ({
  project,
  updateScreenplay,
  selectedSceneNumber,
  setSelectedSceneNumber,
  selectedCharacterId,
  setSelectedCharacterId,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  isComplianceOpen,
  setIsComplianceOpen,
  isExportModalOpen,
  setIsExportModalOpen,
  isWriterModalOpen,
  setIsWriterModalOpen,
  isTableReadOpen,
  setIsTableReadOpen,
  isScribeModalOpen,
  setIsScribeModalOpen,
  executeHeroWorkflow,
  approveHeroWorkflow,
  rejectHeroWorkflow,
  regenerateActorPacket,
  regenerateAllStalePackets,
  resolveContinuityIssue,
  toggleBreakdownLock,
  addBreakdownElement,
  addScene3DObject,
  updateScene3DObject,
  deleteScene3DObject,
  runParallelResearch,
  loadSampleProject,
  createNewProject,
  setActiveAiProvider,
  updateStoryboardPanel,
  regenerateStoryboardPanel,
  regenerateOutdatedPanels,
  generateStoryboardForScene
}) => {
  // Primary mode state: home | write | visualize | perform | produce
  const [currentMode, setCurrentMode] = useState<DeskMode>("write");

  // Context Inspector state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("scene");
  const [selectedShot, setSelectedShot] = useState<StoryboardPanel | null>(null);

  // Change Intelligence state
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [changeProgress, setChangeProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);

  // Dynamically constructed production change passport for active scene
  const activePassport = useMemo(() => {
    return createProductionChangePassport(project, selectedSceneNumber);
  }, [project, selectedSceneNumber]);

  // Check if stale downstream production changes exist
  const hasStaleChanges =
    (project.propagationState.staleStoryboardPanels?.length || 0) > 0 ||
    project.propagationState.staleActorPackets.length > 0 ||
    project.continuityIssues.some((i) => i.status === "active");

  // Adapt inspector mode when primary mode changes
  const handleSelectMode = (mode: DeskMode) => {
    setCurrentMode(mode);
    if (mode === "write") setInspectorMode("scene");
    else if (mode === "visualize") setInspectorMode("shot");
    else if (mode === "perform") setInspectorMode("performance");
    else if (mode === "produce") setInspectorMode("overview");
  };

  // When a character is selected
  const handleSelectCharacter = (charId: string) => {
    setSelectedCharacterId(charId);
    setInspectorMode("character");
    setIsInspectorOpen(true);
  };

  // When a scene is selected
  const handleSelectScene = (sceneNum: number) => {
    setSelectedSceneNumber(sceneNum);
    setInspectorMode("scene");
  };

  // When a shot is selected
  const handleSelectShot = (shot: StoryboardPanel) => {
    setSelectedShot(shot);
    setInspectorMode("shot");
    setIsInspectorOpen(true);
  };

  // When user clicks Review Changes in the footer bar
  const handleReviewChanges = () => {
    setIsPassportModalOpen(true);
    setInspectorMode("change_impact");
    setIsInspectorOpen(true);
  };

  // 1-Click Change Intelligence Application: Deterministic selective invalidation
  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);
    const seqId = `seq-${selectedSceneNumber}`;
    const stalePanels = project.propagationState.staleStoryboardPanels || [];
    const stalePackets = project.propagationState.staleActorPackets || [];
    const totalSteps = (stalePanels.length > 0 ? 1 : 0) + (stalePackets.length > 0 ? 1 : 0) + 1;
    let currentStep = 0;

    if (stalePanels.length > 0) {
      currentStep += 1;
      setChangeProgress({
        current: currentStep,
        total: totalSteps,
        label: `Regenerating ${stalePanels.length} outdated storyboard ${stalePanels.length === 1 ? "panel" : "panels"}...`
      });
      regenerateOutdatedPanels(seqId);
    }

    if (stalePackets.length > 0) {
      currentStep += 1;
      setChangeProgress({
        current: currentStep,
        total: totalSteps,
        label: `Updating ${stalePackets.length} stale actor ${stalePackets.length === 1 ? "packet" : "packets"}...`
      });
      regenerateAllStalePackets();
    }

    currentStep += 1;
    setChangeProgress({
      current: currentStep,
      total: totalSteps,
      label: "Synchronizing continuity AST and generating verification report..."
    });

    approveHeroWorkflow();

    setIsApplyingChanges(false);
    setChangeProgress(null);
    setIsPassportModalOpen(false);
    setInspectorMode("overview");
  };

  // Keyboard shortcut Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090B0E] text-[#F0F2F5] select-none">
      {/* 1. TOP BAR */}
      <DeskTopBar
        project={project}
        currentMode={currentMode}
        selectedSceneNumber={selectedSceneNumber}
        totalScenes={parsed.scenes.length}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onToggleHome={() => setCurrentMode(currentMode === "home" ? "write" : "home")}
      />

      {/* 2. MAIN WORKSPACE WITH STABLE GEOGRAPHY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Icon Rail (w-13) */}
        <DeskRail
          currentMode={currentMode}
          onSelectMode={handleSelectMode}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenDiagnostics={() => setIsComplianceOpen(true)}
          hasStaleProductionChanges={hasStaleChanges}
        />

        {/* Central Creative Canvas Area */}
        <div className="flex-1 flex overflow-hidden">
          {currentMode === "home" && (
            <HomeDesk
              project={project}
              onContinue={() => setCurrentMode("write")}
              onNewProject={createNewProject}
              onLoadSample={loadSampleProject}
            />
          )}

          {currentMode === "write" && (
            <WriteWorkspace
              project={project}
              selectedSceneNumber={selectedSceneNumber}
              onSelectScene={handleSelectScene}
              onSelectCharacter={handleSelectCharacter}
              onUpdateScreenplay={updateScreenplay}
              onOpenWriterModal={() => setIsWriterModalOpen(true)}
            />
          )}

          {currentMode === "visualize" && (
            <VisualizeWorkspace
              project={project}
              selectedSceneNumber={selectedSceneNumber}
              onSelectScene={handleSelectScene}
              selectedShotId={selectedShot?.id || null}
              onSelectShot={handleSelectShot}
              onAddScene3DObject={addScene3DObject}
              onUpdateScene3DObject={updateScene3DObject}
              onDeleteScene3DObject={deleteScene3DObject}
            />
          )}

          {currentMode === "perform" && (
            <PerformWorkspace
              project={project}
              selectedCharacterId={selectedCharacterId}
              onSelectCharacter={handleSelectCharacter}
              selectedSceneNumber={selectedSceneNumber}
              onSelectScene={handleSelectScene}
              onRegeneratePacket={regenerateActorPacket}
            />
          )}

          {currentMode === "produce" && (
            <ProduceWorkspace
              project={project}
              selectedSceneNumber={selectedSceneNumber}
              onSelectScene={handleSelectScene}
              onResolveIssue={resolveContinuityIssue}
              onToggleBreakdownLock={toggleBreakdownLock}
              onRunParallelResearch={runParallelResearch}
            />
          )}
        </div>

        {/* Right Context-Sensitive Inspector (w-80) */}
        {isInspectorOpen && currentMode !== "home" && (
          <ContextInspector
            project={project}
            mode={inspectorMode}
            selectedCharacterId={selectedCharacterId}
            selectedSceneNumber={selectedSceneNumber}
            selectedShot={selectedShot}
            onSelectCharacter={handleSelectCharacter}
            onSelectScene={handleSelectScene}
            onClose={() => setIsInspectorOpen(false)}
            onOpenCharacterBible={() => {
              setCurrentMode("write");
              setInspectorMode("character");
            }}
            onOpenWriterAgent={() => setIsWriterModalOpen(true)}
            onApplyChanges={handleApplyChanges}
            isApplyingChanges={isApplyingChanges}
            changeProgress={changeProgress}
            onRegenerateShot={(shotId) => {
              const seqId = `seq-${selectedSceneNumber}`;
              regenerateStoryboardPanel(seqId, shotId);
            }}
            onOpenPassport={() => setIsPassportModalOpen(true)}
          />
        )}
      </div>

      {/* 3. BOTTOM CHANGE INTELLIGENCE BAR */}
      {currentMode !== "home" && (
        <ChangeIntelligenceBar
          project={project}
          selectedSceneNumber={selectedSceneNumber}
          onReviewChanges={handleReviewChanges}
          isReviewOpen={isInspectorOpen && inspectorMode === "change_impact"}
        />
      )}

      {/* 4. DIALOGS & OVERLAYS */}
      {/* Command Palette */}
      <CommandPalette
        project={project}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateToTab={(tab) => {
          if (tab === "editor" || tab === "story-bible" || tab === "revisions") setCurrentMode("write");
          else if (tab === "comic" || tab === "director" || tab === "cinematographer" || tab === "scene-3d") setCurrentMode("visualize");
          else if (tab === "actor-packets") setCurrentMode("perform");
          else if (tab === "continuity" || tab === "breakdown" || tab === "research") setCurrentMode("produce");
        }}
        onSelectScene={handleSelectScene}
        onOpenWriterModal={() => setIsWriterModalOpen(true)}
        onOpenTableRead={() => setIsTableReadOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Developer Diagnostics & Telemetry Drawer (Behind ⌘K / Settings) */}
      {isComplianceOpen && (
        <ComplianceDrawer
          project={project}
          isOpen={isComplianceOpen}
          onClose={() => setIsComplianceOpen(false)}
          onUpdateProviderSettings={setActiveAiProvider}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          project={project}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Writer Agent Modal */}
      {isWriterModalOpen && (
        <WriterAgentModal
          project={project}
          selectedSceneNumber={selectedSceneNumber}
          onClose={() => setIsWriterModalOpen(false)}
          onAcceptProposal={(p) => {
            updateScreenplay(p.proposedText);
            setIsWriterModalOpen(false);
          }}
        />
      )}

      {/* Table Read Modal */}
      {isTableReadOpen && (
        <TableReadModal
          project={project}
          onClose={() => setIsTableReadOpen(false)}
        />
      )}

      {/* Meeting Scribe Modal */}
      {isScribeModalOpen && (
        <MeetingScribeModal
          project={project}
          onClose={() => setIsScribeModalOpen(false)}
          onAddStickyNotes={() => {}}
        />
      )}

      {/* Production Change Passport Modal */}
      {isPassportModalOpen && activePassport && (
        <ChangePassportModal
          passport={activePassport}
          onApprove={async () => {
            await handleApplyChanges();
          }}
          onReject={() => {
            rejectHeroWorkflow();
            setIsPassportModalOpen(false);
          }}
          onClose={() => setIsPassportModalOpen(false)}
        />
      )}
    </div>
  );
};

