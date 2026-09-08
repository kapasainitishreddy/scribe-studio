import React, { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
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
  Moon,
  Clock,
  BarChart,
  CheckCircle2
} from "lucide-react";
import type { Project, StoryboardPanel, CanonFact } from "../../../packages/project-model/src/types";
import { parseScreenplay, screenplayStats } from "../../../packages/screenplay-core/src/fountain";
import { cinemaAudio } from "../../utils/cinemaAudio";

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

  const wordCount = project.screenplayText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedRuntimeMinutes = Math.max(1, Math.round(wordCount / 250));

  const insertElementPrefix = (prefix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentVal = textareaRef.current.value;
    const nextVal = currentVal.substring(0, start) + prefix + currentVal.substring(end);
    onUpdateScreenplay(nextVal);
    const formatLabel = prefix.trim() || "Action";
    toast.success(`${formatLabel} format inserted`);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start + prefix.length;
        textareaRef.current.selectionEnd = start + prefix.length;
      }
    }, 10);
  };

  const jumpToScene = (sceneNum: number) => {
    onSelectScene(sceneNum);
    const scene = parsed.scenes.find((s) => s.number === sceneNum);
    if (scene && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = scene.start;
      textareaRef.current.selectionEnd = scene.end;
    }
  };

  const handleTextareaClick = () => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;

    for (const scene of parsed.scenes) {
      if (cursor >= scene.start && cursor <= scene.end) {
        if (scene.number !== selectedSceneNumber) {
          onSelectScene(scene.number);
        }
        break;
      }
    }

    const textBefore = project.screenplayText.slice(0, cursor);
    const textAfter = project.screenplayText.slice(cursor);
    const currentLine = (textBefore.split("\n").pop() || "") + (textAfter.split("\n")[0] || "");
    const trimmed = currentLine.trim();

    for (const [id, char] of Object.entries(project.characters)) {
      if (trimmed.toUpperCase() === char.name.toUpperCase() || trimmed.toUpperCase().startsWith(char.name.toUpperCase())) {
        onSelectCharacter(id);
        break;
      }
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none">
      {!isFocusMode && (
        <nav aria-label="Write Mode Sub-navigation" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
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
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
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
          </div>
          
          <div className="border-t border-[#262C36] bg-[#0D1015] p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#A0A7B2]">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Word Count</span>
              <span className="font-mono font-medium text-[#F0F2F5]">{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[#A0A7B2]">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Est. Runtime</span>
              <span className="font-mono font-medium text-[#F0F2F5]">~{estimatedRuntimeMinutes} min</span>
            </div>
            <div className="flex justify-between items-center text-[#A0A7B2]">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Scene Status</span>
              <span className="font-mono font-medium text-[#F0F2F5] capitalize">In Progress</span>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="h-10 border-b border-[#262C36] bg-[#0D1015] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-[10px] font-semibold text-[#69717E] uppercase mr-2 tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D49B54]"/> Quick Format:
            </span>
            {["INT. ", "EXT. ", "CHARACTER\n", "(beat)\n", "FADE OUT.\n\n"].map((el, idx) => (
              <button
                key={idx}
                onClick={() => insertElementPrefix(el)}
                className="px-2.5 py-1 rounded-sm bg-[#12161D] hover:bg-[#171C24] text-[#A0A7B2] hover:text-[#F0F2F5] border border-[#262C36] text-[11px] font-mono transition-colors shadow-sm"
              >
                {el.trim() || "Action"}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center bg-[#12161D] p-0.5 rounded border border-[#262C36] shadow-inner">
              <button
                onClick={() => setThemeMode("paper")}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all ${
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
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all ${
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

            <div className="flex items-center space-x-1 bg-[#12161D] px-2 py-1 rounded border border-[#262C36] shadow-inner font-mono text-[11px]">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="text-[#69717E] hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-[#A0A7B2] font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="text-[#69717E] hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="text-[#69717E] hover:text-white p-1 rounded hover:bg-[#12161D]"
              title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-[#090B0E] relative shadow-inner">
          <div
            className={`w-full max-w-[850px] min-h-[1100px] p-16 flex flex-col transition-all duration-200 relative mx-auto ${
              themeMode === "paper"
                ? "bg-white text-[#111111]"
                : "bg-[#11141C] text-[#E6E9EE]"
            }`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              boxShadow: themeMode === "paper"
                ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 1px 0 rgba(0,0,0,0.2)"
                : "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3), 0 0 1px 0 rgba(255,255,255,0.1)"
            }}
          >
            <div
              className={`flex justify-between items-center text-[11px] uppercase tracking-widest pb-4 mb-8 select-none border-b ${
                themeMode === "paper" ? "text-[#555555] border-[#E5E5E5] font-courier" : "text-[#69717E] border-[#222735] font-courier"
              }`}
            >
              <span>{project.title}</span>
              <span>SCENE {selectedSceneNumber}</span>
              <span>{currentRev.color.toUpperCase()} REV. • PG. {selectedSceneNumber}.</span>
            </div>

            <textarea
              ref={textareaRef}
              value={project.screenplayText}
              onChange={(e) => onUpdateScreenplay(e.target.value)}
              onKeyDown={(e) => {
                if (!e.ctrlKey && !e.metaKey && e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
                  cinemaAudio.playTypewriterClick();
                }
              }}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaClick}
              spellCheck={false}
              className={`w-full h-full flex-1 bg-transparent resize-none border-none outline-none font-courier select-text ${
                themeMode === "paper"
                  ? "text-[#111111] placeholder-[#AAAAAA]"
                  : "text-[#E6E9EE] placeholder-[#484E58]"
              }`}
              style={{
                fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
                fontSize: "12pt",
                lineHeight: "1.2",
                letterSpacing: "0px",
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
