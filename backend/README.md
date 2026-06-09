# Workflow store backend (Nick-compatible)

A tiny, zero-dependency Node service that persists workflow definitions in
**Nick's `workflows.json` format**
(<https://nick.docs.plone.org/developer-guide/workflows>) and exposes a small
REST API so the editor can list / open / save / create workflows.

> Why a separate service? Nick has no runtime API to edit workflow
> *definitions* — they are seeded from `src/profiles/default/workflows.json` on
> disk. This service owns that file. To apply changes to a real Nick instance,
> point `WORKFLOWS_FILE` at Nick's profile `workflows.json` (a mounted volume)
> and re-run `pnpm seed` / `pnpm seed:upgrade` in Nick.

## Run

```bash
# directly
node server.mjs                      # http://localhost:8090

# or with Docker (from repo root)
docker compose up --build
```

Env: `PORT` (default `8090`), `WORKFLOWS_FILE` (default `./data/workflows.json`).

## API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/workflows` | — | `[{ id, title }]` |
| `GET` | `/workflows/:id` | — | `{ purge, workflows: [wf] }` (Nick format) |
| `POST` | `/workflows` | `{ workflows: [wf] }` | `201 { id }` |
| `PUT` | `/workflows/:id` | `{ workflows: [wf] }` | `200 { id }` (upsert) |
| `DELETE` | `/workflows/:id` | — | `200 { ok }` |
| `GET` | `/health` | — | `{ ok: true }` |

CORS is open (`*`) so the Vite dev app (`localhost:5173`) can call it.
