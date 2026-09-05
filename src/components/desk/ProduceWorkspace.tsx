import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Globe,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from "lucide-react";
import type { Project, BreakdownCategory } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";

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
  const [subTab, setSubTab] = useState<ProduceSubTab>("continuity");
  const [hoveredConflict, setHoveredConflict] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);

  // Continuity tracked items timeline
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
      conflict: "Continuity conflict: Scene 18 ends with Maya in black leather jacket. Scene 22 begins with red trench coat without scene transition."
    },
    {
      element: "9mm Revolver",
      category: "Props",
      states: [
        { scene: "S12", value: "—", status: "ok" },
        { scene: "S18", value: "ARJUN", status: "ok" },
        { scene: "S22", value: "MAYA", status: "ok" },
        { scene: "S29", value: "EVIDENCE", status: "ok" }
      ],
      conflict: null
    },
    {
      element: "Silver Locket",
      category: "Props",
      states: [
        { scene: "S12", value: "MAYA", status: "ok" },
        { scene: "S18", value: "FLOOR", status: "ok" },
        { scene: "S22", value: "MAYA", status: "warning", issueId: "c-locket" },
        { scene: "S29", value: "MAYA", status: "ok" }
      ],
      conflict: "Scene 18 ends: Locket kicked onto floor. Scene 22 begins: Locket around Maya's neck. Retrieval beat missing."
    },
    {
      element: "Weather Condition",
      category: "Environment",
      states: [
        { scene: "S12", value: "DRY", status: "ok" },
        { scene: "S18", value: "HEAVY RAIN", status: "ok" },
        { scene: "S22", value: "WET / DRIP", status: "ok" },
        { scene: "S29", value: "DRY", status: "ok" }
      ],
      conflict: null
    }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      await onRunParallelResearch(searchQuery.trim());
      setSearchQuery("");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#090B0E] select-none">
      {/* ============================================================ */}
      {/* LEFT SECOND RAIL: PRODUCE SUB-TABS                           */}
      {/* ============================================================ */}
      <nav aria-label="Production Navigation" className="w-56 border-r border-[#262C36] bg-[#0D1015] flex flex-col shrink-0">
        <div className="p-2.5 border-b border-[#262C36] bg-[#12161D] flex items-center justify-between text-xs font-semibold text-[#A0A7B2]">
          <span>PRODUCTION</span>
          <span className="font-mono text-[10px] text-[#D49B54] uppercase font-bold">Desk</span>
        </div>

        <div className="p-2 space-y-1 text-xs">
          <button
            onClick={() => setSubTab("continuity")}
            className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
              subTab === "continuity"
                ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5] font-semibold"
                : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
            }`}
          >
            <span>Continuity Matrix</span>
            {project.continuityIssues.filter((i) => i.status === "active").length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#F43F5E]/20 text-[#F43F5E] font-bold">
                {project.continuityIssues.filter((i) => i.status === "active").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab("breakdown")}
            className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
              subTab === "breakdown"
                ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5] font-semibold"
                : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
            }`}
          >
            <span>Production Breakdown</span>
            <span className="text-[10px] font-mono text-[#69717E]">
              {project.breakdown?.elements?.length || 16}
            </span>
          </button>

          <button
            onClick={() => setSubTab("research")}
            className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
              subTab === "research"
                ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5] font-semibold"
                : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
            }`}
          >
            <span>Parallel Ground Truth</span>
            <span className="text-[10px] font-mono text-[#0EA5E9]">
              {project.researchFindings?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setSubTab("schedule")}
            className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
              subTab === "schedule"
                ? "bg-[#171C24] border border-[#D49B54]/40 text-[#F0F2F5] font-semibold"
                : "text-[#A0A7B2] hover:text-[#F0F2F5] hover:bg-[#12161D]"
            }`}
          >
            <span>Budget & Schedule</span>
            <span className="text-[10px] font-mono text-[#69717E]">Est</span>
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* CENTER: PRODUCTION TABLES & TIMELINES                        */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-6 bg-[#090B0E]">
        {/* SUB-VIEW 1: CONTINUITY TIMELINE MATRIX */}
        {subTab === "continuity" && (
          <div className="space-y-6 max-w-5xl w-full mx-auto">
            <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight uppercase">
                  Script Supervisor & Continuity Matrix
                </h2>
                <p className="text-xs text-[#A0A7B2]">
                  Live state propagation tracking props, wardrobe, weather, and physical continuity across scenes.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="flex items-center space-x-1 text-[#10B981]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Consistent</span>
                </span>
                <span className="flex items-center space-x-1 text-[#F43F5E] ml-3">
                  <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                  <span>Conflict Warning</span>
                </span>
              </div>
            </div>

            {/* Timeline Matrix Table */}
            <div className="rounded-xl border border-[#262C36] bg-[#12161D] overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#262C36] bg-[#0D1015] text-[11px] font-mono text-[#69717E] uppercase">
                    <th className="p-3.5 w-48 font-semibold">Tracked Element</th>
                    <th className="p-3.5 text-center w-32">Scene 12</th>
                    <th className="p-3.5 text-center w-32">Scene 18</th>
                    <th className="p-3.5 text-center w-32">Scene 22</th>
                    <th className="p-3.5 text-center w-32">Scene 29</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A202C] text-xs">
                  {continuityTimeline.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#171C24]/50 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div className="font-semibold">{item.element}</div>
                        <div className="text-[10px] text-[#69717E] uppercase font-mono">{item.category}</div>
                      </td>

                      {item.states.map((st, sIdx) => {
                        const isWarning = st.status === "warning";
                        return (
                          <td key={sIdx} className="p-3.5 text-center font-mono relative">
                            <div className="flex items-center justify-center space-x-1">
                              {sIdx > 0 && (
                                <span className="text-[#262C36] font-bold text-xs select-none">────</span>
                              )}
                              <span
                                onMouseEnter={() => item.conflict && isWarning && setHoveredConflict(item.conflict)}
                                onMouseLeave={() => setHoveredConflict(null)}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-default transition-all ${
                                  isWarning
                                    ? "bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40 font-bold animate-pulse"
                                    : "bg-[#171C24] text-[#A0A7B2] border border-[#262C36]"
                                }`}
                              >
                                {st.value} {isWarning && "⚠"}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hovered / Active Conflict Inspector Popover */}
            {hoveredConflict ? (
              <div className="p-4 rounded-xl bg-[#171C24] border border-[#F43F5E]/40 shadow-2xl space-y-3 animate-fade-in">
                <div className="flex items-center space-x-2 text-[#F43F5E] font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Continuity Conflict Detected</span>
                </div>
                <p className="text-sm text-[#F0F2F5] leading-relaxed">
                  {hoveredConflict}
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => onSelectScene(18)}
                    className="px-3 py-1 rounded bg-[#12161D] hover:bg-[#202736] border border-[#262C36] text-xs font-mono text-[#D49B54]"
                  >
                    [ View Source Scene 18 ]
                  </button>
                  <button
                    onClick={() => setHoveredConflict(null)}
                    className="px-3 py-1 rounded bg-[#12161D] hover:bg-[#202736] border border-[#262C36] text-xs font-mono text-[#A0A7B2]"
                  >
                    [ Mark Intentional ]
                  </button>
                  <button
                    onClick={() => {
                      onResolveIssue("c-jacket");
                      setHoveredConflict(null);
                    }}
                    className="px-3 py-1 rounded bg-[#D49B54] hover:bg-[#E3AF69] text-black text-xs font-bold font-mono"
                  >
                    [ Create Fix ]
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] flex items-center justify-between text-xs text-[#69717E]">
                <div className="flex items-center space-x-2">
                  <Info className="w-3.5 h-3.5 text-[#D49B54]" />
                  <span>Hover over any ⚠ warning badge to inspect cross-scene transfer discrepancies.</span>
                </div>
                <span className="font-mono text-[10px]">Zero Inconsistencies Target</span>
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 2: 16-CATEGORY PRODUCTION BREAKDOWN */}
        {subTab === "breakdown" && (
          <div className="space-y-4 max-w-5xl w-full mx-auto">
            <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight uppercase">
                  16-Category Production Breakdown
                </h2>
                <p className="text-xs text-[#A0A7B2]">
                  Standard Hollywood departmental classification generated from screenplay AST.
                </p>
              </div>
              <span className="text-xs font-mono text-[#D49B54]">
                {project.breakdown?.elements?.length || 0} Elements
              </span>
            </div>

            <div className="rounded-xl border border-[#262C36] bg-[#12161D] overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#262C36] bg-[#0D1015] text-[11px] font-mono text-[#69717E] uppercase">
                    <th className="p-3 w-20">Scene</th>
                    <th className="p-3 w-36">Category</th>
                    <th className="p-3">Element Name</th>
                    <th className="p-3 w-48">Department Notes</th>
                    <th className="p-3 w-24 text-center">Lock State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A202C] text-xs">
                  {project.breakdown?.elements?.map((el) => (
                    <tr key={el.id} className="hover:bg-[#171C24]/50 transition-colors">
                      <td className="p-3 font-mono text-[#D49B54] font-semibold">S{el.sceneNumber}</td>
                      <td className="p-3 uppercase font-mono text-[10px] text-[#A0A7B2]">{el.category}</td>
                      <td className="p-3 font-semibold text-white">{el.name}</td>
                      <td className="p-3 text-[#69717E] text-[11px] truncate max-w-[200px]">
                        {el.notes || "Production standard check"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleBreakdownLock(el.id)}
                          className="p-1 rounded text-[#69717E] hover:text-[#F0F2F5] transition-colors"
                          title={el.locked ? "Locked" : "Unlocked"}
                        >
                          {el.locked ? (
                            <Lock className="w-3.5 h-3.5 text-[#D49B54]" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-[#69717E]" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: GROUND-TRUTH RESEARCH (PARALLEL SEARCH) */}
        {subTab === "research" && (
          <div className="space-y-4 max-w-5xl w-full mx-auto">
            <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight uppercase">
                  Parallel Search Ground-Truth Verification
                </h2>
                <p className="text-xs text-[#A0A7B2]">
                  Real-time historical, geographical, and ballistic fact verification via Parallel Search.
                </p>
              </div>
            </div>

            {/* Search Query Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Verify historical/production detail (e.g. Hyderabad police ballistic protocols 2024)..."
                className="flex-1 bg-[#12161D] border border-[#262C36] rounded-lg px-3 py-2 text-xs text-white placeholder-[#69717E] outline-none focus:border-[#0EA5E9]"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-black font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isSearching ? "Verifying..." : "Run Parallel Search"}</span>
              </button>
            </form>

            {/* Findings List */}
            <div className="space-y-2 pt-2">
              {project.researchFindings?.map((finding) => (
                <div key={finding.id} className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{finding.query}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0EA5E9]/20 text-[#0EA5E9] font-bold">
                      {finding.confidence ? `${Math.round(finding.confidence * 100)}% Confidence` : "Verified Ground Truth"}
                    </span>
                  </div>
                  <p className="text-xs text-[#A0A7B2] leading-relaxed">{finding.summary}</p>
                  {finding.sources && finding.sources.length > 0 && (
                    <div className="text-[10px] font-mono text-[#69717E] truncate">
                      Citations: {finding.sources.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-VIEW 4: BUDGET & SCHEDULE */}
        {subTab === "schedule" && (
          <div className="space-y-6 max-w-5xl w-full mx-auto">
            <div className="border-b border-[#262C36] pb-3">
              <h2 className="text-base font-bold text-white tracking-tight uppercase">
                Production Schedule & Call Sheet Telemetry
              </h2>
              <p className="text-xs text-[#A0A7B2]">
                Automated shoot day estimations and cast call sheets based on page count.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#12161D] border border-[#262C36] text-center space-y-1">
                <div className="text-2xl font-bold font-mono text-white">18 Days</div>
                <div className="text-xs text-[#A0A7B2]">Estimated Shoot Days</div>
              </div>
              <div className="p-4 rounded-xl bg-[#12161D] border border-[#262C36] text-center space-y-1">
                <div className="text-2xl font-bold font-mono text-[#D49B54]">5.1 pgs/day</div>
                <div className="text-xs text-[#A0A7B2]">Shooting Pace</div>
              </div>
              <div className="p-4 rounded-xl bg-[#12161D] border border-[#262C36] text-center space-y-1">
                <div className="text-2xl font-bold font-mono text-[#10B981]">14 Locations</div>
                <div className="text-xs text-[#A0A7B2]">Company Moves: 3</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
