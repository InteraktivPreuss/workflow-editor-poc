# Plone Workflow Editor — POC

A graphical drag-and-drop workflow editor for Plone / Volto / Aurora-style
workflows. States are nodes, transitions are edges, and each transition is
guarded by roles and/or permissions.

The canvas loads a small **Example Publication Workflow**: three states
(`private → pending review → published`) and a few transitions (submit,
publish, reject, retract), guarded by a mix of roles and permissions to show
both guard kinds.

> Proof of concept — there is no backend; roles and permissions are static lists.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **[React Flow 12](https://reactflow.dev) (`@xyflow/react`)** — node/edge canvas
- **[Eclipse ELK](https://eclipse.dev/elk/) (`elkjs`)** — layered auto-layout **+ orthogonal edge routing + label-space reservation** (lazy-loaded)
- **Tailwind CSS v4** (`@tailwindcss/vite`)

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## What it does

- **Add states** — drag "Workflow state" from the palette onto the canvas, or
  use *+ Add state*.
- **Connect** — drag from any of a state's four handles to another state. Loose
  connection mode means you can start from any side.
- **Transition guards (roles *and/or* permissions)** — click a transition, then
  use the **Roles / Permissions** tabs in the Inspector. This mirrors Plone's
  DCWorkflow guard: a transition can carry several roles (e.g. *Manager* +
  *Site Administrator*, solid colour chips) and/or several permissions (e.g.
  *Review portal content*, outlined 🔑 chips). Within a category any one match
  is enough; categories combine with AND. Plone's default workflows actually
  guard transitions by permission, so this is the more idiomatic option.
- **Multiple connections per state** — a state can have any number of incoming
  and outgoing transitions, each independently editable.
- **Auto-align** — the *✨ Auto-align* button lays the graph out with **Eclipse
  ELK** (`elk.algorithm: layered`, `edgeRouting: ORTHOGONAL`); the *↧* button
  switches to top-to-bottom. ELK does the whole job we used to hand-roll:
  - **node placement** sized by measured dimensions, so cards never overlap;
  - **orthogonal (square) edge routing** with bend points that avoid nodes;
  - **distinct ports**, so parallel/bidirectional edges don't pile up;
  - **reserved label space** — each transition label is fed to ELK with its
    measured size, so the layout opens up room for it (no manual lane spacing).

  We render ELK's bend points as square paths (drawing a small **hop bridge**
  where one crosses another, `src/edgePath.ts`) and place labels at ELK's
  computed positions. The layout runs once on load (when React Flow reports the
  nodes measured, stable under StrictMode) and the view animates to fit.
  Dragging a node temporarily un-routes its edges (they float live, with
  parallel/bidirectional ones separated) until the next auto-align.
- **Hover / select highlight** — hovering a state — or selecting it, in which
  case it **stays highlighted** — lights up the state, **all** its outgoing
  transitions (including "send back" ones, e.g. back to private) and their
  target states; the highlighted transitions get **flowing arrows** animating
  from source to target, while everything else dims for focus.
- **Labels** — every transition shows a compact title at all times; the guard
  chips (roles/permissions) and the delete button expand only when the
  transition is focused (its state hovered/selected, or the edge selected), so
  the canvas stays readable without hiding what the transitions are.
- **Edit** — double-click a state to rename; use the Inspector to change its
  name/colour. Selecting a state also lists its outgoing transitions in the
  Inspector (below *Delete state*) — click one to edit that transition. You can
  also click a transition directly; either way its settings panel is the same.
- **Disconnect / delete** — the *×* on a transition removes it, or select
  anything and press <kbd>Delete</kbd> / <kbd>Backspace</kbd>.
- **JSON export / import** — *JSON export / import* opens the serialized
  workflow (`states` + `transitions` with `from`/`to`/`roles`/`permissions`); edit and
  *Apply to canvas* to re-import. This is the seam to wire up to a real Plone
  DCWorkflow definition later.

## Project layout

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Canvas, toolbar, drag-and-drop, wiring |
| `src/components/StateNode.tsx` | Workflow state node (rename, handles) |
| `src/components/TransitionEdge.tsx` | Transition edge (role chips, delete) |
| `src/components/Inspector.tsx` | Edit selected state / transition |
| `src/components/Sidebar.tsx` | Palette + role legend |
| `src/components/JsonModal.tsx` | JSON export / import |
| `src/roles.ts` | Fake Plone-style roles |
| `src/permissions.ts` | Fake Plone permissions (guard_permissions) |
| `src/layout.ts` | ELK layered layout + routing + label reservation |
| `src/edgePath.ts` | Renders ELK bend points as square paths with crossing hops |
| `src/serialize.ts` | Canvas ⇄ workflow JSON |
| `src/types.ts` | Domain + React Flow types |
