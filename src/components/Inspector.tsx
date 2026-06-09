import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { AppNode, AppEdge } from '../types';
import { ROLES, roleById } from '../roles';
import { PERMISSIONS, permissionById } from '../permissions';

type GuardTab = 'roles' | 'permissions';

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
  const [guardTab, setGuardTab] = useState<GuardTab>('roles');

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  // Select a transition (and deselect the state) so its settings panel opens.
  const selectEdge = (id: string) => {
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((es) => es.map((e) => ({ ...e, selected: e.id === id })));
  };
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id;
  const outgoing = node ? edges.filter((e) => e.source === node.id) : [];

  // When a transition is selected, focus the tab that actually holds its guard.
  const edgeId = edge?.id;
  const hasRoles = (edge?.data?.roles.length ?? 0) > 0;
  const hasPermissions = (edge?.data?.permissions.length ?? 0) > 0;
  useEffect(() => {
    if (hasPermissions && !hasRoles) setGuardTab('permissions');
    else if (hasRoles && !hasPermissions) setGuardTab('roles');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeId]);

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Inspector
      </h2>

      {!node && !edge && (
        <p className="text-sm text-slate-400">
          Select a state or a transition to edit it.
        </p>
      )}

      {node && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              State name
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={node.data.label}
              onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Accent colour
            </label>
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
          <button
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            onClick={() => deleteElements({ nodes: [{ id: node.id }] })}
          >
            Delete state
          </button>

          {/* All transitions leaving this state; click one to edit it. */}
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
                  const roles = e.data?.roles ?? [];
                  const permissions = e.data?.permissions ?? [];
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {roles.length === 0 && permissions.length === 0 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-[1px] text-[9px] font-medium text-slate-400">
                            no guard
                          </span>
                        )}
                        {roles.map((r) => {
                          const role = roleById(r);
                          return (
                            <span
                              key={`r-${r}`}
                              className="rounded-full px-1.5 py-[1px] text-[9px] font-semibold text-white"
                              style={{ backgroundColor: role?.color ?? '#64748b' }}
                            >
                              {role?.label ?? r}
                            </span>
                          );
                        })}
                        {permissions.map((p) => {
                          const perm = permissionById(p);
                          return (
                            <span
                              key={`p-${p}`}
                              className="flex items-center gap-0.5 rounded-full border border-amber-400 bg-amber-50 px-1.5 py-[1px] text-[9px] font-semibold text-amber-700"
                            >
                              <span aria-hidden>🔑</span>
                              {perm?.label ?? p}
                            </span>
                          );
                        })}
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
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Transition name
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={edge.data?.title ?? ''}
              onChange={(e) => updateEdgeData(edge.id, { title: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Transition guard
            </label>

            {/* Tabs: a transition can be guarded by roles and/or permissions. */}
            <div className="mb-3 flex rounded-lg bg-slate-100 p-0.5 text-sm font-semibold">
              <button
                className={`flex-1 rounded-md px-2 py-1 ${
                  guardTab === 'roles' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => setGuardTab('roles')}
              >
                Roles
                {(edge.data?.roles.length ?? 0) > 0 && (
                  <span className="ml-1 text-xs text-indigo-500">
                    {edge.data?.roles.length}
                  </span>
                )}
              </button>
              <button
                className={`flex-1 rounded-md px-2 py-1 ${
                  guardTab === 'permissions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                onClick={() => setGuardTab('permissions')}
              >
                Permissions
                {(edge.data?.permissions.length ?? 0) > 0 && (
                  <span className="ml-1 text-xs text-amber-600">
                    {edge.data?.permissions.length}
                  </span>
                )}
              </button>
            </div>

            {guardTab === 'roles' && (
              <div className="flex flex-col gap-1.5">
                {ROLES.map((r) => {
                  const active = edge.data?.roles.includes(r.id) ?? false;
                  return (
                    <button
                      key={r.id}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                        active
                          ? 'border-transparent text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      style={active ? { backgroundColor: r.color } : undefined}
                      onClick={() =>
                        updateEdgeData(edge.id, {
                          roles: toggle(edge.data?.roles ?? [], r.id),
                        })
                      }
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-white/60"
                        style={{ backgroundColor: r.color }}
                      />
                      {r.label}
                      {active && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {guardTab === 'permissions' && (
              <div className="flex flex-col gap-1.5">
                {PERMISSIONS.map((p) => {
                  const active = edge.data?.permissions.includes(p.id) ?? false;
                  return (
                    <button
                      key={p.id}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition ${
                        active
                          ? 'border-amber-400 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        updateEdgeData(edge.id, {
                          permissions: toggle(edge.data?.permissions ?? [], p.id),
                        })
                      }
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
            )}

            <p className="mt-2 text-[11px] leading-snug text-slate-400">
              Each category is optional. Within a category any one match is
              enough; roles and permissions combine with AND, mirroring Plone's
              DCWorkflow guard.
            </p>
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
