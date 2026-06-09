import { createContext } from 'react';

/**
 * Which state is hovered and the forward transitions/states that should light
 * up. `null` when nothing is hovered. Shared with nodes and edges via context.
 */
export type HoverState = {
  sourceId: string;
  edgeIds: Set<string>;
  targetIds: Set<string>;
} | null;

export const HoverContext = createContext<HoverState>(null);
