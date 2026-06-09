import type { Point } from './pathUtils';

const HOP_R = 5; // radius of a crossing hop bridge

/** Midpoint of a polyline, by accumulated length (label fallback). */
export function midpoint(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    lens.push(l);
    total += l;
  }
  let target = total / 2;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i]) {
      const t = lens[i] === 0 ? 0 : target / lens[i];
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
      };
    }
    target -= lens[i];
  }
  return pts[pts.length - 1];
}

/** Build an SVG path through points, hopping horizontals over crossing verticals. */
function buildPath(points: Point[], hopsBySeg: Map<number, number[]>): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const horizontal = Math.abs(a.y - b.y) < 0.6;
    const hops = hopsBySeg.get(i);
    if (horizontal && hops && hops.length) {
      const dir = b.x > a.x ? 1 : -1;
      const ordered = [...hops].sort((p, q) => dir * (p - q));
      const sweep = dir > 0 ? 1 : 0; // keep the bump pointing "up"
      for (const hx of ordered) {
        d += ` L ${hx - dir * HOP_R},${a.y} A ${HOP_R} ${HOP_R} 0 0 ${sweep} ${hx + dir * HOP_R},${a.y}`;
      }
    }
    d += ` L ${b.x},${b.y}`;
  }
  return d;
}

/**
 * Given every edge's orthogonal point list, return an SVG path per edge where
 * each horizontal segment hops over the vertical segments of *other* edges that
 * cross it (the schematic "bridge" convention). Geometry comes from the layout
 * engine; this only decides the rendering at crossings.
 */
export function buildHoppedPaths(edges: { id: string; points: Point[] }[]): Map<string, string> {
  const vSegs: { edge: string; x: number; y0: number; y1: number }[] = [];
  for (const e of edges) {
    for (let i = 0; i < e.points.length - 1; i++) {
      const a = e.points[i];
      const b = e.points[i + 1];
      if (Math.abs(a.x - b.x) < 0.6) {
        vSegs.push({ edge: e.id, x: a.x, y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
      }
    }
  }
  const EPS = 1;
  const out = new Map<string, string>();
  for (const e of edges) {
    const hopsBySeg = new Map<number, number[]>();
    for (let i = 0; i < e.points.length - 1; i++) {
      const a = e.points[i];
      const b = e.points[i + 1];
      if (Math.abs(a.y - b.y) >= 0.6) continue; // only horizontals hop
      const y = a.y;
      const x0 = Math.min(a.x, b.x);
      const x1 = Math.max(a.x, b.x);
      const xs: number[] = [];
      for (const v of vSegs) {
        if (v.edge === e.id) continue;
        if (v.x > x0 + EPS && v.x < x1 - EPS && y > v.y0 + EPS && y < v.y1 - EPS) xs.push(v.x);
      }
      if (xs.length) hopsBySeg.set(i, xs);
    }
    out.set(e.id, buildPath(e.points, hopsBySeg));
  }
  return out;
}
