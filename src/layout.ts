import type { ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { AppNode, AppEdge, EdgeRoute } from './types';
import type { Point } from './pathUtils';
import { buildHoppedPaths, midpoint } from './edgePath';

export type LayoutDirection = 'LR' | 'TB';

// Lazy-load ELK (it's a large GWT-compiled bundle) so the canvas paints first;
// it loads on the first layout (auto-align), which happens just after mount.
type ElkInstance = { layout(graph: ElkNode): Promise<ElkNode> };
let elkPromise: Promise<ElkInstance> | null = null;
function getElk(): Promise<ElkInstance> {
  if (!elkPromise) {
    elkPromise = import('elkjs/lib/elk.bundled.js').then((m) => new m.default() as ElkInstance);
  }
  return elkPromise;
}

const FALLBACK_WIDTH = 160;
const FALLBACK_HEIGHT = 52;

/**
 * Estimate the size of an edge's label so ELK reserves space for it during
 * layout. We reserve the *expanded* size (title + a guard-chip row), so even
 * when a transition is focused and shows its chips, labels never overlap.
 */
function labelSize(title: string | undefined): { width: number; height: number } {
  const t = title ?? 'transition';
  return { width: Math.max(150, Math.round(t.length * 6.5) + 20), height: 40 };
}

/** Shared ELK spacing/label options — this is what replaces our manual lanes. */
function layoutOptions(direction: LayoutDirection): Record<string, string> {
  return {
    'elk.algorithm': 'layered',
    'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
    'elk.edgeRouting': 'ORTHOGONAL',
    // node / layer spacing (no node overlap)
    'elk.spacing.nodeNode': '60',
    'elk.layered.spacing.nodeNodeBetweenLayers': '90',
    // edge spacing (no edge-on-edge / edge-on-node)
    'elk.spacing.edgeNode': '24',
    'elk.spacing.edgeEdge': '14',
    'elk.layered.spacing.edgeNodeBetweenLayers': '24',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '14',
    // label spacing — ELK reserves room for the sized labels we pass in
    'elk.edgeLabels.placement': 'CENTER',
    'elk.spacing.edgeLabel': '6',
    'elk.spacing.labelNode': '12',
    // keep the diagram stable / predictable from the model order
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  };
}

/**
 * Lay out the workflow with Eclipse ELK (layered + orthogonal routing). ELK
 * places the nodes (no overlap), routes every edge as orthogonal bend points
 * that avoid nodes, and reserves space for the (sized) edge labels — so there
 * is no hand-rolled router or lane spacing. We then render ELK's bend points as
 * square paths (hopping over crossings) and place labels at ELK's positions.
 */
export async function layoutGraph(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: LayoutDirection = 'LR',
): Promise<{ nodes: AppNode[]; edges: AppEdge[] }> {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: layoutOptions(direction),
    children: nodes.map((n) => ({
      id: n.id,
      width: n.measured?.width ?? FALLBACK_WIDTH,
      height: n.measured?.height ?? FALLBACK_HEIGHT,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      labels: [{ id: `${e.id}__label`, text: e.data?.title ?? '', ...labelSize(e.data?.title) }],
    })),
  };

  const elk = await getElk();
  const res = await elk.layout(graph);

  const posById = new Map((res.children ?? []).map((c) => [c.id, c]));
  const laidOutNodes = nodes.map((n) => {
    const c = posById.get(n.id);
    return c && c.x != null && c.y != null ? { ...n, position: { x: c.x, y: c.y } } : n;
  });

  // Collect each edge's orthogonal points (start + bends + end) and label centre.
  const edgePoints = new Map<string, Point[]>();
  const labelCentre = new Map<string, Point>();
  for (const ee of res.edges ?? []) {
    const sec = ee.sections?.[0];
    if (sec) {
      edgePoints.set(ee.id, [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint]);
    }
    const lab = ee.labels?.[0];
    if (lab && lab.x != null && lab.y != null) {
      labelCentre.set(ee.id, { x: lab.x + (lab.width ?? 0) / 2, y: lab.y + (lab.height ?? 0) / 2 });
    }
  }

  const paths = buildHoppedPaths(
    [...edgePoints].map(([id, points]) => ({ id, points })),
  );

  const laidOutEdges = edges.map((e) => {
    const path = paths.get(e.id);
    const pts = edgePoints.get(e.id);
    let route: EdgeRoute | undefined;
    if (path && pts) {
      const centre = labelCentre.get(e.id) ?? midpoint(pts);
      route = { path, labelX: centre.x, labelY: centre.y };
    }
    return { ...e, data: { ...e.data, route } as AppEdge['data'] };
  });

  return { nodes: laidOutNodes, edges: laidOutEdges };
}
