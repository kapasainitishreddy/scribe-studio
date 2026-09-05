import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Globe,
  Film,
  User,
  Package,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";

interface DependencyBlastRadiusGraphProps {
  project: Project;
  sceneNumber: number;
  onSelectDepartment?: (dept: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  dept: string;
  x: number;
  y: number;
  icon: any;
  status: "protected" | "dirty" | "research" | "root";
  statusText: string;
  hash: string;
  details: string;
}

export const DependencyBlastRadiusGraph: React.FC<DependencyBlastRadiusGraphProps> = ({
  project,
  sceneNumber,
  onSelectDepartment
}) => {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Derive dynamic state from project
  const stalePanelsCount = project.propagationState.staleStoryboardPanels?.length || 0;
  const stalePacketsCount = project.propagationState.staleActorPackets?.length || 0;
  const activeIssues = project.continuityIssues.filter(
    (i) => i.affectedScenes.includes(sceneNumber) && i.status === "active"
  );
  const realityFindings = project.researchFindings || [];

  const nodes: GraphNode[] = [
    {
      id: "root-ast",
      label: `Scene ${sceneNumber} AST`,
      dept: "Screenplay Core",
      x: 180,
      y: 110,
      icon: FileCode,
      status: "root",
      statusText: "ROOT NODE",
      hash: `ast-sc${sceneNumber}-rev`,
      details: `Abstract Syntax Tree root node for Scene ${sceneNumber}. Governs downstream dependency propagation.`
    },
    {
      id: "storyboard-node",
      label: "Storyboard Panels",
      dept: "Camera / Visual",
      x: 60,
      y: 40,
      icon: Film,
      status: stalePanelsCount > 0 ? "dirty" : "protected",
      statusText: stalePanelsCount > 0 ? `${stalePanelsCount} OUTDATED` : "SYNCHRONIZED",
      hash: "vis-panels-8a1f",
      details: stalePanelsCount > 0
        ? `${stalePanelsCount} storyboard panels require selective re-rendering due to script diff.`
        : "All visual schematics and camera setups match screenplay canon."
    },
    {
      id: "reality-node",
      label: "Reality Gate",
      dept: "Parallel Search API",
      x: 300,
      y: 40,
      icon: Globe,
      status: realityFindings.length > 0 ? "research" : "protected",
      statusText: realityFindings.length > 0 ? "PARALLEL CHECKED" : "ABSTAINED (DRAMA)",
      hash: "par-gate-710e",
      details: realityFindings.length > 0
        ? `Parallel Search verified ground truth citations for technical claims.`
        : "Semantic abstention active: zero compute wasted on purely dramatic dialogue."
    },
    {
      id: "actor-node",
      label: "Actor Packets",
      dept: "Cast / Rehearsal",
      x: 60,
      y: 180,
      icon: User,
      status: stalePacketsCount > 0 ? "dirty" : "protected",
      statusText: stalePacketsCount > 0 ? `${stalePacketsCount} DIRTY` : "PROTECTED",
      hash: "act-sides-0c4d",
      details: stalePacketsCount > 0
        ? "Cast sides out of sync with modified character dialogue."
        : "Actor rehearsal packets cryptographically shielded with identical SHA-256."
    },
    {
      id: "props-node",
      label: "Props & Breakdown",
      dept: "Art Department",
      x: 300,
      y: 180,
      icon: Package,
      status: activeIssues.length > 0 ? "dirty" : "protected",
      statusText: activeIssues.length > 0 ? "PROP CONFLICT" : "VERIFIED",
      hash: "art-props-e28b",
      details: activeIssues.length > 0
        ? "Prop tracking conflict detected in continuity ledger."
        : "Physical prop inventory matches scene requirements."
    }
  ];

  const rootNode = nodes[0];

  return (
    <div className="relative w-full rounded-xl bg-[#090B0E] border border-[#1A202C] p-3 overflow-hidden select-none">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#1A202C]/60">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#D49B54] animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#D49B54] font-bold">
            Interactive AST Blast Radius Graph
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono text-[#69717E]">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Shielded (0 Compute)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>Invalidated (Dirty)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[220px] flex items-center justify-center">
        <svg viewBox="0 0 360 220" className="w-full h-full">
          {/* Connection Lines radiating from root */}
          {nodes.slice(1).map((node) => {
            const isDirty = node.status === "dirty";
            const strokeColor = isDirty ? "#F59E0B" : node.status === "research" ? "#0EA5E9" : "#10B981";
            return (
              <g key={`edge-${node.id}`}>
                <line
                  x1={rootNode.x}
                  y1={rootNode.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray={isDirty ? "3,3" : "none"}
                  opacity={isDirty ? 0.85 : 0.45}
                  className={isDirty ? "animate-pulse" : ""}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isRoot = node.status === "root";
            const isDirty = node.status === "dirty";
            const isResearch = node.status === "research";
            const isHovered = hoveredNode?.id === node.id;

            const bgFill = isRoot
              ? "#D49B54"
              : isDirty
                ? "#F59E0B"
                : isResearch
                  ? "#0EA5E9"
                  : "#10B981";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectDepartment?.(node.dept)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {/* Halo ring for dirty or hovered nodes */}
                {(isDirty || isHovered) && (
                  <circle
                    r={isRoot ? 24 : 18}
                    fill="none"
                    stroke={bgFill}
                    strokeWidth="1.5"
                    opacity={0.35}
                    className="animate-ping"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={isRoot ? 20 : 15}
                  fill="#12161D"
                  stroke={bgFill}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />

                {/* Status Dot */}
                <circle
                  cx={isRoot ? 14 : 10}
                  cy={isRoot ? -14 : -10}
                  r={isRoot ? 4 : 3}
                  fill={bgFill}
                />

                {/* Label text */}
                <text
                  y={isRoot ? 32 : 24}
                  textAnchor="middle"
                  className="fill-[#F0F2F5] text-[9px] font-mono font-bold tracking-tight pointer-events-none"
                >
                  {node.label}
                </text>
                <text
                  y={isRoot ? 42 : 33}
                  textAnchor="middle"
                  className="fill-[#69717E] text-[8px] font-mono pointer-events-none"
                >
                  {node.statusText}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Inspection HUD Card */}
        {hoveredNode && (
          <div className="absolute bottom-2 inset-x-2 bg-[#12161D]/95 backdrop-blur-md border border-[#262C36] rounded-lg p-2.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150 z-20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                <span className="text-[#D49B54]">{hoveredNode.dept}:</span>
                <span>{hoveredNode.label}</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#171C24] text-[#A0A7B2]">
                {hoveredNode.hash}
              </span>
            </div>
            <p className="text-[10px] text-[#A0A7B2] mt-1 leading-snug">
              {hoveredNode.details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
