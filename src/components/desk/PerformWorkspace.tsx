import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Mic,
  Volume2,
  Eye,
  EyeOff,
  FileDown,
  CircleDot
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { generateCharacterSidesPdf } from "../../../packages/export-engine/src/exportSides";

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
  const [takes, setTakes] = useState<{take: number, status: string, notes: string}[]>([]);

  const characterKeys = Object.keys(project.characters);
  const activeChar = project.characters[selectedCharacterId] || project.characters[characterKeys[0]];
  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const activeScene = parsed.scenes.find((s) => s.number === selectedSceneNumber) || parsed.scenes[0];

  const charLines = useMemo(() => {
    const lines = [];
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
        }
      ];
    }
    return lines;
  }, [parsed.lines, activeChar]);

  const currentLine = charLines[0] || {
    cueSpeaker: "ARJUN",
    cueLine: "You knew exactly why I came back.",
    dialogue: "I thought you'd forgotten me."
  };

  const handlePlayCueAudio = () => {
    if (!window.speechSynthesis) {
      toast.error("Audio cue playback is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentLine.cueLine);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleDownloadSidesPdf = () => {
    if (!activeChar) {
      toast.error("No active character selected.");
      return;
    }
    try {
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
      toast.success("Actor sides PDF exported");
    } catch (err) {
      toast.error("Failed to generate sides PDF");
    }
  };

  const handleRecordTake = () => {
    if (isRecording) {
      setIsRecording(false);
      setTakes(prev => [...prev, { take: takeNumber, status: "Reviewing", notes: "Good energy, clear enunciation." }]);
      setTakeNumber(t => t + 1);
      toast.success("Take saved and logged.");
    } else {
      setIsRecording(true);
      toast.info(`Recording Take ${takeNumber}...`);
      setTimeout(() => {
        setIsRecording(false);
        setTakes([{ take: takeNumber, status: "PRINT", notes: "Good energy." }, ...takes]);
        toast.success(`Take ${takeNumber} captured`);
      }, 2000);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none rounded-none text-sm">
      <nav aria-label="Cast Selector" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
        <div className="p-2 border-b border-[#262C36] bg-[#12161D] flex items-center justify-between text-[11px] font-semibold text-[#A0A7B2]">
          <span>CAST & ROLES</span>
          <span className="font-mono text-[10px] text-[#69717E]">{characterKeys.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {characterKeys.map((id) => {
            const char = project.characters[id];
            const isSelected = selectedCharacterId === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCharacter(id)}
                className={`w-full text-left px-2 py-1.5 rounded-sm transition-all flex flex-col ${
                  isSelected
                    ? "bg-[#171C24] border border-[#262C36] text-[#F0F2F5]"
                    : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
                }`}
              >
                <div className="flex items-center justify-between font-semibold uppercase text-[11px]">
                  <span>{char.name}</span>
                  <span className="font-mono text-[9px] text-[#69717E] capitalize">{char.role}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-[#262C36] bg-[#12161D]">
          <div className="text-[10px] font-mono text-[#69717E] uppercase mb-1">Active Scene:</div>
          <select
            value={selectedSceneNumber}
            onChange={(e) => onSelectScene(Number(e.target.value))}
            className="w-full bg-[#090B0E] border border-[#262C36] rounded-sm p-1 text-xs text-[#F0F2F5] font-mono outline-none"
          >
            {parsed.scenes.map((s) => (
              <option key={s.id} value={s.number}>
                S{s.number}: {s.location}
              </option>
            ))}
          </select>
        </div>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 bg-[#090B0E]">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#262C36] pb-3 mb-6">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-[#D49B54]/10 text-[#D49B54] font-bold border border-[#D49B54]/30">
                SCENE {selectedSceneNumber}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activeChar?.name || "MAYA"}
              </span>
              <span className="text-xs text-[#69717E] font-mono">•</span>
              <span className="font-mono text-xs text-[#A0A7B2]">TAKE {takeNumber}</span>
            </div>
            <button
              onClick={handleDownloadSidesPdf}
              className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-sm bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-[#D49B54] font-semibold transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Sides</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-12">
            <div className="text-center space-y-2">
              <div className="flex justify-center items-center space-x-2 text-[#69717E]">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] uppercase tracking-widest">{currentLine.cueSpeaker} (CUE)</span>
              </div>
              <p className="text-sm text-[#A0A7B2] italic font-editorial cursor-pointer hover:text-white transition-colors" onClick={handlePlayCueAudio}>
                "{currentLine.cueLine}"
              </p>
            </div>

            <div className="text-center relative">
               <div
                  onClick={() => setIsLineBlurred(!isLineBlurred)}
                  className="cursor-pointer group py-4 px-8 inline-block"
                >
                  <p
                    className={`text-5xl sm:text-6xl font-editorial tracking-tight leading-tight transition-all duration-300 ${
                      isLineBlurred
                        ? "filter blur-md select-none text-[#69717E] group-hover:blur-sm"
                        : "text-white"
                    }`}
                  >
                    "{currentLine.dialogue}"
                  </p>
                </div>
            </div>

            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => setIsLineBlurred(!isLineBlurred)}
                className="flex items-center space-x-2 px-4 py-2 rounded-sm bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] text-xs font-semibold text-[#A0A7B2] transition-colors"
              >
                {isLineBlurred ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{isLineBlurred ? "Reveal Line" : "Hide Line"}</span>
              </button>

              <button
                onClick={handleRecordTake}
                title="Toggle Recording"
                className={`flex items-center space-x-2 px-6 py-2 rounded-sm text-xs font-bold transition-all border ${
                  isRecording
                    ? "bg-[#F43F5E]/10 border-[#F43F5E]/50 text-[#F43F5E] animate-pulse"
                    : "bg-[#D49B54]/10 border-[#D49B54]/50 text-[#D49B54] hover:bg-[#D49B54]/20"
                }`}
              >
                {isRecording ? <CircleDot className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? "Stop Recording" : "Record Take"}</span>
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-[#262C36] pt-4">
            <h3 className="text-[10px] font-mono uppercase text-[#69717E] mb-2">Take Log</h3>
            <div className="border border-[#262C36] bg-[#0D1015] rounded-sm overflow-hidden h-32 overflow-y-auto">
              <table className="w-full text-left text-xs">
                 <thead className="bg-[#12161D] border-b border-[#262C36]">
                   <tr className="text-[10px] font-mono text-[#69717E] uppercase">
                     <th className="p-2 w-16 text-center">Take</th>
                     <th className="p-2 w-24">Status</th>
                     <th className="p-2">Notes</th>
                   </tr>
                 </thead>
                 <tbody>
                   {takes.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="p-4 text-center text-[#69717E] text-[11px] font-mono">
                         No takes recorded yet.
                       </td>
                     </tr>
                   ) : takes.map((t, i) => (
                     <tr key={i} className="border-b border-[#262C36]/50 hover:bg-[#12161D]">
                       <td className="p-2 text-center font-mono text-[#D49B54]">{t.take}</td>
                       <td className="p-2"><span className="px-1.5 py-0.5 rounded-sm bg-[#171C24] border border-[#262C36] text-[10px] font-mono text-[#A0A7B2]">{t.status}</span></td>
                       <td className="p-2 text-[#A0A7B2]">{t.notes}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
