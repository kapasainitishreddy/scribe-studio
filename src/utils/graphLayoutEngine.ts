import dagre from "@dagrejs/dagre";
import type { Project } from "../../packages/project-model/src/types";

export interface BlastRadiusGraphNode {
  id: string;
  label: string;
  dept: string;
  category: "ast" | "camera" | "cast" | "art" | "continuity" | "research" | "previs";
  status: "root" | "dirty" | "protected" | "research";
  statusText: string;
  hash: string;
  details: string;
  metrics?: string;
  isAffected?: boolean;
}

export interface BlastRadiusGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  isInvalidated?: boolean;
}

export interface LayoutOptions {
  direction?: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSep?: number;
  rankSep?: number;
  showAffectedOnly?: boolean;
}

export interface PositionedNode extends BlastRadiusGraphNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedEdge extends BlastRadiusGraphEdge {
  points: { x: number; y: number }[];
  pathData: string;
}

export interface ComputedGraphLayout {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
  affectedCount: number;
  protectedCount: number;
}

/**
 * Build production DAG nodes and dependency edges from current project state.
 */
export function buildBlastRadiusGraph(
  project: Project,
  sceneNumber: number
): { nodes: BlastRadiusGraphNode[]; edges: BlastRadiusGraphEdge[] } {
  const nodes: BlastRadiusGraphNode[] = [];
  const edges: BlastRadiusGraphEdge[] = [];

  const rootId = `scene-${sceneNumber}-ast`;
  const stalePanels = project.propagationState.staleStoryboardPanels || [];
  const stalePackets = project.propagationState.staleActorPackets || [];
  const staleScenes = project.propagationState.staleBreakdownScenes || [];
  const flaggedScenes = project.propagationState.flaggedContinuityScenes || [];
  const scenePanels = (project.storyboardSequences?.[sceneNumber]?.panels || []);
  const sceneStalePanels = scenePanels.filter((p) => stalePanels.includes(p.id) || p.status === "OUTDATED");

  // 1. Root AST Node
  nodes.push({
    id: rootId,
    label: `Scene ${sceneNumber} AST`,
    dept: "Screenplay Core",
    category: "ast",
    status: "root",
    statusText: `v${project.version}.0 ROOT`,
    hash: `ast-sc${sceneNumber}-r${project.version}`,
    details: `Abstract Syntax Tree root node for Scene ${sceneNumber}. Invalidation cascades downstream across directed production edges.`,
    isAffected: false
  });

  // 2. Storyboard Panels
  const isStoryboardDirty = sceneStalePanels.length > 0;
  const sbNodeId = `node-storyboard-sc${sceneNumber}`;
  nodes.push({
    id: sbNodeId,
    label: "Storyboard Panels",
    dept: "Camera / Previs",
    category: "camera",
    status: isStoryboardDirty ? "dirty" : "protected",
    statusText: isStoryboardDirty ? `${sceneStalePanels.length} OUTDATED` : "SYNCHRONIZED",
    hash: `vis-${sceneNumber}-${isStoryboardDirty ? "dirty" : "sync"}`,
    details: isStoryboardDirty
      ? `${sceneStalePanels.length} visual panel(s) marked stale by diff analysis. Awaiting re-render.`
      : "Visual shot schematics match screenplay camera and action beats.",
    isAffected: isStoryboardDirty
  });
  edges.push({
    id: `edge-${rootId}-${sbNodeId}`,
    source: rootId,
    target: sbNodeId,
    label: "visual beats",
    isInvalidated: isStoryboardDirty
  });

  // 3. Actor Packets (per character in scene)
  const extraction = project.extractions?.[sceneNumber];
  const packetEntries = Object.entries(project.actorPackets || {});
  const relevantPackets = packetEntries.filter(([charId, packet]) => {
    if (!extraction) return true;
    const normId = charId.toLowerCase();
    const normName = (packet.characterName || "").toLowerCase();
    return extraction.charactersPresent.some((cp) => {
      const cLower = cp.toLowerCase();
      return (
        cLower.includes(normId) ||
        normId.includes(cLower) ||
        cLower.includes(normName) ||
        normName.includes(cLower)
      );
    });
  });

  const displayedPackets = (relevantPackets.length > 0 ? relevantPackets : packetEntries).slice(0, 3);

  displayedPackets.forEach(([charId, packet]) => {
    const charName = packet?.characterName || charId.replace(/-/g, " ");
    const isCharDirty = stalePackets.includes(charId) || packet?.isStale;
    const actorNodeId = `node-actor-${charId}`;

    nodes.push({
      id: actorNodeId,
      label: `${charName} Packet`,
      dept: "Cast / Rehearsal",
      category: "cast",
      status: isCharDirty ? "dirty" : "protected",
      statusText: isCharDirty ? "DIRTY" : "SHIELDED",
      hash: `act-${charId.slice(0, 6)}`,
      details: isCharDirty
        ? `Dialogue or motivation updated for ${charName}. New sides required.`
        : `Actor packet cryptographically shielded with matching dialogue hash.`,
      isAffected: !!isCharDirty
    });
    edges.push({
      id: `edge-${rootId}-${actorNodeId}`,
      source: rootId,
      target: actorNodeId,
      label: "dialogue cues",
      isInvalidated: !!isCharDirty
    });
  });

  // 4. Props & Breakdown
  const isBreakdownDirty = staleScenes.includes(sceneNumber);
  const bdNodeId = `node-breakdown-sc${sceneNumber}`;
  nodes.push({
    id: bdNodeId,
    label: "Props & Breakdown",
    dept: "Art Department",
    category: "art",
    status: isBreakdownDirty ? "dirty" : "protected",
    statusText: isBreakdownDirty ? "REQUIRES AUDIT" : "VERIFIED",
    hash: `art-bd-sc${sceneNumber}`,
    details: isBreakdownDirty
      ? `Physical element manifest requires re-audit following scene rewrite.`
      : `All physical props, wardrobe, and location assets catalogued and locked.`,
    isAffected: isBreakdownDirty
  });
  edges.push({
    id: `edge-${rootId}-${bdNodeId}`,
    source: rootId,
    target: bdNodeId,
    label: "elements",
    isInvalidated: isBreakdownDirty
  });

  // 5. Continuity Rules
  const isContinuityDirty = flaggedScenes.includes(sceneNumber) ||
    project.continuityIssues.some((i) => i.affectedScenes.includes(sceneNumber) && i.status === "active");
  const contNodeId = `node-continuity-sc${sceneNumber}`;
  nodes.push({
    id: contNodeId,
    label: "Continuity Rules",
    dept: "Script Supervisor",
    category: "continuity",
    status: isContinuityDirty ? "dirty" : "protected",
    statusText: isContinuityDirty ? "ISSUE FLAGGED" : "PASSING",
    hash: `cont-rules-sc${sceneNumber}`,
    details: isContinuityDirty
      ? `Active continuity violation detected in Scene ${sceneNumber}. Action required.`
      : `Zero temporal or spatial rule conflicts detected across scene boundaries.`,
    isAffected: isContinuityDirty
  });
  edges.push({
    id: `edge-${rootId}-${contNodeId}`,
    source: rootId,
    target: contNodeId,
    label: "canon invariants",
    isInvalidated: isContinuityDirty
  });

  // 6. 3D Spatial Previs
  const scene3DObjs = (project.scene3DObjects || []).filter((o) => o.sceneNumber === sceneNumber);
  const previsNodeId = `node-previs-sc${sceneNumber}`;
  nodes.push({
    id: previsNodeId,
    label: "3D Spatial Previs",
    dept: "Camera / Virtual",
    category: "previs",
    status: "protected",
    statusText: `${scene3DObjs.length} ENTITIES`,
    hash: `prev-3d-sc${sceneNumber}`,
    details: `Three.js glTF/GLB spatial staging containing ${scene3DObjs.length} blocking elements.`,
    isAffected: false
  });
  edges.push({
    id: `edge-${rootId}-${previsNodeId}`,
    source: rootId,
    target: previsNodeId,
    label: "blocking coords",
    isInvalidated: false
  });

  // 7. Reality Gate / Parallel Search
  const sceneResearch = (project.researchFindings || []).filter((r) => r.sceneNumber === sceneNumber);
  const realityNodeId = `node-reality-sc${sceneNumber}`;
  const hasResearch = sceneResearch.length > 0;
  nodes.push({
    id: realityNodeId,
    label: "Reality Gate",
    dept: "Parallel Search API",
    category: "research",
    status: hasResearch ? "research" : "protected",
    statusText: hasResearch ? "VERIFIED" : "ABSTAINED (DRAMA)",
    hash: `par-gate-sc${sceneNumber}`,
    details: hasResearch
      ? `Parallel Search corroboration verified fact veracity for technical claims.`
      : "Zero compute expended on purely fictional dramatic dialogue.",
    isAffected: false
  });
  edges.push({
    id: `edge-${rootId}-${realityNodeId}`,
    source: rootId,
    target: realityNodeId,
    label: "fact check",
    isInvalidated: false
  });

  return { nodes, edges };
}

/**
 * Generate smooth SVG path string from Dagre point coordinates.
 */
function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Compute optimal hierarchical layout using Dagre library.
 */
export function computeGraphLayout(
  nodes: BlastRadiusGraphNode[],
  edges: BlastRadiusGraphEdge[],
  options: LayoutOptions = {}
): ComputedGraphLayout {
  const {
    direction = "TB",
    nodeWidth = 148,
    nodeHeight = 44,
    nodeSep = 36,
    rankSep = 48,
    showAffectedOnly = false
  } = options;

  let filteredNodes = nodes;
  let filteredEdges = edges;

  if (showAffectedOnly) {
    const affectedNodeIds = new Set(
      nodes.filter((n) => n.status === "root" || n.status === "dirty" || n.isAffected).map((n) => n.id)
    );
    filteredNodes = nodes.filter((n) => affectedNodeIds.has(n.id));
    filteredEdges = edges.filter(
      (e) => affectedNodeIds.has(e.source) && affectedNodeIds.has(e.target)
    );
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 24,
    marginy: 24
  });
  g.setDefaultEdgeLabel(() => ({}));

  filteredNodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.status === "root" ? nodeWidth + 20 : nodeWidth,
      height: nodeHeight
    });
  });

  filteredEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const positionedNodes: PositionedNode[] = filteredNodes.map((node) => {
    const dagreNode = g.node(node.id) || { x: 0, y: 0, width: nodeWidth, height: nodeHeight };
    return {
      ...node,
      x: dagreNode.x,
      y: dagreNode.y,
      width: dagreNode.width || nodeWidth,
      height: dagreNode.height || nodeHeight
    };
  });

  const positionedEdges: PositionedEdge[] = filteredEdges.map((edge) => {
    const dagreEdge = g.edge(edge.source, edge.target) || { points: [] };
    const points = dagreEdge.points || [];
    return {
      ...edge,
      points,
      pathData: pointsToSvgPath(points)
    };
  });

  const graphInfo = g.graph();
  const width = Math.max(380, (graphInfo.width || 380) + 40);
  const height = Math.max(240, (graphInfo.height || 240) + 40);

  const affectedCount = nodes.filter((n) => n.status === "dirty" || n.isAffected).length;
  const protectedCount = nodes.filter((n) => n.status === "protected").length;

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width,
    height,
    affectedCount,
    protectedCount
  };
}
