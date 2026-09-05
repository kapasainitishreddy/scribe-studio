import React, { useState, useMemo } from "react";
import {
  Package,
  RefreshCw,
  FileDown,
  AlertTriangle,
  CheckCircle,
  User,
  Film,
  Sparkles,
  Printer,
  Eye,
  EyeOff,
  Camera,
  Layers,
  HelpCircle
} from "lucide-react";
import type { Project, StoryboardPanel } from "../../packages/project-model/src/types";
import { generateCharacterSidesText, generateCharacterSidesPdf } from "../../packages/export-engine/src/exportSides";

interface ActorPacketsPanelProps {
  project: Project;
  selectedCharacterId: string;
  onSelectCharacter: (charId: string) => void;
  onRegeneratePacket: (charId: string) => void;
}

export const ActorPacketsPanel: React.FC<ActorPacketsPanelProps> = ({
  project,
  selectedCharacterId,
  onSelectCharacter,
  onRegeneratePacket
}) => {
  const [includeCues, setIncludeCues] = useState(true);
  const [rehearsalMode, setRehearsalMode] = useState(false);
  const [revealedLineIndices, setRevealedLineIndices] = useState<Record<string, boolean>>({});
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const characterKeys = Object.keys(project.characters);
  const activeChar = project.characters[selectedCharacterId] || project.characters[characterKeys[0]];
  const packet = project.actorPackets[selectedCharacterId];

  const handleDownloadSidesPdf = () => {
    if (!activeChar) return;
    const pdfBytes = generateCharacterSidesPdf(project.screenplayText, {
      characterName: activeChar.name,
      projectTitle: project.title,
      includePrecedingCues: includeCues
    });

    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_${activeChar.name.replace(/\s+/g, "_")}_SIDES.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(`Generated Sides PDF for ${activeChar.name}!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadSidesText = () => {
    if (!activeChar) return;
    const text = generateCharacterSidesText(project.screenplayText, {
      characterName: activeChar.name,
      projectTitle: project.title,
      includePrecedingCues: includeCues
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_${activeChar.name.replace(/\s+/g, "_")}_SIDES.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(`Downloaded text sides for ${activeChar.name}!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="flex-1 flex h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Left Sidebar: Characters Selector */}
      <aside className="w-72 border-r border-[#232730] bg-[#111319] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#232730] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">ACTOR PACKETS</span>
          </div>
          <span className="text-[10px] bg-[#1c202a] text-slate-400 px-1.5 py-0.5 rounded">
            {characterKeys.length} Cast
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {characterKeys.map((charId) => {
            const char = project.characters[charId];
            const p = project.actorPackets[charId];
            const isSelected = selectedCharacterId === charId;
            const isStale = p?.isStale;

            return (
              <button
                key={charId}
                onClick={() => onSelectCharacter(charId)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161922]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{char.name}</span>
                  {isStale ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>STALE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                      SYNCED
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span className="capitalize">{char.role}</span>
                  <span>{p?.scenes.length || 0} Scenes</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Packet & Sides View */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0e1015]">
        {/* Packet Header Strip */}
        <div className="h-14 border-b border-[#232730] bg-[#13151c] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              {activeChar?.name[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-200">{activeChar?.name} — Actor Packet</h2>
                {packet?.isStale ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    STALE (Screenplay Updated)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    UP TO DATE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {packet?.scenes.length || 0} Filtered Scenes • Preceding Cue Lines Included
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Rehearsal Mode Toggle */}
            <button
              onClick={() => setRehearsalMode((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                rehearsalMode
                  ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30"
                  : "bg-[#1a1d26] text-slate-300 border-[#2c3243] hover:text-white"
              }`}
              title="Practice line delivery by hiding your own lines until clicked"
            >
              {rehearsalMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{rehearsalMode ? "Rehearsal Mode ON" : "Rehearsal Mode"}</span>
            </button>

            {packet?.isStale && (
              <button
                onClick={() => onRegeneratePacket(selectedCharacterId)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Packet</span>
              </button>
            )}

            <button
              onClick={handleDownloadSidesPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Sides PDF</span>
            </button>

            <button
              onClick={handleDownloadSidesText}
              className="px-2.5 py-1.5 bg-[#1a1d26] hover:bg-[#232835] border border-[#2c3243] text-slate-300 rounded text-xs transition-colors"
              title="Download Plaintext Sides"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Stale Diff Alert Banner */}
        {packet?.isStale && packet.staleDiffPreview && (
          <div className="bg-amber-950/30 border-b border-amber-500/30 px-6 py-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>What Changed for {activeChar.name}:</span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1">{packet.staleReason}</p>
            <pre className="mt-2 text-[11px] font-mono bg-[#0c0d12] p-2 rounded text-slate-300 border border-amber-500/20 overflow-x-auto max-h-24">
              {packet.staleDiffPreview}
            </pre>
          </div>
        )}

        {/* Filtered Scenes Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {packet?.scenes.map((scene) => {
            // Find storyboard sequence for this scene
            const seq = Object.values(project.storyboardSequences || {}).find(
              (s) => s.sceneNumber === scene.sceneNumber
            );
            const matchingPanels = (seq?.panels || []).filter((p) =>
              p.charactersVisible.some((c) =>
                c.toLowerCase().includes(activeChar.name.toLowerCase().split(" ")[0])
              )
            );

            return (
              <div
                key={scene.sceneId}
                className="bg-[#14161f] border border-[#272c3d] rounded-xl p-5 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#252a3a] pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-400 font-mono mr-2">
                      SCENE {scene.sceneNumber}
                    </span>
                    <span className="text-sm font-bold text-slate-200">{scene.sceneHeading}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Wardrobe: <span className="text-slate-300">{scene.wardrobeCheck}</span>
                  </div>
                </div>

                {/* Scene Objective & State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#101218] p-3 rounded-lg border border-[#202534]">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">
                      Scene Objective
                    </span>
                    <span className="text-slate-200 mt-0.5 block">{scene.dramaticObjective}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">
                      Emotional State
                    </span>
                    <span className="text-slate-200 mt-0.5 block">{scene.emotionalState}</span>
                  </div>
                </div>

                {/* Epistemic Knowledge Box */}
                <div className="bg-[#10131d] border border-[#222738] rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Epistemic Knowledge & Secret Canon for Scene {scene.sceneNumber}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-400">What I Know:</strong>
                      {scene.sceneNumber === 1 && "Marcus is covering the perimeter; the cipher rebuilds every 16ms."}
                      {scene.sceneNumber === 3 && "Thorne is on the helipad; drainage flume drops 80ft into freezing harbor."}
                      {scene.sceneNumber === 4 && "Master manifest reveals Elena designed the prototype 3 years prior."}
                      {![1, 3, 4].includes(scene.sceneNumber) && "Active operational stakes according to screenplay."}
                    </div>
                    <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-300">
                      <strong className="block text-[10px] uppercase font-bold text-amber-400">What I DO NOT Know Yet:</strong>
                      {scene.sceneNumber === 1 && "Dr. Thorne has already deployed armed mercenaries on the service lift."}
                      {scene.sceneNumber === 3 && "The Obsidian Drive payload contains Dr. Elena Lin's encrypted memory imprint."}
                      {scene.sceneNumber === 4 && "Where Dr. Elena Lin is currently being held."}
                      {![1, 3, 4].includes(scene.sceneNumber) && "True syndicate agenda not yet uncovered."}
                    </div>
                  </div>
                </div>

                {/* Storyboard Visual Reference for Actor Blocking & Eyelines */}
                {matchingPanels.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-300 font-bold text-[11px]">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Visual Comic Blocking & Eyelines ({matchingPanels.length} Setups)</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Camera view from Storyboard</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {matchingPanels.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#0b0c10] border border-[#212636] rounded-lg overflow-hidden flex flex-col"
                        >
                          <div className="aspect-video relative bg-black">
                            {p.svgSchematic ? (
                              <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: p.svgSchematic }}
                              />
                            ) : (
                              <div className="text-[10px] text-slate-600 p-2">Schematic</div>
                            )}
                            <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-amber-400">
                              #{p.panelNumber} {p.shotType}
                            </div>
                          </div>
                          <div className="p-1.5 text-[10px] text-slate-300 line-clamp-1 bg-[#121520]">
                            {p.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dialogue & Cue Blocks */}
                <div className="space-y-4 font-mono text-sm pt-2">
                  {scene.cues.map((cue, idx) => {
                    const lineKey = `${scene.sceneNumber}-${idx}`;
                    const isRevealed = revealedLineIndices[lineKey];

                    return (
                      <div key={idx} className="space-y-2 border-l-2 border-indigo-500/40 pl-4 py-1">
                        {/* Preceding Cue Line */}
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500 font-bold uppercase mr-1">CUE ({cue.cueSpeaker}):</span>
                          <span className="italic">"{cue.cueLine}"</span>
                        </div>

                        {/* Speaking Character Cue */}
                        <div className="font-bold text-amber-300 tracking-wider">
                          {activeChar.name.toUpperCase()}
                        </div>

                        {cue.parenthetical && (
                          <div className="text-xs text-slate-400 italic">{cue.parenthetical}</div>
                        )}

                        {cue.dialogueLines.map((line, lIdx) => (
                          <div
                            key={lIdx}
                            onClick={() => {
                              if (rehearsalMode) {
                                setRevealedLineIndices((prev) => ({
                                  ...prev,
                                  [lineKey]: !prev[lineKey]
                                }));
                              }
                            }}
                            className={`leading-relaxed max-w-xl transition-all ${
                              rehearsalMode && !isRevealed
                                ? "filter blur-sm bg-indigo-950/40 select-none cursor-pointer py-1 px-2 rounded text-indigo-300 hover:bg-indigo-900/50"
                                : "text-slate-200"
                            }`}
                            title={rehearsalMode && !isRevealed ? "Click to reveal line for rehearsal" : undefined}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
