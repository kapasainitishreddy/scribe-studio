import React, { useState } from "react";
import { LayoutGrid, Plus, Tag, StickyNote as NoteIcon, Film } from "lucide-react";
import type { CorkboardCard, Project, StickyNote } from "../../packages/project-model/src/types";

interface CorkboardPanelProps {
  project: Project;
  onUpdateCards: (cards: CorkboardCard[]) => void;
  onSelectScene: (sceneNum: number) => void;
}

export const CorkboardPanel: React.FC<CorkboardPanelProps> = ({
  project,
  onUpdateCards,
  onSelectScene
}) => {
  const [activeAct, setActiveAct] = useState<number | "all">("all");

  const cards = project.corkboardCards.filter((c) => activeAct === "all" || c.act === activeAct);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-[#232730] bg-[#12141c] px-6 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <LayoutGrid className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200">VISUAL CORKBOARD STUDIO</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#181b25] p-0.5 rounded border border-[#272c3d]">
          {[
            { id: "all", label: "All Acts" },
            { id: 1, label: "Act I (Setup)" },
            { id: 2, label: "Act II (Conflict)" },
            { id: 3, label: "Act III (Climax)" }
          ].map((act) => (
            <button
              key={act.id}
              onClick={() => setActiveAct(act.id as any)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeAct === act.id ? "bg-[#252b3c] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-[#141620] border border-[#262b3a] hover:border-[#384157] rounded-xl p-4 shadow-lg flex flex-col justify-between transition-all"
              style={{ borderTopColor: card.color, borderTopWidth: "3px" }}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-[#202434]">
                  <span className="font-mono font-bold text-amber-400">
                    {card.sceneNumber ? `SCENE ${card.sceneNumber}` : `ACT ${card.act}`}
                  </span>
                  <span className="capitalize text-[10px] bg-[#1a1d28] px-1.5 py-0.5 rounded font-mono">
                    {card.type}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 mt-2">{card.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.synopsis}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#202434] flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-[#1a1e2a] text-slate-400 px-1.5 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {card.sceneNumber && (
                  <button
                    onClick={() => onSelectScene(card.sceneNumber!)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Jump ↗
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Scribe Meeting Notes Sticky Cards */}
          {project.meetingNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[#1a1914] border-t-4 border-amber-500 border border-[#2b271f] rounded-xl p-4 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-amber-400 pb-2 border-b border-[#2d281f]">
                  <span className="font-bold uppercase tracking-wider flex items-center space-x-1">
                    <NoteIcon className="w-3 h-3" />
                    <span>SCRIBE NOTE</span>
                  </span>
                  <span className="capitalize bg-amber-950/60 px-1.5 py-0.5 rounded">
                    {note.type}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-amber-200 mt-2">{note.title}</h4>
                <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">{note.content}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#2d281f] text-[10px] text-amber-400/70 flex items-center justify-between">
                <span>By: {note.speaker || "Table Read"}</span>
                {note.sceneNumber && <span>Scene {note.sceneNumber}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
