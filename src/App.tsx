import React from "react";
import { useProject } from "./domain/projectStore";
import { DeskShell } from "./components/desk/DeskShell";

export const App: React.FC = () => {
  const {
    project,
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
    isComplianceOpen,
    setIsComplianceOpen,
    updateScreenplay,
    regenerateActorPacket,
    regenerateAllStalePackets,
    resolveContinuityIssue,
    toggleBreakdownLock,
    addBreakdownElement,
    loadSampleProject,
    createNewProject,
    addScene3DObject,
    updateScene3DObject,
    deleteScene3DObject,
    runParallelResearch,
    executeHeroWorkflow,
    approveHeroWorkflow,
    rejectHeroWorkflow,
    setActiveAiProvider,
    updateStoryboardPanel,
    regenerateStoryboardPanel,
    regenerateOutdatedPanels,
    generateStoryboardForScene
  } = useProject();

  return (
    <DeskShell
      project={project}
      updateScreenplay={updateScreenplay}
      selectedSceneNumber={selectedSceneNumber}
      setSelectedSceneNumber={setSelectedSceneNumber}
      selectedCharacterId={selectedCharacterId}
      setSelectedCharacterId={setSelectedCharacterId}
      isCommandPaletteOpen={isCommandPaletteOpen}
      setIsCommandPaletteOpen={setIsCommandPaletteOpen}
      isComplianceOpen={isComplianceOpen}
      setIsComplianceOpen={setIsComplianceOpen}
      isExportModalOpen={isExportModalOpen}
      setIsExportModalOpen={setIsExportModalOpen}
      isWriterModalOpen={isWriterModalOpen}
      setIsWriterModalOpen={setIsWriterModalOpen}
      isTableReadOpen={isTableReadOpen}
      setIsTableReadOpen={setIsTableReadOpen}
      isScribeModalOpen={isScribeModalOpen}
      setIsScribeModalOpen={setIsScribeModalOpen}
      executeHeroWorkflow={executeHeroWorkflow}
      approveHeroWorkflow={approveHeroWorkflow}
      rejectHeroWorkflow={rejectHeroWorkflow}
      regenerateActorPacket={regenerateActorPacket}
      regenerateAllStalePackets={regenerateAllStalePackets}
      resolveContinuityIssue={(id) => resolveContinuityIssue(id, "resolved")}
      toggleBreakdownLock={toggleBreakdownLock}
      addBreakdownElement={addBreakdownElement}
      addScene3DObject={addScene3DObject}
      updateScene3DObject={updateScene3DObject}
      deleteScene3DObject={deleteScene3DObject}
      runParallelResearch={(query) => runParallelResearch(selectedSceneNumber, query)}
      loadSampleProject={loadSampleProject}
      createNewProject={() => createNewProject("Untitled Screenplay", "Writer")}
      setActiveAiProvider={setActiveAiProvider}
      updateStoryboardPanel={updateStoryboardPanel}
      regenerateStoryboardPanel={regenerateStoryboardPanel}
      regenerateOutdatedPanels={regenerateOutdatedPanels}
      generateStoryboardForScene={generateStoryboardForScene}
    />
  );
};
