import { MarkerType } from '@xyflow/react';
import type { AppEdge, TransitionEdgeData } from './types';

/** Build a transition edge with the shared styling (arrow head + type). */
export function transitionEdge(
  id: string,
  source: string,
  target: string,
  data: TransitionEdgeData,
  handles?: { sourceHandle?: string; targetHandle?: string },
): AppEdge {
  return {
    id,
    source,
    target,
    sourceHandle: handles?.sourceHandle,
    targetHandle: handles?.targetHandle,
    type: 'transition',
    data,
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#94a3b8' },
  };
}
