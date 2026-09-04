import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Film,
  Sparkles,
  FileDown,
  Volume2,
  BookOpen,
  History,
  ShieldCheck,
  Package,
  Clapperboard,
  ArrowRight
} from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";

interface CommandPaletteProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
  onSelectScene: (sceneNum: number) => void;
  onOpenWriterModal: () => void;
  onOpenTableRead: () => void;
  onOpenExportModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  project,
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectScene,
  onOpenWriterModal,
  onOpenTableRead,
  onOpenExportModal
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K hotkey
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Standard commands
  const defaultCommands = useMemo(
    () => [
      {
        id: "cmd-writer",
        title: "Run Writer Agent on Current Scene",
        category: "AI Actions",
        icon: Sparkles,
        action: () => {
          onClose();
          onOpenWriterModal();
        }
      },
      {
        id: "cmd-table-read",
        title: "Start Table Read Mode",
        category: "Audio",
        icon: Volume2,
        action: () => {
          onClose();
          onOpenTableRead();
        }
      },
      {
        id: "cmd-export-pdf",
        title: "Export Screenplay PDF (12pt Courier)",
        category: "Export",
        icon: FileDown,
        action: () => {
          onClose();
          onOpenExportModal();
        }
      },
      {
        id: "cmd-continuity",
        title: "Inspect Continuity Issues",
        category: "Analysis",
        icon: ShieldCheck,
        action: () => {
          onClose();
          onNavigateToTab("continuity");
        }
      },
      {
        id: "cmd-actor-packets",
        title: "View Actor Packets & Sides",
        category: "Actors",
        icon: Package,
        action: () => {
          onClose();
          onNavigateToTab("actor-packets");
        }
      },
      {
        id: "cmd-breakdown",
        title: "Open 16-Category Production Breakdown",
        category: "Production",
        icon: Clapperboard,
        action: () => {
          onClose();
          onNavigateToTab("breakdown");
        }
      },
      {
        id: "cmd-story-bible",
        title: "Open Story Bible & Canon",
        category: "Story",
        icon: BookOpen,
        action: () => {
          onClose();
          onNavigateToTab("story-bible");
        }
      },
      {
        id: "cmd-revisions",
        title: "Review Revision History & Diff",
        category: "Revisions",
        icon: History,
        action: () => {
          onClose();
          onNavigateToTab("revisions");
        }
      }
    ],
    [onClose, onOpenWriterModal, onOpenTableRead, onOpenExportModal, onNavigateToTab]
  );

  // Search results across project objects
  const filteredItems = useMemo(() => {
    if (!query.trim()) return defaultCommands;

    const lower = query.toLowerCase();
    const results: any[] = [];

    // Commands match
    for (const cmd of defaultCommands) {
      if (cmd.title.toLowerCase().includes(lower)) {
        results.push(cmd);
      }
    }

    // Characters match
    for (const char of Object.values(project.characters)) {
      if (char.name.toLowerCase().includes(lower) || char.biography.toLowerCase().includes(lower)) {
        results.push({
          id: `char-${char.id}`,
          title: `Character: ${char.name} (${char.role})`,
          category: "Characters",
          icon: BookOpen,
          action: () => {
            onClose();
            onNavigateToTab("actor-packets");
          }
        });
      }
    }

    // Canon facts match
    for (const fact of project.canon) {
      if (fact.title.toLowerCase().includes(lower) || fact.statement.toLowerCase().includes(lower)) {
        results.push({
          id: `fact-${fact.id}`,
          title: `Canon: ${fact.title}`,
          category: "Story Bible",
          icon: BookOpen,
          action: () => {
            onClose();
            onNavigateToTab("story-bible");
          }
        });
      }
    }

    return results;
  }, [query, defaultCommands, project.characters, project.canon, onClose, onNavigateToTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4 select-none">
      <div className="bg-[#141622] border border-[#2c3347] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="h-14 border-b border-[#252b3c] px-4 flex items-center space-x-3 bg-[#11131b]">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search characters, canon, scenes, dialogue..."
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
          <kbd className="text-[10px] bg-[#1a1d28] border border-[#2d3345] px-1.5 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching commands or project entities found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon || Film;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-600/20 to-indigo-600/20 text-white border border-amber-500/30"
                      : "text-slate-300 hover:bg-[#1a1e2b] border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg text-slate-300">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{item.title}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{item.category}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
