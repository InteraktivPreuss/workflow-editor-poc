import type { Node, Edge } from '@xyflow/react';

/** A Plone-style workflow state (a node on the canvas). */
export type StateNodeData = {
  label: string;
  /** Accent colour for the state card. */
  color: string;
};
export type AppNode = Node<StateNodeData, 'state'>;

/**
 * A Plone-style transition (an edge between two states).
 *
 * The guard mirrors DCWorkflow: it can be guarded by roles and/or permissions.
 * Within a category any one match suffices (OR); categories combine with AND.
 * An empty guard means anyone may perform the transition.
 */
/** A pre-computed, orthogonal edge route (from auto-layout) with crossing hops. */
export type EdgeRoute = {
  /** Ready-to-render SVG path (square corners, hop bridges at crossings). */
  path: string;
  labelX: number;
  labelY: number;
};

export type TransitionEdgeData = {
  title: string;
  /** Role ids allowed to perform this transition (guard_roles). */
  roles: string[];
  /** Permission ids allowed to perform this transition (guard_permissions). */
  permissions: string[];
  /** Routed path from the last auto-align; absent edges fall back to floating. */
  route?: EdgeRoute;
};
export type AppEdge = Edge<TransitionEdgeData, 'transition'>;

/** Serializable representation used for JSON export / import. */
export interface WorkflowState {
  id: string;
  title: string;
  color: string;
  position: { x: number; y: number };
}
export interface WorkflowTransition {
  id: string;
  title: string;
  from: string;
  to: string;
  /** guard_roles */
  roles: string[];
  /** guard_permissions */
  permissions: string[];
}
export interface WorkflowDefinition {
  id: string;
  title: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}
