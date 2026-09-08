import React, { useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import {
  FileCode,
  Film,
  User,
  Package,
  ShieldCheck,
  Globe,
  Box,
  Filter,
  ArrowDownUp
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { buildBlastRadiusGraph } from "../../utils/graphLayoutEngine";

interface DependencyBlastRadiusGraphProps {
  project: Project;
  sceneNumber: number;
  onSelectDepartment?: (dept: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "ast": return FileCode;
    case "camera": return Film;
    case "cast": return User;
    case "art": return Package;
    case "continuity": return ShieldCheck;
    case "previs": return Box;
    case "research": return Globe;
    default: return FileCode;
  }
};

const CustomNode = ({ data }: any) => {
  const Icon = getCategoryIcon(data.category);
  const isDirty = data.status === "dirty" || data.isAffected;
  const isRoot = data.status === "root";
  const isResearch = data.status === "research";
  
  const strokeColor = isRoot
    ? "#D49B54" // gold
    : isDirty
      ? "#F59E0B" // amber
      : isResearch
        ? "#0EA5E9" // sky
        : "#10B981"; // emerald
        
  return (
    <div 
      className={`relative flex flex-col w-[144px] h-[46px] rounded-md bg-[#161B22] shadow-md border ${isDirty ? "shadow-[0_0_8px_rgba(245,158,11,0.6)]" : ""}`}
      style={{ borderColor: strokeColor, borderWidth: (isDirty || isRoot) ? '1.5px' : '1px' }}
      onClick={() => data.onSelect?.(data.dept)}
    >
      <Handle type="target" position={data.targetPosition || Position.Top} className="opacity-0" />
      <div className="flex items-center h-full px-2">
        <div className="w-1 h-full absolute left-0 rounded-l-md" style={{ backgroundColor: strokeColor }} />
        <div className="flex-1 ml-2">
          <div className="flex items-center space-x-1">
            <Icon className="w-3 h-3 text-[#F0F2F5]" />
            <span className="text-[#F0F2F5] text-[10px] font-mono font-bold tracking-tight truncate w-[90px]">
              {data.label}
            </span>
          </div>
          <div className="text-[#8B949E] text-[8.5px] font-mono mt-0.5">
            {data.statusText}
          </div>
        </div>
        <div 
          className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'animate-ping' : ''}`}
          style={{ backgroundColor: strokeColor }} 
        />
      </div>
      <Handle type="source" position={data.sourcePosition || Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (nodes: any[], edges: any[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 144;
  const nodeHeight = 46;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 32, ranksep: 44 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.data.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
    node.data.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;
    node.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
    node.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

export const DependencyBlastRadiusGraph: React.FC<DependencyBlastRadiusGraphProps> = ({
  project,
  sceneNumber,
  onSelectDepartment
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [direction, setDirection] = useState<"TB" | "LR">("TB");
  const [showAffectedOnly, setShowAffectedOnly] = useState(false);

  useEffect(() => {
    const rawData = buildBlastRadiusGraph(project, sceneNumber);
    let rawNodes = rawData.nodes;
    let rawEdges = rawData.edges;

    if (showAffectedOnly) {
      rawNodes = rawNodes.filter(n => n.status === "root" || n.status === "dirty" || n.isAffected);
      const nodeIds = new Set(rawNodes.map(n => n.id));
      rawEdges = rawEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    const initialNodes = rawNodes.map((n) => ({
      id: n.id,
      type: "custom",
      data: {
        ...n,
        onSelect: onSelectDepartment
      },
      position: { x: 0, y: 0 }
    }));

    const initialEdges = rawEdges.map((e) => {
      const isInvalidated = e.isInvalidated;
      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: isInvalidated,
        style: {
          stroke: isInvalidated ? "#F59E0B" : "#10B981",
          strokeWidth: isInvalidated ? 2 : 1.25,
          opacity: isInvalidated ? 0.9 : 0.4,
          strokeDasharray: isInvalidated ? "4,4" : "none"
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isInvalidated ? "#F59E0B" : "#10B981"
        }
      };
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      direction
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [project, sceneNumber, direction, showAffectedOnly, setNodes, setEdges, onSelectDepartment]);

  return (
    <div className="relative w-full rounded-xl bg-[#090B0E] border border-[#1A202C] p-3 overflow-hidden select-none flex flex-col">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A202C]/60 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#D49B54] animate-ping" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#D49B54] font-bold">
            AST Blast-Radius Dependency Graph (React Flow + Dagre)
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161B22] text-[#8B949E] border border-[#21262D]">
            {nodes.length} nodes • {edges.length} edges
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDirection((d) => (d === "TB" ? "LR" : "TB"))}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[10px] font-mono text-[#C9D1D9] transition-colors"
          >
            <ArrowDownUp className="w-3 h-3 text-[#D49B54]" />
            <span>Rank: {direction}</span>
          </button>

          <button
            onClick={() => setShowAffectedOnly((prev) => !prev)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
              showAffectedOnly
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-[#161B22] hover:bg-[#21262D] border-[#30363D] text-[#C9D1D9]"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{showAffectedOnly ? "Affected Only" : "Show All"}</span>
          </button>
        </div>
      </div>

      <div className="w-full h-[360px] bg-[#0D1117] rounded-lg border border-[#21262D] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#262C36" gap={16} size={1} />
          <Controls className="bg-[#12161D] border-[#262C36] fill-[#A0A7B2]" />
          <MiniMap 
            nodeColor={(node) => {
              const data = node.data as any;
              if (data.status === 'root') return '#D49B54';
              if (data.status === 'dirty' || data.isAffected) return '#F59E0B';
              if (data.status === 'research') return '#0EA5E9';
              return '#10B981';
            }}
            maskColor="rgba(13, 17, 23, 0.7)"
            className="bg-[#090B0E] border-[#262C36]"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
