import { useState } from 'react';
import type { WorkflowDefinition } from '../types';

export default function JsonModal({
  workflow,
  onClose,
  onApply,
}: {
  workflow: WorkflowDefinition;
  onClose: () => void;
  onApply: (wf: WorkflowDefinition) => void;
}) {
  const initial = JSON.stringify(workflow, null, 2);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    try {
      const parsed = JSON.parse(text) as WorkflowDefinition;
      if (!Array.isArray(parsed.states) || !Array.isArray(parsed.transitions)) {
        throw new Error('JSON must contain "states" and "transitions" arrays.');
      }
      onApply(parsed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const copy = () => navigator.clipboard?.writeText(text);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-700">Workflow JSON</h3>
          <button
            className="text-slate-400 hover:text-slate-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <textarea
          className="m-4 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 outline-none focus:border-indigo-400"
          spellCheck={false}
          rows={18}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        {error && (
          <p className="px-5 text-xs font-medium text-red-600">{error}</p>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={copy}
          >
            Copy
          </button>
          <button
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={apply}
          >
            Apply to canvas
          </button>
        </div>
      </div>
    </div>
  );
}
