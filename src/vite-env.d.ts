/// <reference types="vite/client" />

declare module 'elkjs/lib/elk.bundled.js' {
  export interface ElkPoint {
    x: number;
    y: number;
  }
  export interface ElkLabel {
    id?: string;
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
  export interface ElkEdgeSection {
    startPoint: ElkPoint;
    endPoint: ElkPoint;
    bendPoints?: ElkPoint[];
  }
  export interface ElkExtendedEdge {
    id: string;
    sources: string[];
    targets: string[];
    labels?: ElkLabel[];
    sections?: ElkEdgeSection[];
  }
  export interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    layoutOptions?: Record<string, string>;
    children?: ElkNode[];
    edges?: ElkExtendedEdge[];
    labels?: ElkLabel[];
  }
  export default class ELK {
    constructor(opts?: unknown);
    layout(graph: ElkNode, opts?: unknown): Promise<ElkNode>;
  }
}
