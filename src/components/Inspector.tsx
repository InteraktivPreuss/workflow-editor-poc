import { useReactFlow } from '@xyflow/react';
import type { AppNode, AppEdge } from '../types';
import { ROLES } from '../roles';
import { PERMISSIONS, permissionById } from '../permissions';

const NODE_COLORS = [
  '#64748b', '#ef4444', '#f59e0b', '#10b981',
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899',
];

export default function Inspector({
  node,
  edge,
  nodes,
  edges,
}: {
  node: AppNode | null;
  edge: AppEdge | null;
  nodes: AppNode[];
  edges: AppEdge[];
}) {
  const { updateNodeData, updateEdgeData, deleteElements, setNodes, setEdges } = useReactFlow();

  const selectEdge = (id: string) => {
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((es) => es.map((e) => ({ ...e, selected: e.id === id })));
  };
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id;
  const outgoing = node ? edges.filter((e) => e.source === node.id) : [];

  // Mark this state initial and clear the flag on all others (exactly one).
  const setInitial = (id: string) =>
    setNodes((ns) =>
      ns.map((n) => ({ ...n, data: { ...n.data, initial: n.id === id } })),
    );

  // Toggle whether `role` holds `perm` in this state's permission map.
  const togglePerm = (role: string, perm: string) => {
    if (!node) return;
    const map: Record<string, string[]> = { ...(node.data.permissions ?? {}) };
    const has = (map[role] ?? []).includes(perm);
    const next = has ? (map[role] ?? []).filter((p) => p !== perm) : [...(map[role] ?? []), perm];
    if (next.length) map[role] = next;
    else delete map[role];
    updateNodeData(node.id, { permissions: map });
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Inspector</h2>

      {!node && !edge && (
        <p className="text-sm text-slate-400">Select a state or a transition to edit it.</p>
      )}

      {node && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">State name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={node.data.label}
              onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={node.data.initial ?? false}
              onChange={() => setInitial(node.id)}
            />
            Initial state
          </label>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Description</label>
            <textarea
              className="w-full resize-none rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              rows={2}
              value={node.data.description ?? ''}
              onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Accent colour</label>
            <div className="flex flex-wrap gap-2">
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-6 w-6 rounded-full border-2 ${
                    node.data.color === c ? 'border-slate-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => updateNodeData(node.id, { color: c })}
                />
              ))}
            </div>
          </div>

          {/* Per-state permission map: which roles hold which permissions here. */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Permissions in this state
            </label>
            <div className="flex flex-col gap-2">
              {PERMISSIONS.map((p) => (
                <div key={p.id}>
                  <div className="mb-1 text-[11px] font-semibold text-slate-600">{p.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {ROLES.map((r) => {
                      const active = (node.data.permissions?.[r.id] ?? []).includes(p.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => togglePerm(r.id, p.id)}
                          className={`rounded-full px-2 py-[1px] text-[10px] font-semibold transition ${
                            active ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          style={active ? { backgroundColor: r.color } : undefined}
                          title={`${r.label} ${active ? 'has' : 'lacks'} "${p.label}"`}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            onClick={() => deleteElements({ nodes: [{ id: node.id }] })}
          >
            Delete state
          </button>

          {/* Transitions leaving this state; click one to edit it. */}
          <div className="border-t border-slate-200 pt-3">
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Transitions from this state ({outgoing.length})
            </label>
            {outgoing.length === 0 ? (
              <p className="text-xs text-slate-400">
                No outgoing transitions. Drag from this state to another to add one.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {outgoing.map((e) => {
                  const perm = e.data?.permission ? permissionById(e.data.permission) : undefined;
                  return (
                    <button
                      key={e.id}
                      onClick={() => selectEdge(e.id)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-left hover:border-indigo-300 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-700">
                          {e.data?.title || 'transition'}
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-slate-400">
                          → {labelOf(e.target)}
                        </span>
                      </div>
                      <div className="mt-1">
                        {e.data?.permission ? (
                          <span className="rounded-full border border-amber-400 bg-amber-50 px-1.5 py-[1px] text-[9px] font-semibold text-amber-700">
                            🔑 {perm?.label ?? e.data.permission}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-1.5 py-[1px] text-[9px] font-medium text-slate-400">
                            no guard
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {edge && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Transition name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={edge.data?.title ?? ''}
              onChange={(e) => updateEdgeData(edge.id, { title: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Guard permission
            </label>
            <p className="mb-2 text-[11px] leading-snug text-slate-400">
              The permission a user needs to fire this transition. Who holds it is
              set per state (above), mirroring Plone's guard_permissions.
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => updateEdgeData(edge.id, { permission: '' })}
                className={`rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                  !edge.data?.permission
                    ? 'border-slate-400 bg-slate-100 text-slate-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                No guard — anyone
                {!edge.data?.permission && <span className="ml-auto text-xs"> ✓</span>}
              </button>
              {PERMISSIONS.map((p) => {
                const active = edge.data?.permission === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateEdgeData(edge.id, { permission: p.id })}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                      active
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span aria-hidden>{active ? '🔑' : '🔒'}</span>
                    <span className="flex flex-col leading-tight">
                      <span>{p.label}</span>
                      <span className="text-[10px] text-slate-400">{p.zope}</span>
                    </span>
                    {active && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            onClick={() => deleteElements({ edges: [{ id: edge.id }] })}
          >
            Delete transition
          </button>
        </div>
      )}
    </aside>
  );
}
