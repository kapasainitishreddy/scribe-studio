import React, { useState } from "react";
import { Mic, Sparkles, Plus, Check, StickyNote as NoteIcon, RefreshCw } from "lucide-react";
import type { Project, StickyNote } from "../../packages/project-model/src/types";
import { processMeetingTranscript } from "../../packages/agent-runtime/src/scribeAgent";

interface MeetingScribeModalProps {
  project: Project;
  onClose: () => void;
  onAddStickyNotes: (notes: StickyNote[]) => void;
}

export const MeetingScribeModal: React.FC<MeetingScribeModalProps> = ({
  project,
  onClose,
  onAddStickyNotes
}) => {
  const [transcript, setTranscript] = useState(
    `Director: In Scene 1, let's delay Maya telling Marcus about Elena's encryption key until the docks.
Writer: Agreed. That makes the twist at the end of the escape much more impactful.
Sound Designer: For the helipad sequence, we need 40-knot storm wind machines and high-frequency rain splash.
Producer: Make sure we schedule the drainage flume jump on the stunt stage with safety rigs.`
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedNotes, setExtractedNotes] = useState<StickyNote[]>([]);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const notes = await processMeetingTranscript({
        project,
        transcriptText: transcript
      });
      setExtractedNotes(notes);
    } catch (e) {
      console.error("Scribe extraction failed:", e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = () => {
    onAddStickyNotes(extractedNotes);
    onClose();
  };
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none"
    >
      <div className="bg-[#13151f] border border-[#272d3e] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[#232838] bg-[#10121a] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-sky-600/20 border border-sky-500/30 rounded-lg text-sky-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Scribe Meeting & Table Read Assistant</h2>
              <p className="text-[11px] text-slate-400">
                Turns spoken table-read discussions and meeting audio into structured corkboard sticky notes.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Paste Meeting / Audio Transcript:
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              className="w-full bg-[#181b26] border border-[#292f42] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              {isExtracting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isExtracting ? "Extracting Notes..." : "Extract Structured Sticky Notes"}</span>
            </button>
          </div>

          {/* Extracted Notes Preview */}
          {extractedNotes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Extracted Action Items & Sticky Notes ({extractedNotes.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extractedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-[#181712] border-t-2 border-amber-500 border border-[#2e2a20] rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{note.title}</span>
                      <span className="text-[10px] bg-amber-950/60 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono">
                        {note.type}
                      </span>
                    </div>
                    <p className="text-amber-100/80 text-[11px] leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {extractedNotes.length > 0 && (
          <div className="h-14 border-t border-[#232838] bg-[#10121a] px-6 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {extractedNotes.length} notes will be added to your Corkboard.
            </span>
            <button
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Add All Notes to Corkboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
