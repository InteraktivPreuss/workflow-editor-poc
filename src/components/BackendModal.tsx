import { useCallback, useEffect, useState } from 'react';
import type { WorkflowExport } from '../types';
import {
  listWorkflows,
  getWorkflow,
  saveWorkflow,
  deleteWorkflow,
  type WorkflowListItem,
} from '../backend';

export default function BackendModal({
  onClose,
  baseUrl,
  setBaseUrl,
  meta,
  setMeta,
  currentExport,
  onLoad,
  onNewBlank,
}: {
  onClose: () => void;
  baseUrl: string;
  setBaseUrl: (s: string) => void;
  meta: { id: string; title: string; description: string };
  setMeta: (m: { id: string; title: string; description: string }) => void;
  currentExport: WorkflowExport;
  onLoad: (wf: WorkflowExport) => void;
  onNewBlank: () => void;
}) {
  const [list, setList] = useState<WorkflowListItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setList(await listWorkflows(baseUrl));
    } catch (e) {
      setList(null);
      setError(`Can't reach backend at ${baseUrl} — ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const open = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      onLoad(await getWorkflow(baseUrl, id));
      setNote(`Opened "${id}".`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveWorkflow(baseUrl, meta.id, currentExport);
      setNote(`Saved "${meta.id}".`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteWorkflow(baseUrl, id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Nick backend</h3>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose}>✕</button>
        </div>

        {/* Backend URL */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Backend URL</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8090"
            />
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={refresh}
              disabled={busy}
            >
              {busy ? '…' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        {note && !error && <p className="text-xs font-medium text-emerald-600">{note}</p>}

        {/* Workflow list */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Workflows on server</label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
            {!list && <p className="px-3 py-2 text-sm text-slate-400">—</p>}
            {list && list.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No workflows yet.</p>
            )}
            {list?.map((w) => (
              <div key={w.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-700">{w.title}</div>
                  <div className="truncate text-[11px] text-slate-400">{w.id}</div>
                </div>
                <button
                  className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                  onClick={() => open(w.id)}
                  disabled={busy}
                >
                  Open
                </button>
                <button
                  className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => remove(w.id)}
                  disabled={busy}
                  title="Delete on server"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current workflow (id/title) + save */}
        <div className="rounded-lg bg-slate-50 p-3">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Current workflow</label>
          <div className="flex flex-col gap-2">
            <input
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="Title"
            />
            <input
              className="rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs outline-none focus:border-indigo-400"
              value={meta.id}
              onChange={(e) => setMeta({ ...meta, id: e.target.value.trim() })}
              placeholder="workflow_id"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              onClick={save}
              disabled={busy || !meta.id}
            >
              Save to server
            </button>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onNewBlank();
                onClose();
              }}
            >
              New workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
