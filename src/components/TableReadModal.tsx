import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX, FastForward, RotateCcw, X, User } from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";
import { parseScreenplay } from "../../packages/screenplay-core/src/fountain";

interface TableReadModalProps {
  project: Project;
  onClose: () => void;
}

export const TableReadModal: React.FC<TableReadModalProps> = ({ project, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
  const activeLineRef = useRef<HTMLDivElement>(null);

  const parsed = parseScreenplay(project.screenplayText);
  const playableLines = parsed.lines.filter(
    (l) => l.kind === "dialogue" || l.kind === "action" || l.kind === "scene-heading"
  );

  // Load available system synthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
        if (v.length > 0) {
          // Assign initial distinct voices
          const assigned: Record<string, string> = {
            NARRATOR: v[0]?.name || "",
            MAYA: v[1]?.name || v[0]?.name || "",
            MARCUS: v[2]?.name || v[0]?.name || "",
            "DR. THORNE": v[3]?.name || v[0]?.name || ""
          };
          setCharacterVoices(assigned);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Play line logic
  const speakCurrentLine = (index: number) => {
    if (!("speechSynthesis" in window) || index >= playableLines.length) {
      setIsPlaying(false);
      return;
    }

    const line = playableLines[index];
    const textToSpeak =
      line.kind === "dialogue"
        ? line.text
        : line.kind === "scene-heading"
          ? `Scene. ${line.text}`
          : line.text;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speed;

    const speakerKey = line.speaker ? line.speaker.toUpperCase().trim() : "NARRATOR";
    const voiceName = characterVoices[speakerKey] || characterVoices.NARRATOR;
    if (voiceName) {
      const matched = availableVoices.find((v) => v.name === voiceName);
      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => {
      if (index + 1 < playableLines.length) {
        setCurrentLineIndex(index + 1);
      } else {
        setIsPlaying(false);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isPlaying) {
      speakCurrentLine(currentLineIndex);
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying, currentLineIndex]);

  // Scroll current line into view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipNext = () => {
    if (currentLineIndex + 1 < playableLines.length) {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentLineIndex(0);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-[#12141c] border border-[#272d3e] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[#222736] bg-[#0f1118] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-200">Table Read Studio</h2>
              <span className="text-[11px] text-slate-400">
                Synchronized line-by-line acoustic rehearsal with distinct persona voices
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="text-slate-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {/* Playback Controls Strip */}
        <div className="h-14 border-b border-[#222736] bg-[#151822] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={handleSkipNext}
              className="p-2 rounded-lg bg-[#1e2330] hover:bg-[#282f40] text-slate-300 transition-colors"
              title="Skip to next line"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-[#1e2330] hover:bg-[#282f40] text-slate-300 transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-400 ml-2">
              Line {currentLineIndex + 1} / {playableLines.length}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-medium">Speed:</span>
            {[0.8, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded font-mono font-medium ${
                  speed === s ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Script Display Surface with Active Highlighting */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 font-mono text-sm bg-[#0c0e14]">
          {playableLines.map((line, idx) => {
            const isActive = idx === currentLineIndex;
            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => setCurrentLineIndex(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-emerald-950/40 border border-emerald-500/50 text-white shadow-lg"
                    : "text-slate-400 hover:bg-[#161822] hover:text-slate-200 border border-transparent"
                }`}
              >
                {line.kind === "scene-heading" && (
                  <div className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">
                    {line.text}
                  </div>
                )}

                {line.speaker && (
                  <div className="font-bold text-emerald-300 text-xs tracking-wider mb-0.5">
                    {line.speaker.toUpperCase()}
                  </div>
                )}

                <div className="leading-relaxed whitespace-pre-wrap">{line.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
