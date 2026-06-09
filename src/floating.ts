import { Position, type InternalNode } from '@xyflow/react';

type Point = { x: number; y: number };

/**
 * Floating-edge geometry (adapted from the React Flow "floating edges" example):
 * find where the line between two node centres crosses each node's border, so an
 * edge attaches to the side facing the other node. Used as a fallback for edges
 * that don't yet have a routed path from auto-align.
 */
function getNodeIntersection(node: InternalNode, other: InternalNode): Point {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const nx = node.internals.positionAbsolute.x + w;
  const ny = node.internals.positionAbsolute.y + h;
  const ox = other.internals.positionAbsolute.x + (other.measured.width ?? 0) / 2;
  const oy = other.internals.positionAbsolute.y + (other.measured.height ?? 0) / 2;

  if (w === 0 || h === 0) return { x: nx, y: ny };

  const xx1 = (ox - nx) / (2 * w) - (oy - ny) / (2 * h);
  const yy1 = (ox - nx) / (2 * w) + (oy - ny) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  return { x: w * (xx3 + yy3) + nx, y: h * (-xx3 + yy3) + ny };
}

function getEdgePosition(node: InternalNode, p: Point): Position {
  const nx = node.internals.positionAbsolute.x;
  const ny = node.internals.positionAbsolute.y;
  const w = node.measured.width ?? 0;
  if (p.x <= nx + 1) return Position.Left;
  if (p.x >= nx + w - 1) return Position.Right;
  if (p.y <= ny + 1) return Position.Top;
  return Position.Bottom;
}

export function nodeCenter(n: InternalNode): Point {
  return {
    x: n.internals.positionAbsolute.x + (n.measured.width ?? 0) / 2,
    y: n.internals.positionAbsolute.y + (n.measured.height ?? 0) / 2,
  };
}

export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sp = getNodeIntersection(source, target);
  const tp = getNodeIntersection(target, source);
  return {
    sx: sp.x,
    sy: sp.y,
    tx: tp.x,
    ty: tp.y,
    sourcePos: getEdgePosition(source, sp),
    targetPos: getEdgePosition(target, tp),
  };
}
