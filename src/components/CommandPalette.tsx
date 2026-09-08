import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Sparkles,
  FileDown,
  Volume2,
  BookOpen,
  History,
  ShieldCheck,
  Package,
  Clapperboard,
  ArrowRight,
  Settings
} from "lucide-react";
import { Command } from "cmdk";
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
  onOpenDiagnostics?: () => void;
  onOpenJudgeTour?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  project,
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectScene,
  onOpenWriterModal,
  onOpenTableRead,
  onOpenExportModal,
  onOpenDiagnostics,
  onOpenJudgeTour
}) => {
  const [query, setQuery] = useState("");

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

  const characters = useMemo(() => {
    if (!query.trim()) return [];
    return Object.values(project.characters);
  }, [query, project.characters]);

  const canon = useMemo(() => {
    if (!query.trim()) return [];
    return project.canon;
  }, [query, project.canon]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        [cmdk-root] { max-width: 100%; }
        [cmdk-input] { width: 100%; }
        [cmdk-list] { max-height: 400px; overflow-y: auto; padding: 8px; }
        [cmdk-item] { cursor: pointer; border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; border: 1px solid transparent; transition: all 0.15s; }
        [cmdk-item][data-selected='true'] { background: rgba(212,155,84,0.12); border-color: rgba(212,155,84,0.3); color: white; }
        [cmdk-group-heading] { text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; color: #69717E; padding: 8px 12px 4px; font-weight: 600; }
        [cmdk-separator] { height: 1px; background: #262C36; margin: 4px 0; }
        [cmdk-empty] { padding: 24px; text-align: center; color: #69717E; font-size: 12px; }
      `}</style>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 select-none"
        onClick={onClose}
      >
        <div 
          className="bg-[#12161D] border border-[#262C36] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <Command label="Command Palette" shouldFilter={true}>
            <div className="h-14 border-b border-[#262C36] px-4 flex items-center space-x-3 bg-[#0D1015]">
              <Search className="w-5 h-5 text-[#A0A7B2]" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search..."
                className="bg-transparent text-sm text-[#F0F2F5] outline-none placeholder:text-[#69717E]"
              />
              <kbd className="text-[10px] bg-[#1a1d28] border border-[#2d3345] px-1.5 py-0.5 rounded text-slate-400 ml-auto">
                ESC
              </kbd>
            </div>
            
            <Command.List>
              <Command.Empty>No matching commands or project entities found.</Command.Empty>
              
              <Command.Group heading="Hackathon">
                <Command.Item 
                  onSelect={() => { onClose(); onOpenJudgeTour?.(); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Sparkles className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">⚡ Hackathon Judge Walkthrough (Interactive 1-Click Tour)</div>
                      <div className="text-[10px] text-slate-400 capitalize">Hackathon Evaluation</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
              </Command.Group>
              
              <Command.Separator />
              
              <Command.Group heading="AI Actions">
                <Command.Item 
                  onSelect={() => { onClose(); onOpenWriterModal(); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Sparkles className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Run Writer Agent on Current Scene</div>
                      <div className="text-[10px] text-slate-400 capitalize">AI Actions</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
                <Command.Item 
                  onSelect={() => { onClose(); onOpenTableRead(); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Volume2 className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Start Table Read Mode</div>
                      <div className="text-[10px] text-slate-400 capitalize">Audio</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
              </Command.Group>
              
              <Command.Separator />

              <Command.Group heading="Navigation">
                <Command.Item 
                  onSelect={() => { onClose(); onNavigateToTab("continuity"); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <ShieldCheck className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Inspect Continuity Issues</div>
                      <div className="text-[10px] text-slate-400 capitalize">Analysis</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
                <Command.Item 
                  onSelect={() => { onClose(); onNavigateToTab("actor-packets"); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Package className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">View Actor Packets & Sides</div>
                      <div className="text-[10px] text-slate-400 capitalize">Actors</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
                <Command.Item 
                  onSelect={() => { onClose(); onNavigateToTab("breakdown"); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Clapperboard className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Open 16-Category Production Breakdown</div>
                      <div className="text-[10px] text-slate-400 capitalize">Production</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
                <Command.Item 
                  onSelect={() => { onClose(); onNavigateToTab("story-bible"); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <BookOpen className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Open Story Bible & Canon</div>
                      <div className="text-[10px] text-slate-400 capitalize">Story</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
                <Command.Item 
                  onSelect={() => { onClose(); onNavigateToTab("revisions"); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <History className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Review Revision History & Diff</div>
                      <div className="text-[10px] text-slate-400 capitalize">Revisions</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
              </Command.Group>
              
              <Command.Separator />

              <Command.Group heading="Export">
                <Command.Item 
                  onSelect={() => { onClose(); onOpenExportModal(); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <FileDown className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Export Screenplay PDF (12pt Courier)</div>
                      <div className="text-[10px] text-slate-400 capitalize">Export</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
              </Command.Group>
              
              <Command.Separator />

              <Command.Group heading="Developer">
                <Command.Item 
                  onSelect={() => { onClose(); onOpenDiagnostics?.(); }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                      <Settings className="w-4 h-4 text-[#D49B54]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Developer Diagnostics & Model Routing</div>
                      <div className="text-[10px] text-slate-400 capitalize">Developer</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                </Command.Item>
              </Command.Group>

              {query.trim() !== "" && characters.length > 0 && (
                <>
                  <Command.Separator />
                  <Command.Group heading="Characters">
                    {characters.map((char) => (
                      <Command.Item
                        key={`char-${char.id}`}
                        value={`character ${char.name} ${char.biography} ${char.role}`}
                        onSelect={() => { onClose(); onNavigateToTab("actor-packets"); }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                            <BookOpen className="w-4 h-4 text-[#D49B54]" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">Character: {char.name} ({char.role})</div>
                            <div className="text-[10px] text-slate-400 capitalize">Characters</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}

              {query.trim() !== "" && canon.length > 0 && (
                <>
                  <Command.Separator />
                  <Command.Group heading="Canon">
                    {canon.map((fact) => (
                      <Command.Item
                        key={`fact-${fact.id}`}
                        value={`canon ${fact.title} ${fact.statement}`}
                        onSelect={() => { onClose(); onNavigateToTab("story-bible"); }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-[#1a1e2a] rounded-lg">
                            <BookOpen className="w-4 h-4 text-[#D49B54]" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">Canon: {fact.title}</div>
                            <div className="text-[10px] text-slate-400 capitalize">Story Bible</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}
            </Command.List>
          </Command>
        </div>
      </div>
    </>
  );
};
