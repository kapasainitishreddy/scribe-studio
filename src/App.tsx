import React, { useEffect } from "react";
import { useProject } from "./domain/projectStore";
import { HeaderBar } from "./components/HeaderBar";
import { PropagationBanner } from "./components/PropagationBanner";
import { ScreenplayEditor } from "./components/ScreenplayEditor";
import { StoryBiblePanel } from "./components/StoryBiblePanel";
import { ActorPacketsPanel } from "./components/ActorPacketsPanel";
import { ContinuityPanel } from "./components/ContinuityPanel";
import { ProductionBreakdownPanel } from "./components/ProductionBreakdownPanel";
import { DirectorPanel } from "./components/DirectorPanel";
import { ProducerPanel } from "./components/ProducerPanel";
import { CorkboardPanel } from "./components/CorkboardPanel";
import { RevisionsPanel } from "./components/RevisionsPanel";
import { WriterAgentModal } from "./components/WriterAgentModal";
import { TableReadModal } from "./components/TableReadModal";
import { MeetingScribeModal } from "./components/MeetingScribeModal";
import { ExportModal } from "./components/ExportModal";
import { CommandPalette } from "./components/CommandPalette";

export const App: React.FC = () => {
  const {
    project,
    activeTab,
    setActiveTab,
    selectedSceneNumber,
    setSelectedSceneNumber,
    selectedCharacterId,
    setSelectedCharacterId,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isWriterModalOpen,
    setIsWriterModalOpen,
    isTableReadOpen,
    setIsTableReadOpen,
    isScribeModalOpen,
    setIsScribeModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    updateScreenplay,
    acceptProposal,
    regenerateActorPacket,
    regenerateAllStalePackets,
    createRevision,
    restoreRevision,
    updateCanonFact,
    addCanonFact,
    toggleBreakdownLock,
    addBreakdownElement,
    resolveContinuityIssue,
    addStickyNote,
    updateCorkboardCards,
    loadSampleProject
  } = useProject();

  // Keyboard shortcut Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0d10] text-[#e2e4e9]">
      {/* Workspace Header Strip */}
      <HeaderBar
        project={project}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWriterModal={() => setIsWriterModalOpen(true)}
        onOpenTableRead={() => setIsTableReadOpen(true)}
        onOpenScribeModal={() => setIsScribeModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onLoadSample={loadSampleProject}
      />

      {/* Reactive Propagation Blast Radius Alert Banner */}
      <PropagationBanner
        project={project}
        onRegenerateAll={regenerateAllStalePackets}
        onNavigateToTab={setActiveTab}
      />

      {/* Primary Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "editor" && (
          <ScreenplayEditor
            project={project}
            onUpdateScreenplay={updateScreenplay}
            selectedSceneNumber={selectedSceneNumber}
            onSelectScene={setSelectedSceneNumber}
            onOpenWriterModal={() => setIsWriterModalOpen(true)}
          />
        )}

        {activeTab === "story-bible" && (
          <StoryBiblePanel
            project={project}
            onUpdateCanonFact={updateCanonFact}
            onAddCanonFact={addCanonFact}
          />
        )}

        {activeTab === "actor-packets" && (
          <ActorPacketsPanel
            project={project}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onRegeneratePacket={regenerateActorPacket}
          />
        )}

        {activeTab === "continuity" && (
          <ContinuityPanel
            project={project}
            onResolveIssue={resolveContinuityIssue}
            onSelectScene={(num) => {
              setSelectedSceneNumber(num);
              setActiveTab("editor");
            }}
          />
        )}

        {activeTab === "breakdown" && (
          <ProductionBreakdownPanel
            project={project}
            onToggleLock={toggleBreakdownLock}
            onAddElement={addBreakdownElement}
          />
        )}

        {activeTab === "director" && (
          <DirectorPanel
            project={project}
            selectedSceneNumber={selectedSceneNumber}
            onSelectScene={setSelectedSceneNumber}
            onUpdateShotList={(sNum, shots) => {
              // shot update
            }}
          />
        )}

        {activeTab === "producer" && <ProducerPanel project={project} />}

        {activeTab === "corkboard" && (
          <CorkboardPanel
            project={project}
            onUpdateCards={updateCorkboardCards}
            onSelectScene={(num) => {
              setSelectedSceneNumber(num);
              setActiveTab("editor");
            }}
          />
        )}

        {activeTab === "revisions" && (
          <RevisionsPanel
            project={project}
            onCreateRevision={createRevision}
            onRestoreRevision={restoreRevision}
          />
        )}
      </div>

      {/* Modals & Studios */}
      {isWriterModalOpen && (
        <WriterAgentModal
          project={project}
          selectedSceneNumber={selectedSceneNumber}
          onClose={() => setIsWriterModalOpen(false)}
          onAcceptProposal={(proposal) => {
            acceptProposal(proposal);
            setIsWriterModalOpen(false);
          }}
        />
      )}

      {isTableReadOpen && (
        <TableReadModal project={project} onClose={() => setIsTableReadOpen(false)} />
      )}

      {isScribeModalOpen && (
        <MeetingScribeModal
          project={project}
          onClose={() => setIsScribeModalOpen(false)}
          onAddStickyNotes={(notes) => {
            for (const n of notes) addStickyNote(n);
          }}
        />
      )}

      {isExportModalOpen && (
        <ExportModal project={project} onClose={() => setIsExportModalOpen(false)} />
      )}

      <CommandPalette
        project={project}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateToTab={setActiveTab}
        onSelectScene={(sNum) => {
          setSelectedSceneNumber(sNum);
          setActiveTab("editor");
        }}
        onOpenWriterModal={() => setIsWriterModalOpen(true)}
        onOpenTableRead={() => setIsTableReadOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />
    </div>
  );
};
