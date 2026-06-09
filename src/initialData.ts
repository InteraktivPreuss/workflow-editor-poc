import type { AppNode, AppEdge } from './types';
import { transitionEdge } from './edgeFactory';

/**
 * A small example workflow (a simple publication flow): three states and a few
 * transitions, guarded by a mix of roles and permissions to show both. The
 * auto-align router lays it out and routes the edges; the positions below are
 * just the pre-layout starting points.
 */
export const initialNodes: AppNode[] = [
  { id: 'private', type: 'state', position: { x: 80, y: 200 }, data: { label: 'Private', color: '#64748b' } },
  { id: 'pending', type: 'state', position: { x: 380, y: 200 }, data: { label: 'Pending review', color: '#f59e0b' } },
  { id: 'published', type: 'state', position: { x: 680, y: 200 }, data: { label: 'Published', color: '#10b981' } },
];

export const initialEdges: AppEdge[] = [
  transitionEdge('t_submit', 'private', 'pending', {
    title: 'submit',
    roles: ['Owner', 'Member'],
    permissions: [],
  }),
  transitionEdge('t_publish', 'pending', 'published', {
    title: 'publish',
    roles: [],
    permissions: ['Review portal content'],
  }),
  transitionEdge('t_reject', 'pending', 'private', {
    title: 'reject',
    roles: ['Reviewer'],
    permissions: [],
  }),
  transitionEdge('t_retract', 'published', 'private', {
    title: 'retract',
    roles: ['Manager'],
    permissions: [],
  }),
];
