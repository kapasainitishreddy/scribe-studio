import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Globe,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Search,
  Loader2
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { CallSheetView } from "./CallSheetView";

interface ProduceWorkspaceProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onResolveIssue: (issueId: string) => void;
  onToggleBreakdownLock: (elementId: string) => void;
  onRunParallelResearch: (query: string) => Promise<any>;
}

type ProduceSubTab = "continuity" | "breakdown" | "research" | "schedule";

export const ProduceWorkspace: React.FC<ProduceWorkspaceProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onResolveIssue,
  onToggleBreakdownLock,
  onRunParallelResearch
}) => {
  const [subTab, setSubTab] = useState<ProduceSubTab>("breakdown");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);

  // Breakdown categorization
  const breakdownElements = project.breakdown?.elements || [];
  const categorizedElements = useMemo(() => {
    const acc: Record<string, typeof breakdownElements> = {};
    breakdownElements.forEach(el => {
      const cat = el.category.toUpperCase();
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(el);
    });
    return acc;
  }, [breakdownElements]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const continuityTimeline = [
    {
      element: "Maya Jacket",
      category: "Wardrobe",
      states: [
        { scene: "S12", value: "BLACK", status: "ok" },
        { scene: "S18", value: "BLACK", status: "ok" },
        { scene: "S22", value: "RED", status: "warning", issueId: "c-jacket" },
        { scene: "S29", value: "RED", status: "ok" }
      ],
      conflict: "Continuity conflict: Scene 18 ends with Maya in black leather jacket. Scene 22 begins with red trench coat."
    }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || isSearching) return;
    setIsSearching(true);
    try {
      await onRunParallelResearch(query);
      setSearchQuery("");
      toast.success(`Ground Truth verified for "${query}"`);
    } catch {
      toast.error("Failed to perform ground-truth research");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none text-sm rounded-none">
      <nav aria-label="Production Navigation" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
        <div className="p-2 border-b border-[#262C36] bg-[#12161D] flex items-center justify-between text-[11px] font-semibold text-[#A0A7B2]">
          <span>PRODUCTION</span>
          <span className="font-mono text-[#D49B54] uppercase">Desk</span>
        </div>
        <div className="p-2 space-y-0.5 text-xs">
          {[
            { id: "breakdown", label: "Production Breakdown", count: breakdownElements.length },
            { id: "continuity", label: "Continuity Matrix", count: project.continuityIssues?.length || 0 },
            { id: "research", label: "Parallel Ground Truth", count: project.researchFindings?.length || 0 },
            { id: "schedule", label: "Budget & Schedule", count: "Est" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as ProduceSubTab)}
              className={`w-full text-left px-2 py-1.5 rounded-sm transition-all flex items-center justify-between ${
                subTab === tab.id
                  ? "bg-[#171C24] border border-[#262C36] text-[#F0F2F5] font-semibold"
                  : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono text-[#69717E]">{tab.count}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 flex h-full overflow-hidden bg-[#090B0E]">
        {subTab === "breakdown" && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#262C36] pb-2 mb-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Production Breakdown</h2>
              <span className="text-xs font-mono text-[#D49B54]">{breakdownElements.length} Elements</span>
            </div>
            
            {breakdownElements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FolderOpen className="w-12 h-12 text-[#262C36] mb-4" />
                <h3 className="text-sm font-semibold text-[#F0F2F5] mb-2">No Breakdown Elements Found</h3>
                <p className="text-xs text-[#A0A7B2] max-w-md mb-4">Run the AI breakdown to automatically extract props, wardrobe, cast, and special effects from the screenplay.</p>
                <button className="px-4 py-2 bg-[#D49B54] text-black text-xs font-bold rounded-sm hover:bg-[#E3AF69] transition-colors">
                  Run AI Breakdown
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto border border-[#262C36] bg-[#0D1015] rounded-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#262C36] bg-[#12161D] text-[10px] font-mono text-[#69717E] uppercase">
                      <th className="p-2 w-16">Scene</th>
                      <th className="p-2 w-48">Element</th>
                      <th className="p-2">Notes</th>
                      <th className="p-2 w-24 text-center">Status</th>
                      <th className="p-2 w-16 text-center">Lock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categorizedElements).map(([category, items]) => {
                      const isExpanded = expandedCategories[category] !== false;
                      return (
                        <React.Fragment key={category}>
                          <tr className="border-y border-[#262C36] bg-[#171C24] hover:bg-[#202736] cursor-pointer" onClick={() => toggleCategory(category)}>
                            <td colSpan={5} className="p-1.5 px-2">
                              <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-[#F0F2F5]">
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-[#A0A7B2]" /> : <ChevronRight className="w-3 h-3 text-[#A0A7B2]" />}
                                <span>{category}</span>
                                <span className="text-[#69717E] px-1.5 py-0.5 rounded-sm bg-[#090B0E]">{items.length}</span>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && items.map(el => (
                            <tr key={el.id} className="border-b border-[#262C36]/50 bg-[#090B0E] hover:bg-[#12161D] transition-colors">
                              <td className="p-2 font-mono text-[#D49B54]">S{el.sceneNumber}</td>
                              <td className="p-2 font-medium text-white">{el.name}</td>
                              <td className="p-2 text-[#A0A7B2] truncate max-w-xs">{el.notes || "—"}</td>
                              <td className="p-2 text-center">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#171C24] text-[#A0A7B2] border border-[#262C36]">
                                  {el.locked ? "LOCKED" : "REVIEW"}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleBreakdownLock(el.id);
                                  }}
                                  className="text-[#69717E] hover:text-[#F0F2F5]"
                                >
                                  {el.locked ? <Lock className="w-3.5 h-3.5 text-[#D49B54] mx-auto" /> : <Unlock className="w-3.5 h-3.5 mx-auto" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {subTab === "research" && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col p-4 border-r border-[#262C36]">
               <div className="flex items-center justify-between border-b border-[#262C36] pb-2 mb-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-tight">Parallel Ground Truth</h2>
               </div>
               {(!project.researchFindings || project.researchFindings.length === 0) ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-[#A0A7B2]">
                   <Globe className="w-10 h-10 mb-3 text-[#262C36]" />
                   <p className="text-xs">No active research findings. Query the knowledge base.</p>
                 </div>
               ) : (
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                   {project.researchFindings.map(finding => (
                     <div key={finding.id} className="p-3 bg-[#12161D] border border-[#262C36] rounded-sm">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-semibold text-white">{finding.query}</span>
                         <span className="text-[10px] font-mono text-[#0EA5E9]">
                           {finding.confidence ? `${Math.round(finding.confidence * 100)}%` : "VERIFIED"}
                         </span>
                       </div>
                       <p className="text-xs text-[#A0A7B2]">{finding.summary}</p>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            {/* Sidebar Inspector */}
            <div className="w-72 bg-[#0D1015] flex flex-col p-4">
              <h3 className="text-xs font-mono uppercase text-[#A0A7B2] mb-3 flex items-center"><Search className="w-3 h-3 mr-2" /> Research Inspector</h3>
              <form onSubmit={handleSearch} className="flex flex-col gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Verify fact..."
                  className="bg-[#12161D] border border-[#262C36] rounded-sm px-2 py-1.5 text-xs text-white placeholder-[#69717E] outline-none focus:border-[#D49B54]"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-3 py-1.5 bg-[#D49B54] hover:bg-[#E3AF69] text-black font-bold text-xs rounded-sm transition-colors flex items-center justify-center"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Verify</span>}
                </button>
              </form>
              <div className="flex-1 p-3 border border-[#262C36] border-dashed rounded-sm flex items-center justify-center text-center">
                 <p className="text-[10px] text-[#69717E] uppercase font-mono">Select a finding to inspect sources and confidence metrics.</p>
              </div>
            </div>
          </div>
        )}

        {subTab === "continuity" && (
           <div className="flex-1 flex flex-col p-4 overflow-hidden">
             <div className="flex items-center justify-between border-b border-[#262C36] pb-2 mb-4">
               <h2 className="text-sm font-bold text-white uppercase tracking-tight">Continuity Matrix</h2>
             </div>
             <div className="border border-[#262C36] rounded-sm overflow-hidden bg-[#0D1015]">
               <table className="w-full text-left text-xs">
                 <thead className="bg-[#12161D] border-b border-[#262C36]">
                   <tr className="text-[10px] font-mono text-[#69717E] uppercase">
                     <th className="p-2 w-48">Element</th>
                     <th className="p-2 text-center">S12</th>
                     <th className="p-2 text-center">S18</th>
                     <th className="p-2 text-center">S22</th>
                     <th className="p-2 text-center">S29</th>
                   </tr>
                 </thead>
                 <tbody>
                   {continuityTimeline.map((item, idx) => (
                     <tr key={idx} className="border-b border-[#262C36]/50">
                       <td className="p-2">
                         <div className="font-semibold text-white">{item.element}</div>
                         <div className="text-[10px] text-[#A0A7B2] font-mono">{item.category}</div>
                       </td>
                       {item.states.map((st, i) => (
                         <td key={i} className="p-2 text-center">
                           <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${st.status === 'warning' ? 'bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30' : 'bg-[#171C24] text-[#A0A7B2] border-[#262C36]'}`}>
                             {st.value}
                           </span>
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {subTab === "schedule" && (
          <div className="flex-1 overflow-y-auto">
            <CallSheetView project={project} selectedSceneNumber={selectedSceneNumber} onSelectScene={onSelectScene} />
          </div>
        )}
      </main>
    </div>
  );
};
