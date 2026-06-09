import type { AppNode, AppEdge } from './types';
import { transitionEdge } from './edgeFactory';

/**
 * A small example publication workflow, in the Plone model: three states with
 * per-state permission maps (role -> permissions granted in that state), and
 * transitions each guarded by a single permission. `private` is the initial
 * state. Positions are pre-layout starting points; Auto-align routes the rest.
 */
export const initialNodes: AppNode[] = [
  {
    id: 'private',
    type: 'state',
    position: { x: 80, y: 200 },
    data: {
      label: 'Private',
      color: '#64748b',
      initial: true,
      description: 'Visible only to the owner and reviewers.',
      permissions: {
        Owner: ['View', 'Modify portal content', 'Request review'],
        Manager: ['View', 'Modify portal content', 'Review portal content', 'Request review'],
        Reviewer: ['View'],
      },
    },
  },
  {
    id: 'pending',
    type: 'state',
    position: { x: 380, y: 200 },
    data: {
      label: 'Pending review',
      color: '#f59e0b',
      description: 'Submitted and awaiting review.',
      permissions: {
        Owner: ['View'],
        Reviewer: ['View', 'Review portal content'],
        Manager: ['View', 'Modify portal content', 'Review portal content'],
      },
    },
  },
  {
    id: 'published',
    type: 'state',
    position: { x: 680, y: 200 },
    data: {
      label: 'Published',
      color: '#10b981',
      description: 'Visible to everyone.',
      permissions: {
        Anonymous: ['View'],
        Owner: ['View'],
        Manager: ['View', 'Modify portal content'],
      },
    },
  },
];

export const initialEdges: AppEdge[] = [
  transitionEdge('submit', 'private', 'pending', { title: 'submit', permission: 'Request review' }),
  transitionEdge('publish', 'pending', 'published', { title: 'publish', permission: 'Review portal content' }),
  transitionEdge('reject', 'pending', 'private', { title: 'reject', permission: 'Review portal content' }),
  transitionEdge('retract', 'published', 'private', { title: 'retract', permission: 'Review portal content' }),
];
