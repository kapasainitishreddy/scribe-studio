import React, { useState, useMemo, useEffect } from "react";
import {
  Mic,
  Volume2,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  CheckCircle2,
  FileDown,
  Sparkles,
  HelpCircle
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { generateCharacterSidesPdf, generateCharacterSidesText } from "../../../packages/export-engine/src/exportSides";

interface PerformWorkspaceProps {
  project: Project;
  selectedCharacterId: string;
  onSelectCharacter: (charId: string) => void;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onRegeneratePacket: (charId: string) => void;
}

export const PerformWorkspace: React.FC<PerformWorkspaceProps> = ({
  project,
  selectedCharacterId,
  onSelectCharacter,
  selectedSceneNumber,
  onSelectScene,
  onRegeneratePacket
}) => {
  const [takeNumber, setTakeNumber] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isLineBlurred, setIsLineBlurred] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const characterKeys = Object.keys(project.characters);
  const activeChar = project.characters[selectedCharacterId] || project.characters[characterKeys[0]];
  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const activeScene = parsed.scenes.find((s) => s.number === selectedSceneNumber) || parsed.scenes[0];

  // Find dialogue lines for this character in this scene
  const charLines = useMemo(() => {
    const lines: { cueSpeaker: string; cueLine: string; dialogue: string }[] = [];
    let lastSpeaker = "";
    let lastDialogue = "";

    for (const l of parsed.lines) {
      if (l.kind === "character" && l.speaker) {
        lastSpeaker = l.speaker;
      } else if (l.kind === "dialogue" && l.text) {
        if (activeChar && lastSpeaker.toUpperCase() === activeChar.name.toUpperCase()) {
          lines.push({
            cueSpeaker: "ARJUN",
            cueLine: lastDialogue || "You knew exactly why I came back.",
            dialogue: l.text
          });
        }
        lastDialogue = l.text;
      }
    }

    if (lines.length === 0) {
      return [
        {
          cueSpeaker: "ARJUN",
          cueLine: "You knew exactly why I came back.",
          dialogue: "I thought you'd forgotten me."
        },
        {
          cueSpeaker: "ARJUN",
          cueLine: "Some things don't stay buried in Hyderabad.",
          dialogue: "Then you shouldn't have dug them up."
        }
      ];
    }
    return lines;
  }, [parsed.lines, activeChar]);

  const currentLineIndex = 0;
  const currentLine = charLines[currentLineIndex] || {
    cueSpeaker: "ARJUN",
    cueLine: "You knew exactly why I came back.",
    dialogue: "I thought you'd forgotten me."
  };

  // Play audio cue using browser speech synthesis
  const handlePlayCueAudio = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentLine.cueLine);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Download Sides PDF
  const handleDownloadSidesPdf = () => {
    if (!activeChar) return;
    const pdfBytes = generateCharacterSidesPdf(project.screenplayText, {
      characterName: activeChar.name,
      projectTitle: project.title,
      includePrecedingCues: true
    });
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}_${activeChar.name}_SIDES.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess("Sides PDF generated!");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none">
      {/* ============================================================ */}
      {/* LEFT SECOND RAIL: ACTOR / CHARACTER SELECTOR                */}
      {/* ============================================================ */}
      <nav aria-label="Cast Selector" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
        <div className="p-2.5 border-b border-[#262C36] bg-[#12161D] flex items-center justify-between text-xs font-semibold text-[#A0A7B2]">
          <span>CAST & ROLES</span>
          <span className="font-mono text-[10px] text-[#69717E]">{characterKeys.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
          {characterKeys.map((id) => {
            const char = project.characters[id];
            const isSelected = selectedCharacterId === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCharacter(id)}
                className={`w-full text-left p-2 rounded transition-all flex flex-col ${
                  isSelected
                    ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5]"
                    : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
                }`}
              >
                <div className="flex items-center justify-between font-semibold uppercase text-xs">
                  <span>{char.name}</span>
                  <span className="font-mono text-[10px] text-[#69717E] capitalize">{char.role}</span>
                </div>
                <div className="text-[11px] text-[#69717E] truncate mt-0.5">
                  {char.dramaticObjective || "Uncover truth"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scene Selector inside Perform */}
        <div className="p-2 border-t border-[#262C36] bg-[#12161D]">
          <div className="text-[10px] font-mono text-[#69717E] uppercase mb-1">Active Scene:</div>
          <select
            value={selectedSceneNumber}
            onChange={(e) => onSelectScene(Number(e.target.value))}
            className="w-full bg-[#0D1015] border border-[#262C36] rounded p-1 text-xs text-[#F0F2F5] font-mono outline-none"
          >
            {parsed.scenes.map((s) => (
              <option key={s.id} value={s.number}>
                Scene {s.number}: {s.location}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* CENTER: REHEARSAL STUDIO ROOM TELEPROMPTER                   */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden justify-between p-8 bg-[#090B0E]">
        <div className="max-w-3xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-center">
          {/* Header Strip: SCENE 18 • MAYA • TAKE 4 */}
          <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#D49B54]/20 text-[#D49B54] font-bold">
                SCENE {selectedSceneNumber}
              </span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {activeChar?.name || "MAYA"}
              </span>
              <span className="text-xs text-[#69717E] font-mono">•</span>
              <span className="font-mono text-xs text-[#A0A7B2]">TAKE {takeNumber}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTakeNumber((t) => t + 1)}
                className="text-xs font-mono px-2 py-1 rounded bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-[#A0A7B2]"
                title="Increment Take"
              >
                + Next Take
              </button>
              <button
                onClick={handleDownloadSidesPdf}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-[#D49B54]"
                title="Download Actor Sides"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Sides PDF</span>
              </button>
            </div>
          </div>

          {/* Preceding Cue Box */}
          <div className="p-4 rounded-xl bg-[#12161D] border border-[#262C36] space-y-1">
            <div className="flex items-center justify-between text-xs text-[#69717E]">
              <span className="font-mono uppercase font-bold tracking-wider text-[#A0A7B2]">
                {currentLine.cueSpeaker} (PREVIOUS CUE)
              </span>
              <button
                onClick={handlePlayCueAudio}
                disabled={isPlayingAudio}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#171C24] hover:bg-[#202736] text-[#D49B54] text-[11px] font-mono transition-colors"
                title="Speak Cue Line"
              >
                <Volume2 className="w-3 h-3" />
                <span>{isPlayingAudio ? "Speaking..." : "Hear Cue"}</span>
              </button>
            </div>
            <p className="text-lg text-[#A0A7B2] italic font-editorial leading-relaxed">
              "{currentLine.cueLine}"
            </p>
          </div>

          {/* Actor's Line with Interactive Line-Blur Memorization */}
          <div className="p-8 rounded-2xl bg-[#10131B] border border-[#262C36] shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#D49B54]">
                Your Rehearsal Cue ({activeChar?.name})
              </div>

              {/* Blurred / Revealed Dialogue */}
              <div
                onClick={() => setIsLineBlurred(!isLineBlurred)}
                className="cursor-pointer py-4 group"
                title="Click or tap to reveal/blur line"
              >
                <p
                  className={`text-3xl sm:text-4xl font-editorial tracking-tight leading-snug transition-all duration-300 ${
                    isLineBlurred
                      ? "filter blur-md select-none text-[#A0A7B2] group-hover:blur-sm"
                      : "text-white"
                  }`}
                >
                  "{currentLine.dialogue}"
                </p>
              </div>
            </div>

            {/* Rehearsal Controls */}
            <div className="flex items-center justify-center space-x-4 pt-2">
              <button
                onClick={() => setIsLineBlurred(!isLineBlurred)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-xs font-semibold text-[#F0F2F5] transition-all"
              >
                {isLineBlurred ? <Eye className="w-4 h-4 text-[#D49B54]" /> : <EyeOff className="w-4 h-4 text-[#69717E]" />}
                <span>{isLineBlurred ? "Reveal Line" : "Hide for Memorization"}</span>
              </button>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${
                  isRecording
                    ? "bg-[#F43F5E] text-white animate-pulse"
                    : "bg-[#D49B54] hover:bg-[#E3AF69] text-black"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? "Stop Take" : "Record Take"}</span>
              </button>
            </div>
          </div>

          {/* Emotional & Motivational HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36]">
              <div className="text-[10px] font-mono text-[#69717E] uppercase">Objective</div>
              <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">Make him admit it</div>
            </div>
            <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36]">
              <div className="text-[10px] font-mono text-[#69717E] uppercase">Obstacle</div>
              <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">Pride & fear</div>
            </div>
            <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36]">
              <div className="text-[10px] font-mono text-[#69717E] uppercase">Subtext</div>
              <div className="text-xs font-semibold text-[#D49B54] mt-0.5">"Don't leave me."</div>
            </div>
            <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36]">
              <div className="text-[10px] font-mono text-[#69717E] uppercase">Emotion</div>
              <div className="text-xs font-semibold text-[#F0F2F5] mt-0.5">Anger masking fear</div>
            </div>
          </div>
        </div>

        {downloadSuccess && (
          <div className="fixed bottom-12 right-6 p-3 rounded-lg bg-[#10B981] text-black font-semibold text-xs shadow-xl animate-fade-in">
            {downloadSuccess}
          </div>
        )}
      </main>
    </div>
  );
};
