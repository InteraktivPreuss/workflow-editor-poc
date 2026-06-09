import type { AppNode, AppEdge, WorkflowDefinition } from './types';
import { transitionEdge } from './edgeFactory';

/** Canvas state -> serializable workflow definition. */
export function toWorkflow(
  nodes: AppNode[],
  edges: AppEdge[],
  meta: { id: string; title: string },
): WorkflowDefinition {
  return {
    id: meta.id,
    title: meta.title,
    states: nodes.map((n) => ({
      id: n.id,
      title: n.data.label,
      color: n.data.color,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    })),
    transitions: edges.map((e) => ({
      id: e.id,
      title: e.data?.title ?? 'transition',
      from: e.source,
      to: e.target,
      roles: e.data?.roles ?? [],
      permissions: e.data?.permissions ?? [],
    })),
  };
}

/** Serializable workflow definition -> canvas state. */
export function fromWorkflow(wf: WorkflowDefinition): {
  nodes: AppNode[];
  edges: AppEdge[];
} {
  const nodes: AppNode[] = wf.states.map((s) => ({
    id: s.id,
    type: 'state',
    position: s.position,
    data: { label: s.title, color: s.color },
  }));
  const edges: AppEdge[] = wf.transitions.map((t) =>
    transitionEdge(t.id, t.from, t.to, {
      title: t.title,
      roles: t.roles ?? [],
      permissions: t.permissions ?? [],
    }),
  );
  return { nodes, edges };
}
