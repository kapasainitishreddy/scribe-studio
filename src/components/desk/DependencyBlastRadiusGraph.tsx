import React, { useState, useMemo } from "react";
import {
  FileCode,
  Film,
  User,
  Package,
  ShieldCheck,
  Globe,
  Box,
  Maximize2,
  Crosshair,
  Filter,
  ArrowDownUp,
  ArrowLeftRight
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import {
  buildBlastRadiusGraph,
  computeGraphLayout,
  type PositionedNode
} from "../../utils/graphLayoutEngine";

interface DependencyBlastRadiusGraphProps {
  project: Project;
  sceneNumber: number;
  onSelectDepartment?: (dept: string) => void;
}

export const DependencyBlastRadiusGraph: React.FC<DependencyBlastRadiusGraphProps> = ({
  project,
  sceneNumber,
  onSelectDepartment
}) => {
  const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [showAffectedOnly, setShowAffectedOnly] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

  // Compute Dagre Graph layout
  const layout = useMemo(() => {
    const { nodes, edges } = buildBlastRadiusGraph(project, sceneNumber);
    return computeGraphLayout(nodes, edges, {
      direction,
      showAffectedOnly,
      nodeWidth: 144,
      nodeHeight: 46,
      nodeSep: direction === "TB" ? 32 : 24,
      rankSep: direction === "TB" ? 44 : 52
    });
  }, [project, sceneNumber, direction, showAffectedOnly]);

  const handleFitGraph = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };

  const handleFocusChangedNode = () => {
    const firstDirty = layout.nodes.find((n) => n.status === "dirty" || n.isAffected);
    if (firstDirty) {
      const centerX = layout.width / 2;
      const centerY = layout.height / 2;
      setTransform({
        scale: 1.15,
        x: centerX - firstDirty.x,
        y: centerY - firstDirty.y
      });
      setHoveredNode(firstDirty);
    } else {
      handleFitGraph();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ast":
        return FileCode;
      case "camera":
        return Film;
      case "cast":
        return User;
      case "art":
        return Package;
      case "continuity":
        return ShieldCheck;
      case "previs":
        return Box;
      case "research":
        return Globe;
      default:
        return FileCode;
    }
  };

  return (
    <div className="relative w-full rounded-xl bg-[#090B0E] border border-[#1A202C] p-3 overflow-hidden select-none">
      {/* Header with Title and Controls */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A202C]/60 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#D49B54] animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#D49B54] font-bold">
            AST Blast-Radius Dependency Graph (Dagre)
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161B22] text-[#8B949E] border border-[#21262D]">
            {layout.nodes.length} nodes • {layout.edges.length} edges
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Layout Direction Toggle */}
          <button
            onClick={() => setDirection((d) => (d === "TB" ? "LR" : "TB"))}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[10px] font-mono text-[#C9D1D9] transition-colors"
            title="Toggle Top-to-Bottom / Left-to-Right orientation"
          >
            {direction === "TB" ? (
              <>
                <ArrowDownUp className="w-3 h-3 text-[#D49B54]" />
                <span>Rank: TB</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-3 h-3 text-[#D49B54]" />
                <span>Rank: LR</span>
              </>
            )}
          </button>

          {/* Show Affected Only Toggle */}
          <button
            onClick={() => setShowAffectedOnly((prev) => !prev)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
              showAffectedOnly
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-[#161B22] hover:bg-[#21262D] border-[#30363D] text-[#C9D1D9]"
            }`}
            title="Toggle between full tree and affected blast-radius subset"
          >
            <Filter className="w-3 h-3" />
            <span>{showAffectedOnly ? "Affected Only" : "Show All"}</span>
          </button>

          {/* Focus Changed Node */}
          <button
            onClick={handleFocusChangedNode}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[10px] font-mono text-[#C9D1D9] transition-colors"
            title="Pan and zoom to first invalidated node"
          >
            <Crosshair className="w-3 h-3 text-amber-400" />
            <span>Focus Dirty</span>
          </button>

          {/* Fit Graph */}
          <button
            onClick={handleFitGraph}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[10px] font-mono text-[#C9D1D9] transition-colors"
            title="Reset Zoom & Pan"
          >
            <Maximize2 className="w-3 h-3 text-slate-400" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="flex items-center justify-between px-1 mb-2 text-[10px] font-mono text-[#8B949E]">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Shielded ({layout.protectedCount})</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Invalidated ({layout.affectedCount})</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
            <span>Parallel Ground Truth</span>
          </span>
        </div>
        <span className="text-[9px] text-[#6E7681]">
          Selective Invalidation: Unaffected AST nodes incur zero regeneration cost
        </span>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full h-[260px] bg-[#0D1117] rounded-lg border border-[#21262D] overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            transition: "transform 0.25s ease-out"
          }}
        >
          <defs>
            <marker
              id="arrowhead-sync"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" opacity="0.6" />
            </marker>
            <marker
              id="arrowhead-dirty"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Render Positioned Edges */}
          {layout.edges.map((edge) => {
            const strokeColor = edge.isInvalidated ? "#F59E0B" : "#10B981";
            return (
              <g key={edge.id}>
                <path
                  d={edge.pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={edge.isInvalidated ? "2" : "1.25"}
                  strokeDasharray={edge.isInvalidated ? "4,4" : "none"}
                  opacity={edge.isInvalidated ? 0.9 : 0.4}
                  markerEnd={edge.isInvalidated ? "url(#arrowhead-dirty)" : "url(#arrowhead-sync)"}
                  className={edge.isInvalidated ? "animate-pulse" : ""}
                />
              </g>
            );
          })}

          {/* Render Positioned Nodes */}
          {layout.nodes.map((node) => {
            const isRoot = node.status === "root";
            const isDirty = node.status === "dirty" || node.isAffected;
            const isResearch = node.status === "research";
            const isHovered = hoveredNode?.id === node.id;

            const strokeColor = isRoot
              ? "#D49B54"
              : isDirty
                ? "#F59E0B"
                : isResearch
                  ? "#0EA5E9"
                  : "#10B981";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectDepartment?.(node.dept)}
                className="cursor-pointer transition-all duration-150"
              >
                {/* Node Box */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx="6"
                  ry="6"
                  fill="#161B22"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? "2.5" : isDirty || isRoot ? "1.5" : "1"}
                  className="transition-all duration-150 shadow-md"
                />

                {/* Pulsing indicator for dirty/invalidated nodes */}
                {isDirty && (
                  <rect
                    width={node.width}
                    height={node.height}
                    rx="6"
                    ry="6"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Left accent bar */}
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height={node.height}
                  rx="2"
                  fill={strokeColor}
                />

                {/* Node Title & Dept */}
                <text
                  x="14"
                  y="18"
                  className="fill-[#F0F6FC] text-[10px] font-mono font-bold tracking-tight pointer-events-none"
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                </text>
                <text
                  x="14"
                  y="34"
                  className="fill-[#8B949E] text-[8.5px] font-mono pointer-events-none"
                >
                  {node.statusText}
                </text>

                {/* Status Dot */}
                <circle
                  cx={node.width - 12}
                  cy="16"
                  r="3.5"
                  fill={strokeColor}
                  className={isDirty ? "animate-ping" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Inspection HUD Card */}
        {hoveredNode && (
          <div className="absolute bottom-2 inset-x-2 bg-[#161B22]/95 backdrop-blur-md border border-[#30363D] rounded-lg p-2.5 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 z-20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                <span className="text-[#D49B54]">{hoveredNode.dept}:</span>
                <span>{hoveredNode.label}</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                {hoveredNode.hash}
              </span>
            </div>
            <p className="text-[10px] text-[#8B949E] mt-1 leading-snug">
              {hoveredNode.details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
