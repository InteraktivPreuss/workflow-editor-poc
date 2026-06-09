import type { Node, Edge } from '@xyflow/react';

/** A pre-computed, orthogonal edge route (from auto-layout) with crossing hops. */
export type EdgeRoute = {
  /** Ready-to-render SVG path (square corners, hop bridges at crossings). */
  path: string;
  labelX: number;
  labelY: number;
};

/**
 * A Plone workflow state (a node on the canvas).
 *
 * `permissions` is the state's permission map: role id -> the permission ids
 * that role holds while content is in this state (Plone's per-state
 * permission-map). `color`/`position` are editor-only (not part of Plone).
 */
export type StateNodeData = {
  label: string;
  color: string;
  description?: string;
  /** Whether this is the workflow's initial state (exactly one). */
  initial?: boolean;
  /** role id -> permission ids granted in this state. */
  permissions: Record<string, string[]>;
};
export type AppNode = Node<StateNodeData, 'state'>;

/**
 * A Plone workflow transition (an edge). The source state is implied by which
 * state lists this transition; the target is `new_state`. Guarded by a single
 * permission (Plone `guard_permissions`); empty means anyone may fire it.
 */
export type TransitionEdgeData = {
  title: string;
  /** Guard permission id; '' / undefined = no guard (anyone). */
  permission?: string;
  /** Routed path from the last auto-align; absent edges fall back to floating. */
  route?: EdgeRoute;
};
export type AppEdge = Edge<TransitionEdgeData, 'transition'>;

// --- Plone workflows.json shape (import/export) ---
// https://nick.docs.plone.org/developer-guide/workflows

export interface PloneState {
  'title:i18n': string;
  'description:i18n'?: string;
  /** Ids of the transitions available from this state (exit transitions). */
  transitions: string[];
  /** role id -> permission ids granted in this state. */
  permissions: Record<string, string[]>;
}

export interface PloneTransition {
  'title:i18n': string;
  /** Target state id. */
  new_state: string;
  /** Guard permission (single). */
  permission?: string;
}

export interface PloneWorkflowJson {
  initial_state: string;
  states: Record<string, PloneState>;
  transitions: Record<string, PloneTransition>;
}

export interface PloneWorkflow {
  id: string;
  'title:i18n': string;
  'description:i18n'?: string;
  json: PloneWorkflowJson;
}

export interface WorkflowExport {
  purge?: boolean;
  workflows: PloneWorkflow[];
}
