import { useContext, useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { AppNode } from '../types';
import { HoverContext } from '../HoverContext';

const HANDLES: { id: string; position: Position }[] = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
];

export default function StateNode({ id, data, selected }: NodeProps<AppNode>) {
  const { updateNodeData } = useReactFlow();
  const hover = useContext(HoverContext);
  const isHoverSource = hover?.sourceId === id;
  const isHoverTarget = hover?.targetIds.has(id) ?? false;
  const dimmed = !!hover && !isHoverSource && !isHoverTarget;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim() || data.label;
    updateNodeData(id, { label: next });
    setDraft(next);
    setEditing(false);
  };

  return (
    <div
      className={`min-w-[150px] rounded-xl border bg-white px-4 py-3 text-center shadow-sm transition-all ${
        isHoverSource
          ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-300'
          : isHoverTarget
            ? 'border-emerald-500 ring-2 ring-emerald-300'
            : selected
              ? 'border-indigo-500 ring-2 ring-indigo-200'
              : 'border-slate-200 hover:shadow-md'
      } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
      style={{ borderTopColor: data.color, borderTopWidth: 4 }}
    >
      {/* Connection handles on every side; loose mode lets each act as source or target. */}
      {HANDLES.map((h) => (
        <Handle key={h.id} id={h.id} type="source" position={h.position} />
      ))}

      {data.initial && (
        <span
          className="absolute -left-2 -top-2 rounded-full bg-indigo-600 px-1.5 py-[1px] text-[9px] font-bold text-white shadow"
          title="Initial state"
        >
          ● initial
        </span>
      )}

      {editing ? (
        <input
          ref={inputRef}
          className="wf-node-input nodrag w-full rounded border border-indigo-300 px-1 text-center text-sm font-semibold text-slate-800 outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(data.label);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div
          className="select-none text-sm font-semibold text-slate-800"
          onDoubleClick={() => {
            setDraft(data.label);
            setEditing(true);
          }}
          title="Double-click to rename"
        >
          {data.label}
        </div>
      )}
    </div>
  );
}
