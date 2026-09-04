import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  AlignLeft,
  User,
  MessageSquare,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Search,
  ListFilter
} from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";
import { parseScreenplay, screenplayStats } from "../../packages/screenplay-core/src/fountain";
import { paginateScreenplay } from "../../packages/screenplay-core/src/screenplayFormat";

interface ScreenplayEditorProps {
  project: Project;
  onUpdateScreenplay: (text: string) => void;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onOpenWriterModal: () => void;
}

export const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  project,
  onUpdateScreenplay,
  selectedSceneNumber,
  onSelectScene,
  onOpenWriterModal
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<"character" | "location" | null>(null);

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const stats = useMemo(() => screenplayStats(project.screenplayText), [project.screenplayText]);
  const pages = useMemo(() => paginateScreenplay(project.screenplayText), [project.screenplayText]);

  // Character and Location auto-complete lists from Story Bible and parsed text
  const knownCharacters = useMemo(() => {
    const list = new Set<string>();
    for (const c of Object.values(project.characters)) {
      list.add(c.name.toUpperCase());
    }
    for (const l of parsed.lines) {
      if (l.kind === "character" && l.speaker) list.add(l.speaker.toUpperCase());
    }
    return [...list].sort();
  }, [project.characters, parsed.lines]);

  const knownLocations = useMemo(() => {
    const list = new Set<string>();
    for (const s of parsed.scenes) {
      if (s.location) list.add(s.location.toUpperCase());
    }
    return [...list].sort();
  }, [parsed.scenes]);

  // Handle textarea text change & autocomplete detection
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onUpdateScreenplay(newText);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newText.slice(0, cursorPos);
    const lastLine = textBeforeCursor.split("\n").pop() || "";
    const trimmedLastLine = lastLine.trim().toUpperCase();

    if (
      trimmedLastLine.startsWith("INT.") ||
      trimmedLastLine.startsWith("EXT.") ||
      trimmedLastLine.startsWith("INT./EXT.") ||
      trimmedLastLine.startsWith("I/E.")
    ) {
      // Location autocomplete
      const prefixMatch = trimmedLastLine.replace(/^(INT\.\/EXT\.|I\/E\.|INT\.|EXT\.)\s*/, "");
      const matches = knownLocations.filter(
        (loc) => loc.startsWith(prefixMatch) && loc !== prefixMatch
      );
      if (matches.length > 0) {
        setAutocompleteSuggestions(matches.slice(0, 5));
        setSuggestionType("location");
        return;
      }
    } else if (trimmedLastLine.length >= 2 && trimmedLastLine === lastLine.trim() && !trimmedLastLine.includes(".")) {
      // Character autocomplete
      const matches = knownCharacters.filter(
        (char) => char.startsWith(trimmedLastLine) && char !== trimmedLastLine
      );
      if (matches.length > 0) {
        setAutocompleteSuggestions(matches.slice(0, 5));
        setSuggestionType("character");
        return;
      }
    }

    setAutocompleteSuggestions([]);
    setSuggestionType(null);
  };

  // Keyboard navigation & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (autocompleteSuggestions.length > 0) {
        applySuggestion(autocompleteSuggestions[0]);
        return;
      }

      // Tab smart element indent / cycle
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = project.screenplayText;
      const lines = currentText.slice(0, start).split("\n");
      const currentLine = lines[lines.length - 1];

      // If on empty line, Tab switches to Character cue indent
      if (!currentLine.trim()) {
        const replacement = "                  "; // Column 22 approx character tab
        const newDoc = currentText.slice(0, start) + replacement + currentText.slice(end);
        onUpdateScreenplay(newDoc);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + replacement.length;
        }, 0);
      }
    }

    // Ctrl+1 to Ctrl+7 formatting hotkeys
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "1") {
        e.preventDefault();
        insertElementPrefix("INT. ");
      } else if (e.key === "2") {
        e.preventDefault();
        // Action (remove leading spaces)
      } else if (e.key === "3") {
        e.preventDefault();
        insertElementPrefix("@");
      } else if (e.key === "4") {
        e.preventDefault();
        insertElementPrefix("(");
      }
    }
  };

  const applySuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = project.screenplayText.slice(0, cursorPos);
    const textAfter = project.screenplayText.slice(cursorPos);
    const lines = textBefore.split("\n");
    const lastLine = lines[lines.length - 1];

    let newLastLine = suggestion;
    if (suggestionType === "location") {
      const prefixMatch = lastLine.match(/^(INT\.\/EXT\.|I\/E\.|INT\.|EXT\.)\s*/i);
      const prefix = prefixMatch ? prefixMatch[0] : "INT. ";
      newLastLine = `${prefix}${suggestion} - DAY`;
    }

    lines[lines.length - 1] = newLastLine;
    const newDoc = lines.join("\n") + textAfter;
    onUpdateScreenplay(newDoc);
    setAutocompleteSuggestions([]);
    setSuggestionType(null);

    setTimeout(() => {
      textarea.focus();
      const newPos = lines.join("\n").length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }, 0);
  };

  const insertElementPrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newDoc = project.screenplayText.slice(0, start) + "\n" + prefix + project.screenplayText.slice(end);
    onUpdateScreenplay(newDoc);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + prefix.length + 1;
    }, 0);
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Format & Toolbar Strip */}
      <div className="h-10 border-b border-[#232730] bg-[#14161d] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-slate-400 mr-2 font-medium">Elements:</span>
          <button
            onClick={() => insertElementPrefix("INT. ")}
            className="px-2 py-1 bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 rounded border border-[#2d3445]"
            title="Scene Heading (Ctrl+1)"
          >
            Heading
          </button>
          <button
            onClick={() => insertElementPrefix("")}
            className="px-2 py-1 bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 rounded border border-[#2d3445]"
            title="Action block"
          >
            Action
          </button>
          <button
            onClick={() => insertElementPrefix("CHARACTER NAME\n")}
            className="px-2 py-1 bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 rounded border border-[#2d3445]"
            title="Character Cue (Ctrl+3)"
          >
            Character
          </button>
          <button
            onClick={() => insertElementPrefix("(beat)\n")}
            className="px-2 py-1 bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 rounded border border-[#2d3445]"
            title="Parenthetical (Ctrl+4)"
          >
            (Parenthetical)
          </button>
          <button
            onClick={() => insertElementPrefix("FADE TO BLACK.\n\n")}
            className="px-2 py-1 bg-[#1a1e28] hover:bg-[#252b3a] text-slate-200 rounded border border-[#2d3445]"
            title="Transition"
          >
            Transition
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-[#1a1e28] px-2 py-0.5 rounded border border-[#282e3e]">
            <button
              onClick={() => setZoom((z) => Math.max(80, z - 10))}
              className="text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300 font-mono w-9 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowNav(!showNav)}
            className={`px-2 py-1 rounded border flex items-center space-x-1 ${
              showNav
                ? "bg-[#252b3a] text-white border-[#3b445c]"
                : "bg-[#1a1e28] text-slate-400 border-[#282e3e]"
            }`}
            title="Toggle Scene & Cast Navigator"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navigator</span>
          </button>

          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="p-1 text-slate-400 hover:text-white"
            title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene & Character Navigator Sidebar */}
        {showNav && !isFocusMode && (
          <aside className="w-64 border-r border-[#232730] bg-[#111319] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#232730] text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>SCENE NAVIGATOR</span>
              <span className="text-[10px] bg-[#1c202b] text-slate-400 px-1.5 py-0.5 rounded">
                {parsed.scenes.length} Scenes
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {parsed.scenes.map((scene) => {
                const isSelected = selectedSceneNumber === scene.number;
                return (
                  <button
                    key={scene.id}
                    onClick={() => jumpToScene(scene.number)}
                    className={`w-full text-left p-2 rounded text-xs transition-all ${
                      isSelected
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#181b24] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>SCENE {scene.number}</span>
                      <span className="text-[10px] opacity-70">{scene.timeOfDay}</span>
                    </div>
                    <div className="truncate text-[11px] mt-0.5 opacity-90">{scene.location}</div>
                  </button>
                );
              })}
            </div>

            {/* Speaking Cast list in this project */}
            <div className="p-3 border-t border-[#232730] text-xs font-semibold text-slate-300">
              <span>CAST APPEARANCES</span>
            </div>
            <div className="max-h-36 overflow-y-auto px-2 pb-2 space-y-1 text-xs">
              {Object.entries(stats.characterCounts).map(([charName, count]) => (
                <div
                  key={charName}
                  className="flex items-center justify-between px-2 py-1 rounded bg-[#161922] text-slate-300 text-[11px]"
                >
                  <span className="font-medium truncate">{charName}</span>
                  <span className="text-slate-400 font-mono">{count} cues</span>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Central Editor Surface */}
        <main className="flex-1 flex justify-center overflow-y-auto p-6 bg-[#0a0b0e]">
          <div
            className="w-full max-w-[850px] bg-[#13151b] border border-[#272b38] shadow-2xl rounded-sm p-12 min-h-[900px] flex flex-col relative"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            {/* Industry Monospace Screenplay Textarea */}
            <textarea
              ref={textareaRef}
              value={project.screenplayText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full flex-1 bg-transparent text-[#e6e8ee] resize-none outline-none leading-relaxed border-none font-['Courier_Prime',Courier,monospace] text-base"
              style={{
                fontFamily: "'Courier Prime', Courier, monospace",
                fontSize: "14px",
                lineHeight: "22px"
              }}
            />

            {/* Autocomplete Suggestions Popup */}
            {autocompleteSuggestions.length > 0 && (
              <div className="absolute bottom-16 left-20 bg-[#1c202c] border border-amber-500/40 rounded shadow-2xl p-1 z-50 min-w-[200px]">
                <div className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1 border-b border-[#2d3445]">
                  {suggestionType === "location" ? "Location Autocomplete" : "Character Autocomplete"} (Tab)
                </div>
                {autocompleteSuggestions.map((sug, idx) => (
                  <button
                    key={sug}
                    onClick={() => applySuggestion(sug)}
                    className="w-full text-left px-2 py-1 text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-200 rounded font-mono"
                  >
                    {idx === 0 && <span className="text-amber-400 mr-1.5 font-bold">↵</span>}
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Screenplay Status & Metrics Bar */}
      <footer className="h-7 border-t border-[#232730] bg-[#111318] px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-4">
          <span>{stats.scenes} Scenes</span>
          <span>•</span>
          <span>{stats.words} Words</span>
          <span>•</span>
          <span>{stats.dialogueBlocks} Dialogue Cues</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">{stats.estimatedPages} Est. Pages (54-line standard)</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>Standard US Letter Courier 12pt</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Local Autosave Ready</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
