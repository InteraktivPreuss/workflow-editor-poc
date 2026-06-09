import type {
  AppNode,
  AppEdge,
  PloneState,
  PloneTransition,
  WorkflowExport,
} from './types';
import { transitionEdge } from './edgeFactory';

const PALETTE = ['#64748b', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444'];

/**
 * Canvas -> Plone `workflows.json` (https://nick.docs.plone.org/developer-guide/workflows).
 * Each edge becomes a transition (`new_state` = its target, `permission` = its
 * guard); each state lists the ids of the transitions that leave it. Editor-only
 * data (colour, position) is intentionally not part of the Plone format.
 */
export function toWorkflow(
  nodes: AppNode[],
  edges: AppEdge[],
  meta: { id: string; title: string; description?: string },
): WorkflowExport {
  const states: Record<string, PloneState> = {};
  for (const n of nodes) {
    states[n.id] = {
      'title:i18n': n.data.label,
      'description:i18n': n.data.description ?? '',
      transitions: edges.filter((e) => e.source === n.id).map((e) => e.id),
      permissions: n.data.permissions ?? {},
    };
  }

  const transitions: Record<string, PloneTransition> = {};
  for (const e of edges) {
    transitions[e.id] = {
      'title:i18n': e.data?.title ?? e.id,
      new_state: e.target,
      permission: e.data?.permission ?? '',
    };
  }

  const initial = nodes.find((n) => n.data.initial)?.id ?? nodes[0]?.id ?? '';

  return {
    purge: false,
    workflows: [
      {
        id: meta.id,
        'title:i18n': meta.title,
        'description:i18n': meta.description ?? '',
        json: { initial_state: initial, states, transitions },
      },
    ],
  };
}

/**
 * Plone `workflows.json` -> canvas. Reads the first workflow. A transition that
 * several states list becomes one edge per source state. Colours are assigned
 * from a palette and positions are placeholders (Auto-align lays them out).
 */
export function fromWorkflow(data: WorkflowExport): { nodes: AppNode[]; edges: AppEdge[] } {
  const wf = data.workflows?.[0];
  if (!wf?.json) return { nodes: [], edges: [] };
  const { initial_state, states, transitions } = wf.json;

  const stateIds = Object.keys(states ?? {});
  const nodes: AppNode[] = stateIds.map((id, i) => ({
    id,
    type: 'state',
    position: { x: 80 + i * 240, y: 160 },
    data: {
      label: states[id]['title:i18n'] ?? id,
      description: states[id]['description:i18n'] ?? '',
      color: PALETTE[i % PALETTE.length],
      initial: id === initial_state,
      permissions: states[id].permissions ?? {},
    },
  }));

  const edges: AppEdge[] = [];
  for (const sid of stateIds) {
    for (const tid of states[sid].transitions ?? []) {
      const t = transitions?.[tid];
      if (!t) continue; // transition referenced but not defined — skip
      edges.push(
        transitionEdge(`${sid}__${tid}`, sid, t.new_state, {
          title: t['title:i18n'] ?? tid,
          permission: t.permission ?? '',
        }),
      );
    }
  }

  return { nodes, edges };
}
