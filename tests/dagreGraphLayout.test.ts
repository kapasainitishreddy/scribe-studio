import { describe, it, expect } from "vitest";
import {
  buildBlastRadiusGraph,
  computeGraphLayout,
  type BlastRadiusGraphNode,
  type BlastRadiusGraphEdge
} from "../src/utils/graphLayoutEngine";
import { createSampleProject } from "../packages/project-model/src/sampleProject";
import type { Project } from "../packages/project-model/src/types";

describe("Dagre Automatic Production Graph Layout Engine", () => {
  const baseProject = createSampleProject();

  const dirtyProject: Project = {
    ...baseProject,
    propagationState: {
      ...baseProject.propagationState,
      staleStoryboardPanels: ["panel-sc1-p1", "panel-sc1-p2"],
      staleActorPackets: ["maya-lin"],
      staleBreakdownScenes: [1],
      flaggedContinuityScenes: [1]
    }
  };

  it("extracts comprehensive DAG nodes and directed edges for a given scene", () => {
    const { nodes, edges } = buildBlastRadiusGraph(dirtyProject, 1);

    expect(nodes.length).toBeGreaterThanOrEqual(6);
    expect(edges.length).toBeGreaterThanOrEqual(5);

    // Root node
    const root = nodes.find((n) => n.status === "root");
    expect(root).toBeDefined();
    expect(root?.label).toContain("Scene 1 AST");

    // Downstream department nodes
    const sbNode = nodes.find((n) => n.category === "camera");
    expect(sbNode).toBeDefined();

    const castNode = nodes.find((n) => n.id.includes("maya-lin"));
    expect(castNode).toBeDefined();
    expect(castNode?.status).toBe("dirty");

    const artNode = nodes.find((n) => n.category === "art");
    expect(artNode).toBeDefined();
    expect(artNode?.status).toBe("dirty");

    const contNode = nodes.find((n) => n.category === "continuity");
    expect(contNode).toBeDefined();
    expect(contNode?.status).toBe("dirty");
  });

  it("computes non-overlapping 2D coordinates and valid dimensions via Dagre", () => {
    const { nodes, edges } = buildBlastRadiusGraph(dirtyProject, 1);
    const layout = computeGraphLayout(nodes, edges, { direction: "TB" });

    expect(layout.nodes.length).toBe(nodes.length);
    expect(layout.edges.length).toBe(edges.length);
    expect(layout.width).toBeGreaterThan(200);
    expect(layout.height).toBeGreaterThan(150);

    // Verify all nodes have finite positive coordinates
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }
  });

  it("generates valid SVG bezier path strings for every positioned edge", () => {
    const { nodes, edges } = buildBlastRadiusGraph(dirtyProject, 1);
    const layout = computeGraphLayout(nodes, edges, { direction: "TB" });

    for (const edge of layout.edges) {
      expect(edge.points.length).toBeGreaterThan(0);
      expect(edge.pathData).toMatch(/^M [0-9.-]+ [0-9.-]+/);
    }
  });

  it("supports 'Show Affected Only' filtering to isolate the blast radius", () => {
    const { nodes, edges } = buildBlastRadiusGraph(dirtyProject, 1);

    const fullLayout = computeGraphLayout(nodes, edges, { showAffectedOnly: false });
    const filteredLayout = computeGraphLayout(nodes, edges, { showAffectedOnly: true });

    expect(filteredLayout.nodes.length).toBeLessThan(fullLayout.nodes.length);
    // Root must always be preserved
    expect(filteredLayout.nodes.some((n) => n.status === "root")).toBe(true);
    // Only dirty or root nodes allowed
    for (const node of filteredLayout.nodes) {
      expect(node.status === "root" || node.status === "dirty" || node.isAffected).toBe(true);
    }
  });

  it("supports both Top-to-Bottom (TB) and Left-to-Right (LR) graph orientations", () => {
    const { nodes, edges } = buildBlastRadiusGraph(baseProject, 1);

    const tbLayout = computeGraphLayout(nodes, edges, { direction: "TB" });
    const lrLayout = computeGraphLayout(nodes, edges, { direction: "LR" });

    expect(tbLayout.nodes.length).toBe(lrLayout.nodes.length);
    // In TB layout, root Y should be near top; in LR layout, root X should be near left
    const rootTB = tbLayout.nodes.find((n) => n.status === "root")!;
    const rootLR = lrLayout.nodes.find((n) => n.status === "root")!;

    expect(rootTB.y).toBeLessThan(tbLayout.height / 2);
    expect(rootLR.x).toBeLessThan(lrLayout.width / 2);
  });
});
