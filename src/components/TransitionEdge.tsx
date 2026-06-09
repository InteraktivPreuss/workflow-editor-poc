import { useContext } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useInternalNode,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { AppEdge } from '../types';
import { roleById } from '../roles';
import { permissionById } from '../permissions';
import { getEdgeParams, nodeCenter } from '../floating';
import { HoverContext } from '../HoverContext';

const HIGHLIGHT = '#4f46e5';

export default function TransitionEdge({
  id,
  source,
  target,
  data,
  selected,
  markerEnd,
}: EdgeProps<AppEdge>) {
  const { setEdges, setNodes, getEdges } = useReactFlow();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const hover = useContext(HoverContext);

  const highlighted = hover?.edgeIds.has(id) ?? false;
  const dimmed = !!hover && !highlighted;
  const focused = highlighted || selected;

  // Prefer the squared-off routed path from auto-align; otherwise fall back to
  // an orthogonal step path floating between the two nodes.
  let path: string;
  let labelX: number;
  let labelY: number;
  const route = data?.route;

  if (route?.path) {
    path = route.path;
    labelX = route.labelX;
    labelY = route.labelY;
  } else if (sourceNode && targetNode) {
    const params = getEdgeParams(sourceNode, targetNode);
    let { sx, sy, tx, ty } = params;
    // Separate parallel / bidirectional edges (e.g. submit & reject between the
    // same two states) so they don't sit on top of each other while floating.
    const sibs = getEdges().filter(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source),
    );
    if (sibs.length > 1) {
      const idx = sibs.findIndex((e) => e.id === id);
      const off = (idx - (sibs.length - 1) / 2) * 24;
      // Perpendicular to a canonical source/target axis, so siblings fan apart.
      const a = nodeCenter(source < target ? sourceNode : targetNode);
      const b = nodeCenter(source < target ? targetNode : sourceNode);
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const px = -(b.y - a.y) / len;
      const py = (b.x - a.x) / len;
      sx += px * off;
      sy += py * off;
      tx += px * off;
      ty += py * off;
    }
    const [p, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: params.sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: params.targetPos,
      borderRadius: 0, // square corners
    });
    path = p;
    labelX = lx;
    labelY = ly;
  } else {
    return null;
  }

  const roles = data?.roles ?? [];
  const permissions = data?.permissions ?? [];
  const empty = roles.length === 0 && permissions.length === 0;

  const stroke = highlighted ? '#a5b4fc' : selected ? HIGHLIGHT : '#94a3b8';
  const strokeWidth = highlighted ? 3 : selected ? 2.5 : 1.5;

  const selectThis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((es) => es.map((ed) => ({ ...ed, selected: ed.id === id })));
  };

  const deleteThis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((es) => es.filter((ed) => ed.id !== id));
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth, opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.15s' }}
      />
      {/* Animated flow overlay: little arrows marching source -> target. */}
      {highlighted && (
        <path
          d={path}
          fill="none"
          stroke={HIGHLIGHT}
          strokeWidth={3}
          strokeLinecap="round"
          className="wf-edge-flow"
        />
      )}
      {/* The title is always visible (compact); the guard chips + delete expand
          only when the transition is focused (hovered/selected state or edge). */}
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan pointer-events-auto absolute flex max-w-[190px] flex-col items-center gap-0.5 rounded-md border bg-white px-1.5 py-0.5 shadow-sm transition-opacity ${
            focused ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'
          }`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity: dimmed ? 0.25 : 1,
            zIndex: focused ? 10 : 1,
          }}
          onClick={selectThis}
        >
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap text-[10px] font-semibold text-slate-700">
              {data?.title || 'transition'}
            </span>
            {focused && (
              <button
                className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
                onClick={deleteThis}
                title="Delete transition"
              >
                ×
              </button>
            )}
          </div>
          {focused && (
          <div className="flex flex-wrap justify-center gap-1">
            {empty && (
              <span className="rounded-full bg-slate-100 px-2 py-[1px] text-[10px] font-medium text-slate-400">
                no guard — anyone
              </span>
            )}
            {/* Role guards: solid colour-coded pills. */}
            {roles.map((r) => {
              const role = roleById(r);
              return (
                <span
                  key={`role-${r}`}
                  className="rounded-full px-2 py-[1px] text-[10px] font-semibold text-white"
                  style={{ backgroundColor: role?.color ?? '#64748b' }}
                >
                  {role?.label ?? r}
                </span>
              );
            })}
            {/* Permission guards: outlined pills with a key glyph, visually distinct. */}
            {permissions.map((p) => {
              const perm = permissionById(p);
              return (
                <span
                  key={`perm-${p}`}
                  className="flex items-center gap-0.5 rounded-full border border-amber-400 bg-amber-50 px-2 py-[1px] text-[10px] font-semibold text-amber-700"
                >
                  <span aria-hidden>🔑</span>
                  {perm?.label ?? p}
                </span>
              );
            })}
          </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
