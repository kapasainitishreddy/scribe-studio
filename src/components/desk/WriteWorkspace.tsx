import React, { useState, useRef, useMemo } from "react";
import {
  Users,
  MapPin,
  BookOpen,
  History,
  FileText,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import type { Project, StoryboardPanel, CanonFact } from "../../../packages/project-model/src/types";
import { parseScreenplay, screenplayStats } from "../../../packages/screenplay-core/src/fountain";

interface WriteWorkspaceProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onSelectCharacter: (charId: string) => void;
  onUpdateScreenplay: (newText: string) => void;
  onOpenWriterModal: () => void;
}

type SecondRailTab = "scenes" | "characters" | "locations" | "story" | "revisions";

export const WriteWorkspace: React.FC<WriteWorkspaceProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onSelectCharacter,
  onUpdateScreenplay,
  onOpenWriterModal
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<SecondRailTab>("scenes");
  const [zoom, setZoom] = useState(100);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [themeMode, setThemeMode] = useState<"paper" | "night">("paper");

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const stats = useMemo(() => screenplayStats(project.screenplayText), [project.screenplayText]);
  const currentRev = project.revisions[0] || { color: "Blue", label: "Draft" };

  // Insert standard element prefix
  const insertElementPrefix = (prefix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentVal = textareaRef.current.value;
    const nextVal = currentVal.substring(0, start) + prefix + currentVal.substring(end);
    onUpdateScreenplay(nextVal);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start + prefix.length;
        textareaRef.current.selectionEnd = start + prefix.length;
      }
    }, 10);
  };

  // Jump to specific scene in textarea
  const jumpToScene = (sceneNum: number) => {
    onSelectScene(sceneNum);
    const scene = parsed.scenes.find((s) => s.number === sceneNum);
    if (scene && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = scene.start;
      textareaRef.current.selectionEnd = scene.end;
    }
  };

  // Detect cursor position in textarea to auto-detect character or scene clicks
  const handleTextareaClick = () => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;

    // Detect which scene contains the cursor
    for (const scene of parsed.scenes) {
      if (cursor >= scene.start && cursor <= scene.end) {
        if (scene.number !== selectedSceneNumber) {
          onSelectScene(scene.number);
        }
        break;
      }
    }

    // Detect if cursor is on a character line
    const textBefore = project.screenplayText.slice(0, cursor);
    const textAfter = project.screenplayText.slice(cursor);
    const currentLine = (textBefore.split("\n").pop() || "") + (textAfter.split("\n")[0] || "");
    const trimmed = currentLine.trim();

    // Check if trimmed matches any known character
    for (const [id, char] of Object.entries(project.characters)) {
      if (trimmed.toUpperCase() === char.name.toUpperCase() || trimmed.toUpperCase().startsWith(char.name.toUpperCase())) {
        onSelectCharacter(id);
        break;
      }
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none">
      {/* ============================================================ */}
      {/* CONTEXTUAL SECOND RAIL                                       */}
      {/* ============================================================ */}
      {!isFocusMode && (
        <nav aria-label="Write Mode Sub-navigation" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
          {/* Sub-nav Tabs Header */}
          <div className="flex border-b border-[#262C36] bg-[#12161D] p-1 gap-0.5 text-[11px] font-medium text-[#69717E]">
            <button
              onClick={() => setActiveSubTab("scenes")}
              className={`flex-1 py-1 rounded text-center transition-colors tracking-tight ${
                activeSubTab === "scenes" ? "bg-[#171C24] text-[#F0F2F5] font-semibold" : "hover:text-[#A0A7B2]"
              }`}
            >
              Scenes
            </button>
            <button
              onClick={() => setActiveSubTab("characters")}
              className={`flex-1 py-1 rounded text-center transition-colors tracking-tight ${
                activeSubTab === "characters" ? "bg-[#171C24] text-[#F0F2F5] font-semibold" : "hover:text-[#A0A7B2]"
              }`}
            >
              Cast
            </button>
            <button
              onClick={() => setActiveSubTab("locations")}
              className={`flex-1 py-1 rounded text-center transition-colors tracking-tight ${
                activeSubTab === "locations" ? "bg-[#171C24] text-[#F0F2F5] font-semibold" : "hover:text-[#A0A7B2]"
              }`}
            >
              Locs
            </button>
            <button
              onClick={() => setActiveSubTab("story")}
              className={`flex-1 py-1 rounded text-center transition-colors tracking-tight ${
                activeSubTab === "story" ? "bg-[#171C24] text-[#F0F2F5] font-semibold" : "hover:text-[#A0A7B2]"
              }`}
            >
              Story
            </button>
            <button
              onClick={() => setActiveSubTab("revisions")}
              className={`flex-1 py-1 rounded text-center transition-colors tracking-tight ${
                activeSubTab === "revisions" ? "bg-[#171C24] text-[#F0F2F5] font-semibold" : "hover:text-[#A0A7B2]"
              }`}
            >
              Revs
            </button>
          </div>

          {/* Sub-nav List Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            {/* 1. SCENES SUB-TAB */}
            {activeSubTab === "scenes" && (
              <>
                {parsed.scenes.map((scene) => {
                  const isSelected = selectedSceneNumber === scene.number;
                  const hasStaleStoryboard = project.storyboardSequences?.[scene.number]?.panels?.some(
                    (p: StoryboardPanel) => p.status === "OUTDATED"
                  );
                  return (
                    <button
                      key={scene.id}
                      onClick={() => jumpToScene(scene.number)}
                      className={`w-full text-left p-2 rounded transition-all flex flex-col ${
                        isSelected
                          ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5]"
                          : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold text-[#D49B54]">SCENE {scene.number}</span>
                        <div className="flex items-center space-x-1">
                          {hasStaleStoryboard && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" title="Stale storyboard panel" />
                          )}
                          <span className="text-[#69717E] uppercase">{scene.timeOfDay}</span>
                        </div>
                      </div>
                      <div className="truncate text-[11px] font-medium mt-0.5 tracking-tight">{scene.location}</div>
                    </button>
                  );
                })}
              </>
            )}

            {/* 2. CHARACTERS SUB-TAB */}
            {activeSubTab === "characters" && (
              <>
                {Object.entries(project.characters).map(([id, char]) => {
                  const count = stats.characterCounts[char.name.toUpperCase()] || 0;
                  return (
                    <button
                      key={id}
                      onClick={() => onSelectCharacter(id)}
                      className="w-full text-left p-2 rounded text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white uppercase text-xs tracking-tight">{char.name}</div>
                        <div className="text-[10px] text-[#69717E] capitalize">{char.role}</div>
                      </div>
                      <span className="font-mono text-[10px] text-[#69717E]">{count} cues</span>
                    </button>
                  );
                })}
              </>
            )}

            {/* 3. LOCATIONS SUB-TAB */}
            {activeSubTab === "locations" && (
              <>
                {Array.from(new Set(parsed.scenes.map((s) => s.location))).map((loc, i) => (
                  <div
                    key={i}
                    className="p-2 rounded text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D] flex items-center justify-between text-xs"
                  >
                    <span className="truncate">{loc}</span>
                    <span className="font-mono text-[10px] text-[#69717E]">
                      {parsed.scenes.filter((s) => s.location === loc).length} sc
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* 4. STORY / CANON SUB-TAB */}
            {activeSubTab === "story" && (
              <div className="space-y-2 p-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#69717E]">
                  Story Canon Facts ({project.canon?.length || 0})
                </div>
                {project.canon?.map((fact: CanonFact) => (
                  <div key={fact.id} className="p-2 rounded bg-[#12161D] border border-[#262C36] text-[11px]">
                    <div className="font-semibold text-[#D49B54] text-[10px] uppercase font-mono">{fact.category}</div>
                    <div className="text-[#F0F2F5] mt-0.5 leading-relaxed">{fact.statement}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. REVISIONS SUB-TAB */}
            {activeSubTab === "revisions" && (
              <div className="space-y-2 p-1">
                {project.revisions?.map((rev) => (
                  <div key={rev.id} className="p-2 rounded bg-[#12161D] border border-[#262C36] text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold text-[#D49B54]">{rev.color} Rev</span>
                      <span className="text-[#69717E]">{rev.createdAt.split("T")[0]}</span>
                    </div>
                    <div className="text-[#F0F2F5] font-medium">{rev.label}</div>
                    <div className="text-[10px] text-[#69717E] font-mono">{rev.summaryOfChanges}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}

      {/* ============================================================ */}
      {/* CENTRAL CREATIVE WORKSPACE                                   */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Screenplay Formatting & Utility Strip */}
        <div className="h-9 border-b border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[10px] font-mono text-[#69717E] uppercase mr-2 tracking-wider">Format:</span>
            {["INT. ", "EXT. ", "CHARACTER\n", "(beat)\n", "FADE OUT.\n\n"].map((el, idx) => (
              <button
                key={idx}
                onClick={() => insertElementPrefix(el)}
                className="px-2 py-0.5 rounded bg-[#12161D] hover:bg-[#171C24] text-[#A0A7B2] hover:text-[#F0F2F5] border border-[#262C36] text-[11px] font-mono transition-colors"
              >
                {el.trim() || "Action"}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Paper / Night Script Toggle */}
            <div className="flex items-center bg-[#12161D] p-0.5 rounded border border-[#262C36]">
              <button
                onClick={() => setThemeMode("paper")}
                className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  themeMode === "paper"
                    ? "bg-[#F3F0E8] text-[#161616] font-semibold shadow-sm"
                    : "text-[#69717E] hover:text-[#A0A7B2]"
                }`}
                title="Warm Physical Screenplay Paper (#F3F0E8)"
              >
                <Sun className="w-3 h-3" />
                <span>Paper</span>
              </button>
              <button
                onClick={() => setThemeMode("night")}
                className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  themeMode === "night"
                    ? "bg-[#171C24] text-[#D49B54] font-semibold shadow-sm"
                    : "text-[#69717E] hover:text-[#A0A7B2]"
                }`}
                title="Night Script Dark Room (#12161D)"
              >
                <Moon className="w-3 h-3" />
                <span>Night</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-[#12161D] px-2 py-0.5 rounded border border-[#262C36] font-mono text-[11px]">
              <button
                onClick={() => setZoom((z) => Math.max(80, z - 10))}
                className="text-[#69717E] hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-[#A0A7B2] font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(140, z + 10))}
                className="text-[#69717E] hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Focus Mode */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="text-[#69717E] hover:text-white p-1"
              title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Screenplay Page Container with Physical Studio Aesthetics */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#090B0E]">
          <div
            className={`w-full max-w-[820px] min-h-[1050px] rounded-sm p-14 flex flex-col transition-all duration-200 relative ${
              themeMode === "paper"
                ? "bg-[#F4F0E8] text-[#151618] border border-[#E0DCD2] shadow-2xl"
                : "bg-[#11141C] text-[#E6E9EE] border border-[#232936] shadow-2xl"
            }`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              boxShadow: themeMode === "paper"
                ? "0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 25px 40px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.08)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 25px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)"
            }}
          >
            {/* Hollywood Physical Script Header Strip */}
            <div
              className={`flex justify-between items-center text-[10px] font-courier uppercase tracking-widest pb-3 mb-6 select-none border-b ${
                themeMode === "paper" ? "text-[#7A756C] border-[#E0DCD2]" : "text-[#69717E] border-[#222735]"
              }`}
            >
              <span>{project.title}</span>
              <span>SCENE {selectedSceneNumber}</span>
              <span>{currentRev.color.toUpperCase()} REV. • PG. {selectedSceneNumber}.</span>
            </div>

            {/* Screenplay Content Area with True 12pt (15px) Hollywood Courier Metrics */}
            <textarea
              ref={textareaRef}
              value={project.screenplayText}
              onChange={(e) => onUpdateScreenplay(e.target.value)}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaClick}
              spellCheck={false}
              className={`w-full h-full flex-1 bg-transparent resize-none border-none outline-none font-courier text-[15px] select-text ${
                themeMode === "paper"
                  ? "text-[#151618] placeholder-[#8A857A]"
                  : "text-[#E6E9EE] placeholder-[#484E58]"
              }`}
              style={{
                fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
                lineHeight: "1.55",
                letterSpacing: "0.022em",
                fontWeight: 400
              }}
              placeholder="BEGIN SCREENPLAY (e.g. EXT. ROOFTOP - NIGHT)"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
