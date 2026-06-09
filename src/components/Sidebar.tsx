import { ROLES } from '../roles';

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-5 border-r border-slate-200 bg-white p-4">
      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Palette
        </h2>
        <div
          className="flex cursor-grab items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 active:cursor-grabbing"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', 'state');
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          <span className="h-3 w-3 rounded-full bg-indigo-500" />
          Workflow state
        </div>
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          Drag onto the canvas to add a new state.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Roles
        </h2>
        <ul className="flex flex-col gap-1.5">
          {ROLES.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        <p className="mb-1 font-semibold text-slate-600">Tips</p>
        <ul className="list-disc pl-4">
          <li>Drag from a state's edge dots to connect.</li>
          <li>Double-click a state to rename.</li>
          <li>Click a transition to guard it by roles or permissions.</li>
          <li>Select + press Delete to remove.</li>
        </ul>
      </div>
    </aside>
  );
}
