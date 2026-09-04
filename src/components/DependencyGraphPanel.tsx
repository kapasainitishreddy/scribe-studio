import React, { useState, useMemo } from "react";
import {
  GitFork,
  Film,
  User,
  Box,
  Package,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RefreshCw,
  Search,
  Filter,
  Info,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import type { Project, DependencyEdge } from "../../packages/project-model/src/types";
import { parseScreenplay } from "../../packages/screenplay-core/src/fountain";

interface DependencyGraphPanelProps {
  project: Project;
  onSelectScene?: (sceneNumber: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface GraphNode {
  id: string;
  type: "root" | "scene" | "character" | "prop" | "packet" | "research";
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  status?: "active" | "stale" | "verified" | "pristine";
  details?: string;
}

export const DependencyGraphPanel: React.FC<DependencyGraphPanelProps> = ({
  project,
  onSelectScene,
  onNavigateToTab
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("scene-1");
  const [filterType, setFilterType] = useState<string>("all");
  const [simulatedScene, setSimulatedScene] = useState<number | null>(1);

  const parsed = parseScreenplay(project.screenplayText);

  // Generate Graph Nodes
  const { nodes, edges } = useMemo(() => {
    const nList: GraphNode[] = [];
    const eList: { id: string; source: string; target: string; label: string; isHighlighted: boolean }[] = [];

    // Root Node
    nList.push({
      id: "root-screenplay",
      type: "root",
      label: project.title,
      sublabel: `Root Node (v${project.version})`,
      x: 450,
      y: 50,
      status: "active",
      details: "The Screenplay is the single authoritative root of the entity dependency graph."
    });

    // Scene Nodes (Level 1)
    const scenes = parsed.scenes.slice(0, 4);
    const sceneSpacing = 220;
    const startX = 120;

    scenes.forEach((s, idx) => {
      const sceneId = `scene-${s.number}`;
      const xPos = startX + idx * sceneSpacing;
      const isSimulated = simulatedScene === s.number;

      nList.push({
        id: sceneId,
        type: "scene",
        label: `Scene ${s.number}`,
        sublabel: s.heading.length > 22 ? s.heading.slice(0, 22) + "..." : s.heading,
        x: xPos,
        y: 180,
        status: isSimulated ? "stale" : "active",
        details: `${s.heading} (${s.lineIds.length} script lines parsed)`
      });

      eList.push({
        id: `e-root-${sceneId}`,
        source: "root-screenplay",
        target: sceneId,
        label: "contains",
        isHighlighted: isSimulated
      });
    });

    // Characters & Props (Level 2)
    const characters = Object.values(project.characters);
    characters.forEach((char, idx) => {
      const charId = `char-${char.id}`;
      const isAffectedBySim = simulatedScene === 1 && (char.id === "maya-lin" || char.id === "marcus-kane");

      nList.push({
        id: charId,
        type: "character",
        label: char.name,
        sublabel: char.role || "Lead",
        x: 140 + idx * 260,
        y: 320,
        status: isAffectedBySim ? "stale" : "pristine",
        details: `Goal: ${char.dramaticObjective} | Secret: ${char.secrets[0] || "None"}`
      });

      // Connect to scenes where character appears
      if (char.id === "maya-lin") {
        eList.push({ id: `e-s1-${charId}`, source: "scene-1", target: charId, label: "leads", isHighlighted: simulatedScene === 1 });
        eList.push({ id: `e-s3-${charId}`, source: "scene-3", target: charId, label: "escapes", isHighlighted: false });
      } else if (char.id === "marcus-kane") {
        eList.push({ id: `e-s1-${charId}`, source: "scene-1", target: charId, label: "supports", isHighlighted: simulatedScene === 1 });
        eList.push({ id: `e-s3-${charId}`, source: "scene-3", target: charId, label: "breaches", isHighlighted: false });
      } else {
        eList.push({ id: `e-s2-${charId}`, source: "scene-2", target: charId, label: "antagonist", isHighlighted: false });
      }
    });

    // Props (Level 2 right)
    nList.push({
      id: "prop-titanium-drive",
      type: "prop",
      label: "Encrypted Titanium Drive",
      sublabel: "Core MacGuffin Prop",
      x: 880,
      y: 320,
      status: simulatedScene === 1 ? "stale" : "active",
      details: "Breach asset containing the Obsidian Protocol. Directly modified in Scene 1 hero diff."
    });
    eList.push({
      id: "e-s1-prop",
      source: "scene-1",
      target: "prop-titanium-drive",
      label: "extracted in",
      isHighlighted: simulatedScene === 1
    });

    // Actor Packets (Level 3 - Target of selective invalidation)
    characters.forEach((char, idx) => {
      const packetId = `packet-${char.id}`;
      const isStale =
        project.propagationState.staleActorPackets.includes(char.id) ||
        (simulatedScene === 1 && (char.id === "maya-lin" || char.id === "marcus-kane"));

      nList.push({
        id: packetId,
        type: "packet",
        label: `${char.name.split(" ")[0]} Packet`,
        sublabel: isStale ? "STALE (Needs Regen)" : "PRISTINE (Saved Compute)",
        x: 140 + idx * 260,
        y: 470,
        status: isStale ? "stale" : "pristine",
        details: isStale
          ? `Packet is invalidated by AST diff in Scene ${simulatedScene}. Selective regeneration required.`
          : `Packet is 100% up-to-date. ZERO compute wasted on re-running unchanged character context.`
      });

      eList.push({
        id: `e-char-packet-${char.id}`,
        source: `char-${char.id}`,
        target: packetId,
        label: isStale ? "invalidates" : "preserves",
        isHighlighted: isStale
      });
    });

    // Parallel Research Nodes (Level 3 right)
    const researchItems = project.researchFindings.slice(0, 2);
    researchItems.forEach((rf, idx) => {
      const rfId = `research-${idx}`;
      nList.push({
        id: rfId,
        type: "research",
        label: "Parallel Research",
        sublabel: rf.query.length > 24 ? rf.query.slice(0, 24) + "..." : rf.query,
        x: 750 + idx * 160,
        y: 470,
        status: "verified",
        details: `Query: "${rf.query}" | Confidence: ${(rf.confidence * 100).toFixed(0)}% | Verified via Parallel Search API`
      });

      eList.push({
        id: `e-scene-res-${idx}`,
        source: `scene-${rf.sceneNumber}`,
        target: rfId,
        label: "grounded by",
        isHighlighted: simulatedScene === rf.sceneNumber
      });
    });

    return { nodes: nList, edges: eList };
  }, [parsed.scenes, project, simulatedScene]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const filteredNodes = nodes.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "scenes") return n.type === "scene" || n.type === "root";
    if (filterType === "packets") return n.type === "packet";
    if (filterType === "research") return n.type === "research";
    return true;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0c0e14] select-none">
      {/* Visual Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Control Strip */}
        <div className="h-12 border-b border-[#232836] bg-[#11141c]/90 backdrop-blur px-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <GitFork className="w-4 h-4" />
              <span>Reactive Dependency Graph</span>
            </div>
            <div className="h-4 w-px bg-[#262e40]" />
            <span className="text-xs text-slate-400">
              Screenplay AST as Root • Directed Blast Radius Invalidation
            </span>
          </div>

          {/* Blast Radius Simulation Controller */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-[#161a25] p-1 rounded-lg border border-[#273042]">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Simulate Blast:</span>
              <button
                onClick={() => setSimulatedScene(1)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                  simulatedScene === 1
                    ? "bg-amber-500 text-black font-bold shadow"
                    : "text-slate-300 hover:bg-[#202738]"
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Scene 1 Edit</span>
              </button>
              <button
                onClick={() => setSimulatedScene(null)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  simulatedScene === null
                    ? "bg-[#273042] text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Baseline
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-1 bg-[#161a25] p-1 rounded-lg border border-[#273042]">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {["all", "scenes", "packets", "research"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                    filterType === f ? "bg-[#252e42] text-amber-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive SVG Node-Link Canvas */}
        <div className="flex-1 overflow-auto bg-[#0a0c12] relative flex items-center justify-center p-8">
          <svg className="w-full h-full min-w-[950px] min-h-[580px]">
            <defs>
              <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edgeDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Connecting Edges */}
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const midY = (srcNode.y + tgtNode.y) / 2;
              const pathD = `M ${srcNode.x} ${srcNode.y + 20} C ${srcNode.x} ${midY}, ${tgtNode.x} ${midY}, ${tgtNode.x} ${tgtNode.y - 20}`;

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edge.isHighlighted ? "url(#edgeGlow)" : "url(#edgeDefault)"}
                    strokeWidth={edge.isHighlighted ? 3 : 1.5}
                    strokeDasharray={edge.isHighlighted ? "6,4" : "none"}
                    className={edge.isHighlighted ? "animate-pulse" : ""}
                  />
                  {edge.isHighlighted && (
                    <text
                      x={(srcNode.x + tgtNode.x) / 2}
                      y={midY - 4}
                      fill="#f59e0b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isStale = node.status === "stale";
              const isPristine = node.status === "pristine";
              const isVerified = node.status === "verified";

              let bgFill = "#161b26";
              let strokeColor = "#2d374d";
              let badgeColor = "#94a3b8";

              if (node.type === "root") {
                bgFill = "#1e1b4b";
                strokeColor = "#818cf8";
                badgeColor = "#a5b4fc";
              } else if (isStale) {
                bgFill = "#3b1717";
                strokeColor = "#ef4444";
                badgeColor = "#f87171";
              } else if (isPristine) {
                bgFill = "#0d2818";
                strokeColor = "#10b981";
                badgeColor = "#34d399";
              } else if (isVerified) {
                bgFill = "#142c42";
                strokeColor = "#0284c7";
                badgeColor = "#38bdf8";
              }

              if (isSelected) {
                strokeColor = "#f59e0b";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  {/* Outer Pulsing Aura for Stale Blast Radius */}
                  {isStale && (
                    <rect
                      x="-85"
                      y="-25"
                      width="170"
                      height="50"
                      rx="10"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Capsule */}
                  <rect
                    x="-80"
                    y="-22"
                    width="160"
                    height="44"
                    rx="8"
                    fill={bgFill}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Node Title */}
                  <text
                    x="0"
                    y="-4"
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.label}
                  </text>

                  {/* Node Sublabel */}
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    fill={badgeColor}
                    fontSize="9"
                    fontWeight="500"
                    fontFamily="monospace"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend Banner */}
          <div className="absolute bottom-4 left-6 flex items-center space-x-4 bg-[#11141c]/90 backdrop-blur px-3 py-2 rounded-lg border border-[#232836] text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>Blast Radius (Stale)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Pristine (0 Recomputation)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Parallel Search Verified</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Root Screenplay AST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Details Drawer */}
      <div className="w-80 border-l border-[#232836] bg-[#10131b] flex flex-col">
        <div className="p-3 border-b border-[#232836] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Entity Inspector
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase font-mono">
            {selectedNode?.type}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-sm font-bold text-slate-100">{selectedNode?.label}</div>
            <div className="text-xs text-amber-400 font-mono mt-0.5">{selectedNode?.sublabel}</div>
          </div>

          {/* Status Box */}
          <div
            className={`p-3 rounded-lg border text-xs ${
              selectedNode?.status === "stale"
                ? "bg-rose-950/30 border-rose-800/40 text-rose-300"
                : selectedNode?.status === "pristine"
                ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                : selectedNode?.status === "verified"
                ? "bg-sky-950/30 border-sky-800/40 text-sky-300"
                : "bg-[#161a25] border-[#252e42] text-slate-300"
            }`}
          >
            <div className="font-semibold flex items-center space-x-1.5 mb-1">
              {selectedNode?.status === "stale" && <AlertTriangle className="w-3.5 h-3.5" />}
              {selectedNode?.status === "pristine" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {selectedNode?.status === "verified" && <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="uppercase tracking-wider text-[11px]">
                {selectedNode?.status === "stale"
                  ? "Blast Radius: Stale"
                  : selectedNode?.status === "pristine"
                  ? "Pristine: Saved Compute"
                  : selectedNode?.status === "verified"
                  ? "Parallel API Grounded"
                  : "Active Canon Entity"}
              </span>
            </div>
            <div className="text-[11px] leading-relaxed opacity-90">{selectedNode?.details}</div>
          </div>

          {/* Invalidation Blast Radius Explanation */}
          <div className="p-3 bg-[#141822] rounded-lg border border-[#252e40] space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Why Directed Invalidation Matters
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Traditional AI filmmaking tools blindly re-prompt every single agent across all scenes whenever a typo or line changes.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-amber-400">Scribe Studio</strong> isolates changes to the AST line-level diff. In Scene 1, only Maya Lin and Marcus Kane's packets are invalidated. Dr. Aris Thorne's packet incurs <strong className="text-emerald-400">0 wasted tokens</strong>.
            </p>
          </div>

          {/* Quick Jump Action */}
          {selectedNode?.type === "scene" && onSelectScene && onNavigateToTab && (
            <button
              onClick={() => {
                const sNum = parseInt(selectedNode.id.replace("scene-", ""));
                if (!isNaN(sNum)) {
                  onSelectScene(sNum);
                  onNavigateToTab("editor");
                }
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded text-xs flex items-center justify-center space-x-1 shadow transition-all hover:opacity-90"
            >
              <span>Jump to Scene in Editor</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedNode?.type === "packet" && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("actor-packets")}
              className="w-full py-2 bg-[#1c2232] hover:bg-[#252e42] border border-[#2c364e] text-slate-200 font-semibold rounded text-xs flex items-center justify-center space-x-1 transition-all"
            >
              <span>Inspect Actor Packet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedNode?.type === "research" && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("research")}
              className="w-full py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-semibold rounded text-xs flex items-center justify-center space-x-1 transition-all"
            >
              <span>View Parallel Research Sources</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
